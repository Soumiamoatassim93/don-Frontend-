import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { API_URL } from '../../../config';
import {styles} from './styles/EditDon';
const EditDonScreen = ({ route, navigation }) => {
  const { don } = route.params; // Don à modifier
  const [title, setTitle] = useState(don.title);
  const [description, setDescription] = useState(don.description);
  const [categoryId, setCategoryId] = useState(don.categoryId);
  const [status, setStatus] = useState(don.status);
  const [images, setImages] = useState(don.images.map(img => img.url)); 
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState({ latitude: don.latitude, longitude: don.longitude });

  useEffect(() => {
    fetchCategories();
    getLocation();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (err) {
      console.log('GPS non disponible');
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

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');

      const body = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        status,
        latitude: location.latitude,
        longitude: location.longitude,
        images,
        imagesToRemove,
      };

      const res = await fetch(`${API_URL}/dons/${don.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la mise à jour');
      }

      Alert.alert('Succès', 'Don mis à jour !', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (url) => {
    setImages(images.filter(i => i !== url));
    const imgToRemove = don.images.find(i => i.url === url);
    if (imgToRemove) setImagesToRemove([...imagesToRemove, imgToRemove.id]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>Modifier le don</Text>

      {/* Titre */}
      <Text style={styles.label}>Titre *</Text>
      <TextInput
        style={[styles.input, errors.title && styles.inputError]}
        value={title}
        onChangeText={(t) => { setTitle(t); setErrors(e => ({ ...e, title: null })); }}
        placeholder="Ex: Vélo en bon état"
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
        value={description}
        onChangeText={(t) => { setDescription(t); setErrors(e => ({ ...e, description: null })); }}
        placeholder="Décrivez votre don..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

      {/* Catégorie */}
      <Text style={styles.label}>Catégorie *</Text>
      {loadingCategories ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.categoriesGrid}>
          {categories.map(cat => (
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

      {/* Statut */}
      <Text style={styles.label}>Statut</Text>
      <View style={styles.categoriesGrid}>
        {['disponible', 'pris'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.categoryChip, status === s && styles.categoryChipSelected]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.categoryChipText, status === s && styles.categoryChipTextSelected]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Images */}
      <Text style={styles.label}>Images</Text>
      {images.map(url => (
        <View key={url} style={styles.imageRow}>
          <Text style={{ flex: 1 }}>{url}</Text>
          <TouchableOpacity onPress={() => removeImage(url)}>
            <Text style={{ color: 'red' }}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Bouton */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enregistrer</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};


export default EditDonScreen;