const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
const STORAGE_KEY = 'remind_tokens';

let refreshPromise = null;

const performRefresh = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const tokens = readTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  })
    .then(async (res) => {
      const data = await parseJson(res);
      if (!res.ok) {
        throw Object.assign(new Error(data?.message || 'Refresh failed'), {
          status: res.status,
          data,
        });
      }
      writeTokens(data);
      return data;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

export const apiFetch = async (path, options = {}) => {
  const { auth = true, _retry = false, ...rest } = options;
  const tokens = readTokens();
  const headers = {
    'Content-Type': 'application/json',
    ...(rest.headers || {}),
  };

  if (auth && tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const config = {
    ...rest,
    headers,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  if (response.status === 401 && auth && tokens?.refreshToken && !_retry) {
    try {
      await performRefresh();
      return apiFetch(path, { ...options, _retry: true });
    } catch (error) {
      removeTokens();
      throw error;
    }
  }

  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(data?.message || '요청에 실패했습니다.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const tokenStorage = {
  get: readTokens,
  set: writeTokens,
  clear: removeTokens,
};

function readTokens() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to read tokens', error);
    return null;
  }
}

function writeTokens(tokens) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function removeTokens() {
  window.localStorage.removeItem(STORAGE_KEY);
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON', error);
    return null;
  }
}
