import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TouchableOpacity, Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen/HomeScreen';
import AddDonScreen from '../screens/Don/AddDonScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import MesDonsScreen from '../screens/Don/MesDonsScreen';
import EditDonScreen from '../screens/Don/EditDonScreen';
import DonDetailScreen from '../screens/Don/DonDetailScreen';
import MessagerieScreen from '../screens/Messagerie/MessagerieScreen';
import CustomDrawerContent from './CustomDrawerContent';
import FavorisScreen from '../screens/Favoris/FavorisScreen';
import RequestsScreen from '../screens/RequestScreen/RequestsScreen';
import TrackingScreen from '../screens/TrakingScreen/TrackingScreen';
import SenderTrackingScreen from '../screens/SenderTracking/SenderTrackingScreen';
import notificationScreen from '../screens/notification/notificationScreen';
import ChatScreen from '../screens/Messagerie/ChatScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: '#6366f1' },
  headerTintColor: 'white',
  headerTitleStyle: { fontWeight: 'bold' },
};

// Stack pour les écrans qui ont besoin du header standard
const HomeStack = () => (
  <Stack.Navigator screenOptions={stackOptions}>
    <Stack.Screen
      name="HomeScreen"
      component={HomeScreen}
      options={({ navigation }) => ({
        title: 'Dons disponibles',
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginRight: 12 }}>
            <Text style={{ color: 'white', fontSize: 22 }}>☰</Text>
          </TouchableOpacity>
        ),
      })}
    />
    <Stack.Screen name="DonDetail" component={DonDetailScreen} options={{ title: 'Détail du don' }} />
    <Stack.Screen name="AddDon" component={AddDonScreen} options={{ title: 'Publier un don' }} />
    <Stack.Screen name="EditDon" component={EditDonScreen} options={{ title: 'Modifier le don' }} />
    <Stack.Screen name="Messagerie" component={MessagerieScreen} options={{ title: 'Messagerie' }} />
    <Stack.Screen name="Favoris" component={FavorisScreen} options={{ title: 'Mes Favoris' }} />
    <Stack.Screen name="Requests" component={RequestsScreen} options={{ title: 'Demandes' }} />
    <Stack.Screen name="Notifications" component={notificationScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Drawer.Screen name="Home" component={HomeStack} options={{ title: 'Accueil' }} />
    <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon Profil', ...stackOptions }} />
    <Drawer.Screen name="MesDons" component={MesDonsScreen} options={{ title: 'Mes Dons', ...stackOptions }} />
    <Drawer.Screen name="MessagerieDrawer" component={MessagerieScreen} options={{ title: 'Messagerie', ...stackOptions }} />
    <Drawer.Screen name="Favoris"   component={FavorisScreen}  options={{ title: 'Mes Favoris'  }} />
<Drawer.Screen name="Requests"  component={RequestsScreen} options={{ title: 'Demandes'      }} />
<Drawer.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: false }} />
<Drawer.Screen name="SenderTracking" component={SenderTrackingScreen} options={{ headerShown: false }} />
<Drawer.Screen name="Notifications" component={notificationScreen} options={{ headerShown: false }} />
<Drawer.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
  </Drawer.Navigator>
);

export default AppStack;