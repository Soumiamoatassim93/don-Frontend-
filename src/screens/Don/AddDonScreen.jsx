import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import {styles} from './styles/AddDon';


const AddDonScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchCategories();
    getLocation();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await authService.api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoadingCategories(false);
    }
  };

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
        setAddress(`${g.streetNumber || ''} ${g.street || ''}, ${g.city || ''}, ${g.country || ''}`.trim());
      }
    } catch (err) {
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
      if (!result.canceled) {
        setImages(result.assets);
      }
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'ouvrir la galerie");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Le titre est requis';
    if (!description.trim()) newErrors.description = 'La description est requise';
    if (!categoryId) newErrors.category = 'La catégorie est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);

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
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

        formData.append('images', {
          uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
          name: filename,
          type,
        });
      });

      const token = await import('@react-native-async-storage/async-storage')
        .then(m => m.default.getItem('auth_token'));

      const response = await fetch(`${authService.api.defaults.baseURL}/dons`, {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

if (!response.ok) {
  const err = await response.json();
  console.log('❌ 400 détail:', JSON.stringify(err)); // ← ajoute ça
  throw new Error(err.message || 'Erreur lors de la création');
}

      Alert.alert('Succès', 'Votre don a été publié !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.log('❌ Erreur submit:', err.message);
      Alert.alert('Erreur', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Informations du don</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={(t) => { setTitle(t); setErrors(e => ({ ...e, title: null })); }}
          placeholder="Ex: Vélo en bon état"
          placeholderTextColor={colors.textLight}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          value={description}
          onChangeText={(t) => { setDescription(t); setErrors(e => ({ ...e, description: null })); }}
          placeholder="Décrivez votre don..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Adresse</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Adresse de récupération"
          placeholderTextColor={colors.textLight}
        />
        <TouchableOpacity onPress={getLocation} style={styles.gpsBtn}>
          <Text style={styles.gpsBtnText}>📍 Utiliser ma position GPS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Photos</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImages}>
          <Text style={styles.imagePickerText}>📷 Choisir des photos</Text>
        </TouchableOpacity>
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreview}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Catégorie *</Text>
        {loadingCategories ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipSelected]}
                onPress={() => { setCategoryId(cat.id); setErrors(e => ({ ...e, category: null })); }}
              >
                <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitText}>Publier le don</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};


export default AddDonScreen;