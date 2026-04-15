import { useDispatch, useSelector } from 'react-redux';

// Hooks à utiliser partout à la place de useDispatch/useSelector bruts
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);