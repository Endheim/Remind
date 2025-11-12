import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../api';
import '../styles/auth.css';

const extractParams = () => {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const search = window.location.search.startsWith('?')
    ? window.location.search.slice(1)
    : window.location.search;

  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(search);

  const errorParam =
    hashParams.get('oauth_error') ||
    searchParams.get('oauth_error') ||
    hashParams.get('error') ||
    searchParams.get('error');

  return {
    accessToken: hashParams.get('accessToken'),
    refreshToken: hashParams.get('refreshToken'),
    error: errorParam,
    profileRequired: hashParams.get('profileRequired') === 'true',
    profileEmail: hashParams.get('profileEmail') || '',
    provider: hashParams.get('provider') || '',
    persistPreference: searchParams.get('persist') || '',
  };
};

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('소셜 로그인 처리 중입니다...');

  useEffect(() => {
    const {
      accessToken,
      refreshToken,
      error,
      profileRequired,
      profileEmail,
      provider,
      persistPreference,
    } = extractParams();

    const persistMode = persistPreference === 'session' ? false : true;

    if (error || !accessToken || !refreshToken) {
      const message =
        decodeURIComponent(error || '') ||
        '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
      setStatus(message);
      tokenStorage.clear();
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
      return () => clearTimeout(timer);
    }

    tokenStorage.set({ accessToken, refreshToken }, { persist: persistMode });
    if (profileRequired) {
      const searchParams = new URLSearchParams({
        step: '2',
        mode: provider || 'social',
      });
      if (profileEmail) {
        searchParams.set('email', profileEmail);
      }
      navigate(`/register?${searchParams.toString()}`, { replace: true });
      return undefined;
    }
    navigate('/journals', { replace: true });
    return undefined;
  }, [navigate]);

  return (
    <div className="login-view">
      <section className="login-panel">
        <p className="muted-text">{status}</p>
      </section>
    </div>
  );
}
