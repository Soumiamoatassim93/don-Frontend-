import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationsList from './Messaging/ConversationsList';
import ChatRoom from './Messaging/ChatRoom';

const Stack = createNativeStackNavigator();

function MessagingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ConversationsList" 
        component={ConversationsList} 
        options={{ title: 'Messagerie' }}
      />
      <Stack.Screen 
        name="ChatRoom" 
        component={ChatRoom} 
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}

const MessagerieScreen = () => {
  return <MessagingStack />;
};

export default MessagerieScreen;