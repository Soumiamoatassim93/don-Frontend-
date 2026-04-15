import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkFavorite, toggleFavorite, resetFavoriteError } from '../store/slices/favoritesSlice';
import { sendRequest, resetRequestError }                    from '../store/slices/RequestsSlice';
import { authService } from '../services/auth.service';

export const useDonDetail = (don) => {
  const dispatch = useAppDispatch();

  const favoriteIds    = useAppSelector((s) => s.favorites.favoriteIds);
  const toggleLoading  = useAppSelector((s) => s.favorites.toggleLoading);
  const favoriteError  = useAppSelector((s) => s.favorites.toggleError);
  const sentRequestIds = useAppSelector((s) => s.requests.sentRequestIds);
  const sendLoading    = useAppSelector((s) => s.requests.sendLoading);
  const requestError   = useAppSelector((s) => s.requests.sendError);

  const isFavorite   = favoriteIds.includes(don.id);
  const requestSent  = sentRequestIds.includes(don.id);

  // Vérifier le statut favori au montage
  useEffect(() => {
    const check = async () => {
      const user = await authService.getCurrentUser();
      dispatch(checkFavorite({ userId: user.id, donId: don.id }));
    };
    check();
  }, [don.id, dispatch]);

  // Alertes sur erreurs
  useEffect(() => {
    if (favoriteError) {
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
      dispatch(resetFavoriteError());
    }
  }, [favoriteError, dispatch]);

  useEffect(() => {
    if (requestError) {
      Alert.alert('Erreur', "Impossible d'envoyer la demande");
      dispatch(resetRequestError());
    }
  }, [requestError, dispatch]);

  const handleFavorite = useCallback(async () => {
    const user = await authService.getCurrentUser();
    dispatch(toggleFavorite({ userId: user.id, donId: don.id, isFavorite }))
      .unwrap()
      .then(({ isFavorite: newVal }) => {
        Alert.alert('Succès', newVal ? 'Ajouté aux favoris' : 'Retiré des favoris');
      });
  }, [dispatch, don.id, isFavorite]);

  const handleRequest = useCallback(async () => {
    if (requestSent || sendLoading) return;
    const user = await authService.getCurrentUser();
    dispatch(sendRequest({ userId: user.id, donationId: don.id, status: 'pending' }))
      .unwrap()
      .then(() => Alert.alert('Succès', 'Demande envoyée ✔️'));
  }, [dispatch, don.id, requestSent, sendLoading]);

  return {
    isFavorite,
    requestSent,
    sendLoading,
    toggleLoading,
    handleFavorite,
    handleRequest,
  };
};