// src/store/authStore.js

import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  token: null,
  login: (token) => {
    localStorage.setItem('jwt_token', token);
    set({ isAuthenticated: true, token });
  },
  logout: () => {
    localStorage.removeItem('jwt_token');
    set({ isAuthenticated: false, token: null });
  },
  init: () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      set({ isAuthenticated: true, token });
    }
  }
}));

useAuthStore.getState().init();