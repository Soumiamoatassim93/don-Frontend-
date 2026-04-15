import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchMyDons,
  deleteDon,
  resetDeleteError,
} from '../store/slices/donsSlice';

export const useMesDons = () => {
  const dispatch = useAppDispatch();

  const myDons        = useAppSelector((state) => state.dons.myDons);
  const loading       = useAppSelector((state) => state.dons.myDonsLoading);
  const error         = useAppSelector((state) => state.dons.myDonsError);
  const deleteLoading = useAppSelector((state) => state.dons.deleteLoading);
  const deleteError   = useAppSelector((state) => state.dons.deleteError);

  // Chargement initial
  useEffect(() => {
    dispatch(fetchMyDons());
  }, [dispatch]);

  // Afficher l'erreur de suppression si elle survient
  useEffect(() => {
    if (deleteError) {
      Alert.alert('Erreur', 'Impossible de supprimer ce don');
      dispatch(resetDeleteError());
    }
  }, [deleteError, dispatch]);

  const handleDelete = useCallback(
    (id) => {
      Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce don ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => dispatch(deleteDon(id)),
        },
      ]);
    },
    [dispatch]
  );

  const refresh = useCallback(() => {
    dispatch(fetchMyDons());
  }, [dispatch]);

  return {
    myDons,
    loading,
    error,
    deleteLoading,
    handleDelete,
    refresh,
  };
};