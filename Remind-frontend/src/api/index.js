import { apiFetch, tokenStorage } from './client';

export const authApi = {
  async register(payload) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    tokenStorage.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return data;
  },
  async login(payload) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    tokenStorage.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return data;
  },
  me() {
    return apiFetch('/auth/me');
  },
  logout() {
    tokenStorage.clear();
  },
  isAuthenticated() {
    const tokens = tokenStorage.get();
    return Boolean(tokens?.accessToken);
  },
};

export const journalApi = {
  list({ limit = 20, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return apiFetch(`/journals?${params.toString()}`);
  },
  create(content) {
    return apiFetch('/journals', {
      method: 'POST',
      body: { content },
    });
  },
};

export const emotionApi = {
  summary() {
    return apiFetch('/emotions/summary');
  },
  timeline() {
    return apiFetch('/emotions/timeline');
  },
};

export const aiApi = {
  report() {
    return apiFetch('/ai/report');
  },
};

export { tokenStorage } from './client';
