const normalizePath = (value) => {
  if (!value) return '/oauth/callback';
  return value.startsWith('/') ? value : `/${value}`;
};

export const OAUTH_CALLBACK_PATH = normalizePath(
  process.env.REACT_APP_OAUTH_CALLBACK_PATH || '/oauth/callback'
);

export const buildOAuthRedirectUrl = ({ source, persist } = {}) => {
  if (typeof window === 'undefined') {
    return '';
  }
  const url = new URL(`${window.location.origin}${OAUTH_CALLBACK_PATH}`);
  if (source) {
    url.searchParams.set('source', source);
  }
  if (persist) {
    url.searchParams.set('persist', persist);
  }
  return url.toString();
};
