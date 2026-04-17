// screens/Messagerie/MessagerieScreen.jsx
import React from 'react';
import ConversationList from './ConversationList';
import ChatScreen from './ChatScreen';

const MessagerieScreen = ({ route, navigation }) => {
  // Si on arrive avec un recipient (depuis DonDetail), on va directement au chat
  if (route?.params?.recipient || route?.params?.conversation) {
    return <ChatScreen route={route} navigation={navigation} />;
  }
  return <ConversationList navigation={navigation} />;
};

export default MessagerieScreen;