// hooks/useHome.js
import { useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAvailableDons }       from '../store/slices/donsSlice';
import { fetchCategories }          from '../store/slices/categoriesSlice';
import { toggleFavorite, resetFavoriteError } from '../store/slices/favoritesSlice';
import { sendRequest, resetRequestError } from '../store/slices/RequestsSlice';
import { authService } from '../services/auth.service';

export const useHome = (user, search, activeCategory) => {
  const dispatch = useAppDispatch();

  const availableDons   = useAppSelector((s) => s.dons.availableDons);
  const donsLoading     = useAppSelector((s) => s.dons.availableDonsLoading);
  const donsError       = useAppSelector((s) => s.dons.availableDonsError);
  const categoriesList  = useAppSelector((s) => s.categories.list);
  const favoriteIds     = useAppSelector((s) => s.favorites.favoriteIds);
  const sentRequestIds  = useAppSelector((s) => s.requests.sentRequestIds);
  const favoriteError   = useAppSelector((s) => s.favorites.toggleError);
  const requestError    = useAppSelector((s) => s.requests.sendError);

  // Chargement initial
  useEffect(() => {
    dispatch(fetchAvailableDons());
    dispatch(fetchCategories());
  }, [dispatch]);

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

  // ✅ Création d'un Map nom → id pour les catégories
  const categoryNameToId = useMemo(() => {
    const map = new Map();
    categoriesList.forEach((cat) => {
      map.set(cat.name.toLowerCase().trim(), cat.id);
    });
    return map;
  }, [categoriesList]);

  // ✅ Filtrage des dons avec comparaison par categoryId
  const filteredDons = useMemo(() => {
    // Récupérer l'ID de la catégorie active (si ce n'est pas "Tous")
    let activeCategoryId = null;
    if (activeCategory !== 'Tous') {
      activeCategoryId = categoryNameToId.get(activeCategory.toLowerCase().trim());
    }

    return availableDons.filter((don) => {
      const isOwn = don.userId === user?.id || don.user?.id === user?.id;
      if (isOwn) return false;

      const matchSearch =
        don.title?.toLowerCase().includes(search.toLowerCase()) ||
        don.description?.toLowerCase().includes(search.toLowerCase());

      // Comparaison par ID (nombre)
      const matchCategory =
        activeCategory === 'Tous' || don.categoryId === activeCategoryId;

      return matchSearch && matchCategory;
    });
  }, [availableDons, user, search, activeCategory, categoryNameToId]);

  // Catégories avec "Tous" en tête
  const categories = useMemo(
    () => ['Tous', ...categoriesList.map((c) => c.name)],
    [categoriesList]
  );

  const handleFavorite = useCallback(
    async (don) => {
      const currentUser = await authService.getCurrentUser();
      const isFav = favoriteIds.includes(don.id);
      dispatch(toggleFavorite({ userId: currentUser.id, donId: don.id, isFavorite: isFav }))
        .unwrap()
        .then(({ isFavorite }) => {
          Alert.alert('Succès', isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
        });
    },
    [dispatch, favoriteIds]
  );

  const handleRequest = useCallback(
    async (don) => {
      if (sentRequestIds.includes(don.id)) return;
      const currentUser = await authService.getCurrentUser();
      dispatch(sendRequest({ userId: currentUser.id, donationId: don.id, status: 'en_cours' }))
        .unwrap()
        .then(() => Alert.alert('Succès', 'Demande envoyée ✔️'));
    },
    [dispatch, sentRequestIds]
  );

  const refresh = useCallback(() => {
    dispatch(fetchAvailableDons());
  }, [dispatch]);

  return {
    filteredDons,
    categories,
    donsLoading,
    donsError,
    favoriteIds,
    sentRequestIds,
    handleFavorite,
    handleRequest,
    refresh,
    refreshing: useAppSelector((s) => s.dons.availableDonsLoading),
  };
};