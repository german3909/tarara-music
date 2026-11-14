const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'tarara_token';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage no disponible (modo privado): la sesión dura lo que la pestaña.
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Error ${response.status}`, response.status);
  }
  return data;
}

function queryString(params) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString()}`;
}

export const api = {
  getSongs({ q, token } = {}) {
    return request(`/songs${queryString({ q })}`, { token });
  },
  getSong(id, token) {
    return request(`/songs/${id}`, { token });
  },
  getFormats() {
    return request('/formats');
  },
  register(payload) {
    return request('/auth/register', { method: 'POST', body: payload });
  },
  login(payload) {
    return request('/auth/login', { method: 'POST', body: payload });
  },
  getMe(token) {
    return request('/me', { token });
  },
  updateMe(payload, token) {
    return request('/me', { method: 'PATCH', body: payload, token });
  },
  getFavorites(token) {
    return request('/favorites', { token });
  },
  addFavorite(songId, token) {
    return request(`/favorites/${songId}`, { method: 'PUT', token });
  },
  removeFavorite(songId, token) {
    return request(`/favorites/${songId}`, { method: 'DELETE', token });
  },
  getPlaylists(token) {
    return request('/playlists', { token });
  },
  getPlaylist(id, token) {
    return request(`/playlists/${id}`, { token });
  },
  createPlaylist(name, token) {
    return request('/playlists', { method: 'POST', body: { name }, token });
  },
  renamePlaylist(id, name, token) {
    return request(`/playlists/${id}`, { method: 'PATCH', body: { name }, token });
  },
  deletePlaylist(id, token) {
    return request(`/playlists/${id}`, { method: 'DELETE', token });
  },
  addSongToPlaylist(playlistId, songId, token) {
    return request(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: { songId },
      token
    });
  },
  removeSongFromPlaylist(playlistId, songId, token) {
    return request(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
      token
    });
  }
};
