import React from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  Pressable, RefreshControl,
} from 'react-native';
import { useMesDons } from '../../hooks/useMesDons';
import { styles } from './styles/MesDons';

const MesDonsScreen = ({ navigation }) => {
  const { myDons, loading, error, deleteLoading, handleDelete, refresh } = useMesDons();

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366f1" />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.emptyText}>Erreur : {error}</Text>
        <Pressable onPress={refresh} style={styles.editBtn}>
          <Text style={styles.btnText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  if (myDons.length === 0) {
    return <Text style={styles.emptyText}>Vous n'avez aucun don.</Text>;
  }

  return (
    <FlatList
      data={myDons}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          {item.address ? (
            <Text style={styles.address}>📍 {item.address}</Text>
          ) : null}
          <Text style={styles.status}>Statut : {item.status}</Text>

          <View style={styles.buttons}>
            <Pressable
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditDon', { don: item })}
            >
              <Text style={styles.btnText}>Modifier</Text>
            </Pressable>

            <Pressable
              style={[styles.deleteBtn, deleteLoading && { opacity: 0.5 }]}
              onPress={() => handleDelete(item.id)}
              disabled={deleteLoading}
            >
              <Text style={styles.btnText}>
                {deleteLoading ? '...' : 'Supprimer'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
};

export default MesDonsScreen;