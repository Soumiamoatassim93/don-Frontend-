import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { useFormValidation } from '../../hooks/useFormValidation';
import { styles } from './styles/RegisterScreen.styles';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const { register, isLoading, error, clearError } = useAuth();
  const { errors, validateRegisterForm, setErrors } = useFormValidation();

  const handleRegister = async () => {
    if (validateRegisterForm(email, password, confirmPassword)) {
      try {
        await register(email, password, name);
        // ✅ SUPPRIMEZ cette ligne - la navigation se fait automatiquement
        // navigation.replace('Home');
      } catch (error) {
        Alert.alert('Erreur', error);
      }
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
    clearError();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Inscrivez-vous pour commencer</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nom (optionnel)"
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              autoCapitalize="words"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({});
                clearError();
              }}
              placeholder="exemple@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({});
                clearError();
              }}
              placeholder="••••••"
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({});
                clearError();
              }}
              placeholder="••••••"
              secureTextEntry
              error={errors.confirmPassword}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title="S'inscrire"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
              <TouchableOpacity onPress={handleNavigateToLogin}>
                <Text style={styles.linkText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;