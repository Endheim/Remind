import { apiFetch, tokenStorage, API_BASE_URL } from './client';

export const authApi = {
  async register(payload, options = {}) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    tokenStorage.set(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
      options
    );
    return data;
  },
  async login(payload, options = {}) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    tokenStorage.set(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
      options
    );
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
  async loginWithGoogleToken(accessToken, options = {}) {
    const data = await apiFetch('/auth/oauth/google/token', {
      method: 'POST',
      auth: false,
      body: { accessToken },
    });
    tokenStorage.set(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
      options
    );
    return data;
  },
  updateProfile(payload) {
    return apiFetch('/auth/profile', {
      method: 'PATCH',
      body: payload,
    });
  },
  checkEmailAvailability(email) {
    const params = new URLSearchParams({ value: email });
    return apiFetch(`/auth/email/check?${params.toString()}`, {
      auth: false,
    });
  },
  checkNicknameAvailability(nickname) {
    const params = new URLSearchParams({ value: nickname });
    return apiFetch(`/auth/nickname/check?${params.toString()}`, {
      auth: false,
    });
  },
  buildOAuthStartUrl(provider, redirectUri) {
    const params = new URLSearchParams();
    if (redirectUri) {
      params.set('redirect', redirectUri);
    }
    const query = params.toString();
    const suffix = query ? `?${query}` : '';
    return `${API_BASE_URL}/auth/oauth/${provider}/start${suffix}`;
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
  update(id, content) {
    return apiFetch(`/journals/${id}`, {
      method: 'PATCH',
      body: { content },
    });
  },
  remove(id) {
    return apiFetch(`/journals/${id}`, {
      method: 'DELETE',
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
