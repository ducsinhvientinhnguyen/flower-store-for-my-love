import { useAuthStore } from '../store/authStore'

async function apiFetch(path, options = {}) {
  const token = useAuthStore.getState().getAccessToken()

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  })

  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    if (refreshRes.ok) {
      const { accessToken: newToken } = await refreshRes.json()
      const { user } = useAuthStore.getState()
      useAuthStore.getState().setAuth(user, newToken)

      return fetch(`/api${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
        credentials: 'include',
      })
    }

    useAuthStore.getState().clearAuth()
    window.location.href = '/login'
    return res
  }

  return res
}

export const api = {
  get: (path, options) => apiFetch(path, { method: 'GET', ...options }),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => apiFetch(path, { method: 'DELETE' }),
}
