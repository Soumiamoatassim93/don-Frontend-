import React          from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View, Text, ScrollView, Image,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth }    from '../../contexts/AuthContext';
import { useAddDon }  from '../../hooks/useAddDon';
import { styles }     from './styles/AddDon';

const colors = { textLight: '#6b7280', primary: '#6366f1' };

const AddDonScreen = ({ navigation }) => {
  const { user } = useAuth();
  const {
    title, setTitle, description, setDescription,
    address, setAddress, categoryId, setCategoryId,
    images, errors, setErrors,
    categories, categoriesLoading,
    pickImages, removeImage, handleSubmit, getLocation, isLoading,
  } = useAddDon(user, navigation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Informations du don</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: null })); }}
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
          onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: null })); }}
          placeholder="Décrivez votre don..."
          placeholderTextColor={colors.textLight}
          multiline numberOfLines={4} textAlignVertical="top"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Adresse</Text>
        <TextInput
          style={styles.input} value={address} onChangeText={setAddress}
          placeholder="Adresse de récupération" placeholderTextColor={colors.textLight}
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
                <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(index)}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Catégorie *</Text>
        {categoriesLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
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
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
        onPress={handleSubmit} disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="white" />
          : <Text style={styles.submitText}>Publier le don</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddDonScreen;