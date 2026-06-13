import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,

  setAuth: (user, accessToken) => set({ user, accessToken }),

  clearAuth: () => {
    set({ user: null, accessToken: null })
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  },

  getAccessToken: () => get().accessToken,
}))
