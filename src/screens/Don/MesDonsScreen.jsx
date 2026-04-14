import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import {styles} from './styles/MesDons';

const MesDonsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [dons, setDons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyDons();
  }, []);

  const fetchMyDons = async () => {
    try {
      const response = await authService.api.get('/dons/my-dons');
      setDons(response.data);
    } catch (err) {
      console.log('❌ fetchMyDons:', err.response?.status, err.message);
      Alert.alert('Erreur', 'Impossible de charger vos dons');
    } finally {
      setLoading(false);
    }
  };

  
  const handleDelete = (id) => {
  console.log('🔔 handleDelete appelé avec id:', id); // Vérifier si la fonction est appelée
  
  Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce don ?', [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Supprimer',
      style: 'destructive',
      onPress: async () => {
        console.log('✅ Confirmation suppression pour id:', id);
        try {
          const res = await authService.api.delete(`/dons/${id}`);
          console.log('✅ Réponse:', res.status, res.data);
          setDons(dons.filter(d => d.id !== id));
        } catch (err) {
          console.log('❌ Erreur delete:', err);
          Alert.alert('Erreur', 'Impossible de supprimer ce don');
        }
      },
    },
  ]);
};

  const handleEdit = (don) => {
    navigation.navigate('EditDon', { don });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366f1" />;

  if (dons.length === 0) return <Text style={styles.emptyText}>Vous n'avez aucun don.</Text>;

  return (
    <FlatList
      data={dons}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ padding: 20 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          {item.address ? <Text style={styles.address}>📍 {item.address}</Text> : null}
          <Text style={styles.status}>Statut : {item.status}</Text>
    <View style={styles.buttons}>
      <Pressable style={styles.editBtn} onPress={() => handleEdit(item)}>
        <Text style={styles.btnText}>Modifier</Text>
      </Pressable>
      <Pressable 
        style={styles.deleteBtn} 
         onPress={() => handleDelete(item.id)}

      >
        <Text style={styles.btnText}>Supprimer</Text>
      </Pressable>
    </View>
    </View>
  )}
/>
  );
};


export default MesDonsScreen;