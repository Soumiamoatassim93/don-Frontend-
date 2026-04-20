// hooks/useRequests.js
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  sendRequest,
  fetchSentRequests,
  fetchReceivedRequests,
  acceptRequest,
  refuseRequest,
  cancelRequest,
  resetRequestError,
  resetRequests,
  addSentRequestId,
} from '../store/slices/RequestsSlice';

export const useRequests = () => {
  const dispatch = useAppDispatch();
  const {
    sentRequestIds,
    sentRequests,
    receivedRequests,
    sendLoading,
    sendError,
    fetchLoading,
    fetchError,
    actionLoading,
    actionError,
  } = useAppSelector((state) => state.requests);

  const send = useCallback((userId, donationId, status = 'en_cours') => {
    return dispatch(sendRequest({ userId, donationId, status })).unwrap();
  }, [dispatch]);

  const getSentRequests = useCallback((userId) => {
    return dispatch(fetchSentRequests(userId)).unwrap();
  }, [dispatch]);

  const getReceivedRequests = useCallback((userId) => {
    return dispatch(fetchReceivedRequests(userId)).unwrap();
  }, [dispatch]);

  // ✅ CORRIGÉ : accept ne prend plus que requestId
  const accept = useCallback((requestId) => {
    return dispatch(acceptRequest({ requestId })).unwrap();
  }, [dispatch]);

  // ✅ CORRIGÉ : refuse ne prend plus que requestId
  const refuse = useCallback((requestId) => {
    return dispatch(refuseRequest({ requestId })).unwrap();
  }, [dispatch]);

  const cancel = useCallback((requestId, isSent = true) => {
    return dispatch(cancelRequest({ requestId, isSent })).unwrap();
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch(resetRequestError());
  }, [dispatch]);

  const resetAll = useCallback(() => {
    dispatch(resetRequests());
  }, [dispatch]);

  const addRequestId = useCallback((donationId) => {
    dispatch(addSentRequestId(donationId));
  }, [dispatch]);

  return {
    sentRequestIds,
    sentRequests,
    receivedRequests,
    sendLoading,
    sendError,
    fetchLoading,
    fetchError,
    actionLoading,
    actionError,
    send,
    getSentRequests,
    getReceivedRequests,
    accept,      // ✅ Maintenant accept prend requestId seulement
    refuse,      // ✅ Maintenant refuse prend requestId seulement
    cancel,
    clearErrors,
    resetAll,
    addRequestId,
  };
};