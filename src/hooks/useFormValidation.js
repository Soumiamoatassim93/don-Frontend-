import { useState } from 'react';
import { validateEmail, validatePassword } from '../utils/validation';

export const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  const validateLoginForm = (email, password) => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(email)) {
      newErrors.email = "Email invalide";
    }
    
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = (email, password, confirmPassword) => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(email)) {
      newErrors.email = "Email invalide";
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateLoginForm, validateRegisterForm, setErrors };
};