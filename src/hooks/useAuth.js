// hooks/useAuth.js
import { useAppDispatch, useAppSelector }   from '../store/hooks';
import { login, register, logout, getProfile, checkAuthStatus, clearError, clearAuth } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { 
    user, 
    token,
    isLoading, 
    error, 
    isAuthenticated, 
    profile, 
    profileLoading, 
    profileError 
  } = useAppSelector((state) => state.auth);

  return {
    // États
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    profile,
    profileLoading,
    profileError,
    
    // Actions
    login: (email, password) => dispatch(login({ email, password })),
    register: (email, password, name) => dispatch(register({ email, password, name })),
    logout: () => dispatch(logout()),
    getProfile: () => dispatch(getProfile()),
    checkAuthStatus: () => dispatch(checkAuthStatus()),
    clearError: () => dispatch(clearError()),
    clearAuth: () => dispatch(clearAuth()),
  };
};