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

  // Actions existantes
  const send = useCallback((userId, donationId, status = 'en_cours') => {
    return dispatch(sendRequest({ userId, donationId, status })).unwrap();
  }, [dispatch]);

  // Nouvelles actions
  const getSentRequests = useCallback((userId) => {
    return dispatch(fetchSentRequests(userId)).unwrap();
  }, [dispatch]);

  const getReceivedRequests = useCallback((userId) => {
    return dispatch(fetchReceivedRequests(userId)).unwrap();
  }, [dispatch]);

  const accept = useCallback((requestId, request) => {
    return dispatch(acceptRequest({ requestId, request })).unwrap();
  }, [dispatch]);

  const refuse = useCallback((requestId, request) => {
    return dispatch(refuseRequest({ requestId, request })).unwrap();
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
    // États existants
    sentRequestIds,
    sendLoading,
    sendError,
    
    // Nouveaux états
    sentRequests,
    receivedRequests,
    fetchLoading,
    fetchError,
    actionLoading,
    actionError,
    
    // Actions existantes
    send,
    
    // Nouvelles actions
    getSentRequests,
    getReceivedRequests,
    accept,
    refuse,
    cancel,
    clearErrors,
    resetAll,
    addRequestId,
  };
};