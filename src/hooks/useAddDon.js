// hooks/useAddDon.js
import { useEffect, useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createDon, resetCreateStatus } from '../store/slices/donsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';

export const useAddDon = (user, navigation) => {
  const dispatch = useAppDispatch();

  const categoriesList = useAppSelector((s) => s.categories.list);
  const categoriesLoading = useAppSelector((s) => s.categories.loading);
  const createLoading = useAppSelector((s) => s.dons.createLoading);
  const createSuccess = useAppSelector((s) => s.dons.createSuccess);
  const createError = useAppSelector((s) => s.dons.createError);

  // État local du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });

  // Charger les catégories
  useEffect(() => {
    if (categoriesList.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categoriesList.length]);

  // Récupérer la position GPS au montage
  useEffect(() => {
    getLocation();
  }, []);

  // Gérer le succès de création
  useEffect(() => {
    if (createSuccess) {
      Alert.alert('Succès', 'Votre don a été publié !', [
        { 
          text: 'OK', 
          onPress: () => { 
            dispatch(resetCreateStatus()); 
            navigation.goBack(); 
          } 
        },
      ]);
    }
  }, [createSuccess, dispatch, navigation]);

  // Gérer l'erreur de création
  useEffect(() => {
    if (createError) {
      Alert.alert('Erreur', createError);
      dispatch(resetCreateStatus());
    }
  }, [createError, dispatch]);

  // Récupérer la position GPS et l'adresse
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Active le GPS pour ajouter une adresse automatique');
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ 
        latitude: loc.coords.latitude, 
        longitude: loc.coords.longitude 
      });
      
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      
      if (geocode.length > 0) {
        const g = geocode[0];
        const formattedAddress = [
          g.streetNumber, g.street,
          g.postalCode, g.city,
          g.country
        ].filter(Boolean).join(' ');
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.log('GPS non disponible:', error);
    }
  };

  // Choisir des images
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "Active l'accès à la galerie");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets) {
        const selectedImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`,
        }));
        setImages((prev) => [...prev, ...selectedImages]);
      }
    } catch (error) {
      console.error('Erreur sélection images:', error);
      Alert.alert('Erreur', "Impossible d'ouvrir la galerie");
    }
  };

  // Supprimer une image
  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Validation du formulaire
  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Le titre est requis';
    if (!description.trim()) newErrors.description = 'La description est requise';
    if (!categoryId) newErrors.category = 'La catégorie est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    // Vérifier que l'utilisateur est connecté
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour publier un don');
      return;
    }

    console.log('📝 Envoi du don...');
    console.log('User ID:', user.id);
    console.log('Category ID:', categoryId);
    console.log('Images count:', images.length);
    console.log('Location:', location);

    const formData = new FormData();
    
    // Champs requis par le backend
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('categoryId', String(categoryId));
    formData.append('userId', String(user.id));
    formData.append('latitude', String(location.latitude || 0));
    formData.append('longitude', String(location.longitude || 0));
    formData.append('condition', 'nouveau');
    
    // Champs optionnels
    if (address && address.trim()) {
      formData.append('address', address.trim());
    }

    // Ajouter les images - Version sans "as any"
    images.forEach((img, index) => {
      const filename = img.name || `photo_${Date.now()}_${index}.jpg`;
      const uri = Platform.OS === 'android' ? img.uri : img.uri.replace('file://', '');
      
      // Créer un objet pour l'image
      const imageObject = {
        uri: uri,
        name: filename,
        type: img.type || 'image/jpeg',
      };
      
      formData.append('images', imageObject);
    });

    // Debug: Afficher le contenu du FormData
    console.log('📦 Contenu du FormData:');
    // Utiliser forEach sur les entrées si disponible
    if (formData._parts) {
      for (let i = 0; i < formData._parts.length; i++) {
        const pair = formData._parts[i];
        if (pair[1] && typeof pair[1] === 'object' && pair[1].uri) {
          console.log(`  ${pair[0]}: ${pair[1].name} (${pair[1].type})`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }
    }

    try {
      const result = await dispatch(createDon(formData)).unwrap();
      console.log('✅ Don créé avec succès:', result);
    } catch (error) {
      console.error('❌ Erreur création don:', error);
      Alert.alert('Erreur', error || 'Impossible de créer le don');
    }
  }, [dispatch, title, description, categoryId, user, location, address, images]);

  return {
    // Form state
    title, setTitle,
    description, setDescription,
    address, setAddress,
    categoryId, setCategoryId,
    images, errors, setErrors,
    // Data
    categories: categoriesList,
    categoriesLoading,
    // Actions
    pickImages,
    removeImage,
    handleSubmit,
    getLocation,
    // Loading
    isLoading: createLoading,
  };
};