import { useEffect, useCallback, useState } from 'react';
import { Alert, Platform }                  from 'react-native';
import * as Location                        from 'expo-location';
import * as ImagePicker                     from 'expo-image-picker';
import { useAppDispatch, useAppSelector }   from '../store/hooks';
import { createDon, resetCreateStatus }     from '../store/slices/donsSlice';
import { fetchCategories }                  from '../store/slices/categoriesSlice';
import { authService }                      from '../services/auth.service';

export const useAddDon = (user, navigation) => {
  const dispatch = useAppDispatch();

  const categoriesList  = useAppSelector((s) => s.categories.list);
  const categoriesLoading = useAppSelector((s) => s.categories.loading);
  const createLoading   = useAppSelector((s) => s.dons.createLoading);
  const createSuccess   = useAppSelector((s) => s.dons.createSuccess);
  const createError     = useAppSelector((s) => s.dons.createError);

  // État local du formulaire (reste local car propre à ce screen)
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress]       = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [images, setImages]         = useState([]);
  const [errors, setErrors]         = useState({});
  const [location, setLocation]     = useState({ latitude: 0, longitude: 0 });

  // Charger les catégories si pas déjà en store
  useEffect(() => {
    if (categoriesList.length === 0) dispatch(fetchCategories());
  }, [dispatch, categoriesList.length]);

  // GPS au montage
  useEffect(() => {
    getLocation();
  }, []);

  // Réagir au succès de création
  useEffect(() => {
    if (createSuccess) {
      Alert.alert('Succès', 'Votre don a été publié !', [
        { text: 'OK', onPress: () => { dispatch(resetCreateStatus()); navigation.goBack(); } },
      ]);
    }
  }, [createSuccess, dispatch, navigation]);

  // Réagir à l'erreur de création
  useEffect(() => {
    if (createError) {
      Alert.alert('Erreur', createError);
      dispatch(resetCreateStatus());
    }
  }, [createError, dispatch]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Active le GPS pour ajouter une adresse automatique');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geocode.length > 0) {
        const g = geocode[0];
        setAddress(
          `${g.streetNumber || ''} ${g.street || ''}, ${g.city || ''}, ${g.country || ''}`.trim()
        );
      }
    } catch {
      console.log('GPS non disponible');
    }
  };

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
      if (!result.canceled) setImages(result.assets);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir la galerie");
    }
  };

  const removeImage = useCallback(
    (index) => setImages((prev) => prev.filter((_, i) => i !== index)),
    []
  );

  const validate = () => {
    const newErrors = {};
    if (!title.trim())       newErrors.title = 'Le titre est requis';
    if (!description.trim()) newErrors.description = 'La description est requise';
    if (!categoryId)         newErrors.category = 'La catégorie est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('categoryId', String(categoryId));
    formData.append('userId', String(user.id));
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    formData.append('address', address);
    formData.append('status', 'disponible');

    images.forEach((img) => {
      const filename = img.uri.split('/').pop();
      const match    = /\.(\w+)$/.exec(filename);
      const type     = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
      formData.append('images', {
        uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
        name: filename,
        type,
      });
    });

    dispatch(createDon(formData));
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