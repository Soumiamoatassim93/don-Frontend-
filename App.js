import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddDonScreen from './src/screens/AddDonScreen';
import MesDonsScreen from './src/screens/MesDonsScreen';
import EditDonScreen from './src/screens/EditDonScreen';
const Stack = createNativeStackNavigator();

const LoadingSpinner = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
    <ActivityIndicator size="large" color="#6366f1" />
    <Text style={{ marginTop: 10, color: '#6b7280' }}>Chargement...</Text>
  </View>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerStyle: { backgroundColor: '#6366f1' },
      headerTintColor: 'white',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dons disponibles' }} />
    <Stack.Screen name="AddDon" component={AddDonScreen} options={{ title: 'Publier un don' }}/>
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon Profil' }} />
    <Stack.Screen name="MesDons" component={MesDonsScreen} options={{ title: 'Mes Dons' }} />
    <Stack.Screen name="EditDon" component={EditDonScreen} options={{ title: 'Modifier le don' }} />

  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  return (
    <NavigationContainer key={isAuthenticated ? 'auth' : 'guest'}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}