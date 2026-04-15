import { useEffect, useCallback, useState }  from 'react';
import { Alert }                             from 'react-native';
import * as Location                         from 'expo-location';
import { useAppDispatch, useAppSelector }    from '../store/hooks';
import { updateDon, resetUpdateStatus }      from '../store/slices/donsSlice';
import { fetchCategories }                   from '../store/slices/categoriesSlice';

export const useEditDon = (don, navigation) => {
  const dispatch = useAppDispatch();

  const categoriesList    = useAppSelector((s) => s.categories.list);
  const categoriesLoading = useAppSelector((s) => s.categories.loading);
  const updateLoading     = useAppSelector((s) => s.dons.updateLoading);
  const updateSuccess     = useAppSelector((s) => s.dons.updateSuccess);
  const updateError       = useAppSelector((s) => s.dons.updateError);

  // État local du formulaire
  const [title, setTitle]               = useState(don.title);
  const [description, setDescription]   = useState(don.description);
  const [categoryId, setCategoryId]     = useState(don.categoryId);
  const [status, setStatus]             = useState(don.status);
  const [images, setImages]             = useState(
    Array.isArray(don.images) ? don.images.map((img) => img.url ?? img) : []
  );
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [errors, setErrors]             = useState({});
  const [location, setLocation]         = useState({
    latitude: don.latitude,
    longitude: don.longitude,
  });

  // Charger les catégories si besoin
  useEffect(() => {
    if (categoriesList.length === 0) dispatch(fetchCategories());
  }, [dispatch, categoriesList.length]);

  // GPS
  useEffect(() => {
    getLocation();
  }, []);

  // Succès de la mise à jour
  useEffect(() => {
    if (updateSuccess) {
      Alert.alert('Succès', 'Don mis à jour !', [
        { text: 'OK', onPress: () => { dispatch(resetUpdateStatus()); navigation.goBack(); } },
      ]);
    }
  }, [updateSuccess, dispatch, navigation]);

  // Erreur de la mise à jour
  useEffect(() => {
    if (updateError) {
      Alert.alert('Erreur', updateError);
      dispatch(resetUpdateStatus());
    }
  }, [updateError, dispatch]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      console.log('GPS non disponible');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim())       newErrors.title = 'Le titre est requis';
    if (!description.trim()) newErrors.description = 'La description est requise';
    if (!categoryId)         newErrors.category = 'La catégorie est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const removeImage = useCallback(
    (url) => {
      setImages((prev) => prev.filter((i) => i !== url));
      const imgToRemove = don.images.find((i) => (i.url ?? i) === url);
      if (imgToRemove?.id) setImagesToRemove((prev) => [...prev, imgToRemove.id]);
    },
    [don.images]
  );

  const handleSave = useCallback(() => {
    if (!validate()) return;
    dispatch(
      updateDon({
        id: don.id,
        body: {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          status,
          latitude: location.latitude,
          longitude: location.longitude,
          images,
          imagesToRemove,
        },
      })
    );
  }, [dispatch, don.id, title, description, categoryId, status, location, images, imagesToRemove]);

  return {
    // Form state
    title, setTitle,
    description, setDescription,
    categoryId, setCategoryId,
    status, setStatus,
    images, errors, setErrors,
    // Data
    categories: categoriesList,
    categoriesLoading,
    // Actions
    removeImage,
    handleSave,
    getLocation,
    // Loading
    isLoading: updateLoading,
  };
};