const DEFAULT_API_BASE_URL = 'http://localhost:4000';

const inferNgrokBackendUrl = (origin) => {
  try {
    const url = new URL(origin);
    if (!url.hostname.endsWith('.ngrok.io')) {
      return null;
    }
    const [subdomain, ...rest] = url.hostname.split('.');
    const backendSubdomain = subdomain.includes('-backend')
      ? subdomain
      : `${subdomain}-backend`;
    return `${url.protocol}//${[backendSubdomain, ...rest].join('.')}`;
  } catch (error) {
    console.warn('Failed to infer ngrok backend URL', error);
    return null;
  }
};

const resolveApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof window === 'undefined') {
    return DEFAULT_API_BASE_URL;
  }

  const runtimeValue =
    window.__REMIND_API_BASE_URL || window.REMIND_API_BASE_URL;
  if (runtimeValue) {
    return runtimeValue;
  }

  const origin = window.location?.origin || '';

  if (!origin) {
    return DEFAULT_API_BASE_URL;
  }

  if (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('0.0.0.0')
  ) {
    return DEFAULT_API_BASE_URL;
  }

  const ngrokUrl = inferNgrokBackendUrl(origin);
  if (ngrokUrl) {
    return ngrokUrl;
  }

  return origin;
};

export const API_BASE_URL = resolveApiBaseUrl();
const STORAGE_KEY = 'remind_tokens';
let shouldPersistTokens = true;

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
    const rawLocal = window.localStorage.getItem(STORAGE_KEY);
    if (rawLocal) {
      shouldPersistTokens = true;
      return JSON.parse(rawLocal);
    }
    const rawSession = window.sessionStorage.getItem(STORAGE_KEY);
    if (rawSession) {
      shouldPersistTokens = false;
      return JSON.parse(rawSession);
    }
    return null;
  } catch (error) {
    console.error('Failed to read tokens', error);
    return null;
  }
}

function writeTokens(tokens, { persist } = {}) {
  const nextPersist =
    typeof persist === 'boolean' ? persist : shouldPersistTokens;
  shouldPersistTokens = nextPersist;
  const primary = nextPersist ? window.localStorage : window.sessionStorage;
  const secondary = nextPersist ? window.sessionStorage : window.localStorage;
  primary.setItem(STORAGE_KEY, JSON.stringify(tokens));
  secondary.removeItem(STORAGE_KEY);
}

function removeTokens() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  shouldPersistTokens = true;
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
