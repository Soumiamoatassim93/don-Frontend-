import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useEditDon } from '../../hooks/useEditDon';
import { styles }     from './styles/EditDon';

const EditDonScreen = ({ route, navigation }) => {
  const { don } = route.params;
  const {
    title, setTitle, description, setDescription,
    categoryId, setCategoryId, status, setStatus,
    images, errors, setErrors,
    categories, categoriesLoading,
    removeImage, handleSave, isLoading,
  } = useEditDon(don, navigation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>Modifier le don</Text>

      <Text style={styles.label}>Titre *</Text>
      <TextInput
        style={[styles.input, errors.title && styles.inputError]}
        value={title}
        onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: null })); }}
        placeholder="Ex: Vélo en bon état"
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
        value={description}
        onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: null })); }}
        placeholder="Décrivez votre don..."
        multiline numberOfLines={4} textAlignVertical="top"
      />
      {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

      <Text style={styles.label}>Catégorie *</Text>
      {categoriesLoading ? <ActivityIndicator /> : (
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipSelected]}
              onPress={() => { setCategoryId(cat.id); setErrors((e) => ({ ...e, category: null })); }}
            >
              <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextSelected]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

      <Text style={styles.label}>Statut</Text>
      <View style={styles.categoriesGrid}>
        {['disponible', 'pris'].map((s) => (
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

      <Text style={styles.label}>Images</Text>
      {images.map((url) => (
        <View key={url} style={styles.imageRow}>
          <Text style={{ flex: 1 }} numberOfLines={1}>{url}</Text>
          <TouchableOpacity onPress={() => removeImage(url)}>
            <Text style={{ color: 'red' }}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
        onPress={handleSave} disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Enregistrer</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditDonScreen;