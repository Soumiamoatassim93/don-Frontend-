// hooks/useTracking.js
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  getDonationLocation,
  getSenderLocation,  // ✅ AJOUTE CET IMPORT
  startTracking,
  stopTracking,
  getTrackingStatus,
  restartTrackingIfNeeded,
  sendCurrentPosition,
  clearError,
  setLocationActive,
  resetTracking,
  updateCurrentLocation,
  setSocketConnected,
} from '../store/slices/trackingSlice';

export const useTracking = () => {
  const dispatch = useAppDispatch();
  const {
    donationLocation,
    currentLocation,
    senderLocation,  // ✅ AJOUTE CET ÉTAT
    isLocationActive,
    isLoading,
    error,
    trackingUserId,
    socketConnected,
  } = useAppSelector((state) => state.tracking);

  // Récupérer la position du don
  const fetchDonationLocation = useCallback((donationId) => {
    return dispatch(getDonationLocation(donationId)).unwrap();
  }, [dispatch]);

  // ✅ AJOUTE CETTE FONCTION POUR RÉCUPÉRER LA POSITION DU SENDER
  const fetchSenderLocation = useCallback((senderId) => {
    return dispatch(getSenderLocation(senderId)).unwrap();
  }, [dispatch]);

  // Actions de tracking
  const startUserTracking = useCallback((userId) => {
    return dispatch(startTracking(userId)).unwrap();
  }, [dispatch]);

  const stopUserTracking = useCallback(() => {
    return dispatch(stopTracking()).unwrap();
  }, [dispatch]);

  const checkTrackingStatus = useCallback(() => {
    return dispatch(getTrackingStatus()).unwrap();
  }, [dispatch]);

  const restartTracking = useCallback(() => {
    return dispatch(restartTrackingIfNeeded()).unwrap();
  }, [dispatch]);

  const sendPosition = useCallback(() => {
    return dispatch(sendCurrentPosition()).unwrap();
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetAllTracking = useCallback(() => {
    dispatch(resetTracking());
  }, [dispatch]);

  const setCurrentPosition = useCallback((latitude, longitude) => {
    dispatch(updateCurrentLocation({ latitude, longitude }));
  }, [dispatch]);

  const updateSocketStatus = useCallback((connected) => {
    dispatch(setSocketConnected(connected));
  }, [dispatch]);

  // Vérifier le statut au montage
  useEffect(() => {
    checkTrackingStatus();
  }, [checkTrackingStatus]);

  return {
    // États
    donationLocation,
    currentLocation,
    senderLocation,  // ✅ AJOUTE CET ÉTAT
    isLocationActive,
    isLoading,
    error,
    trackingUserId,
    socketConnected,
    
    // Actions
    fetchDonationLocation,
    fetchSenderLocation,  // ✅ AJOUTE CETTE FONCTION
    startUserTracking,
    stopUserTracking,
    checkTrackingStatus,
    restartTracking,
    sendPosition,
    clearErrors,
    resetAllTracking,
    setCurrentPosition,
    updateSocketStatus,
    setLocationActive: (active) => dispatch(setLocationActive(active)),
  };
};