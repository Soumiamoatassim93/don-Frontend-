import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationsList from './Messaging/ConversationsList';
import ChatRoom from './Messaging/ChatRoom';

const Stack = createNativeStackNavigator();

// Stack interne pour la messagerie
function MessagingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversationsList" component={ConversationsList} />
      <Stack.Screen name="ChatRoom" component={ChatRoom} />
    </Stack.Navigator>
  );
}

const MessagerieScreen = ({ route, navigation }) => {
  return <MessagingStack />;
};

export default MessagerieScreen;