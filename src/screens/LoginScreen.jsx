import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';

const colors = {
  text: '#111827',
  textLight: '#6b7280',
  primary: '#6366f1',
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const { errors, validateLoginForm, setErrors } = useFormValidation();

  const handleLogin = async () => {
    if (validateLoginForm(email, password)) {
      try {
        await login(email, password);
      } catch (error) {
        Alert.alert('Erreur', error.message);
      }
    }
  };

  const handleNavigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({});
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
            }}
            placeholder="••••••"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity onPress={handleNavigateToRegister}>
              <Text style={styles.linkText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;