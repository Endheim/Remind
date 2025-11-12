import { useCallback, useEffect, useRef, useState } from 'react';
import { authApi } from '../api';

const SCRIPT_ID = 'google-oauth-script';
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '112914357105-b3h95cm0v5sqbtpsbrjnbhhj5h1qvb93.apps.googleusercontent.com';

export function useGoogleSocialLogin() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const tokenClientRef = useRef(null);
  const readyPromiseRef = useRef(null);
  const readyResolveRef = useRef(null);
  const readyRejectRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google 클라이언트 ID가 설정되지 않았습니다.');
      return;
    }

    const setupReadyPromise = () => {
      if (!readyPromiseRef.current) {
        readyPromiseRef.current = new Promise((resolve, reject) => {
          readyResolveRef.current = resolve;
          readyRejectRef.current = reject;
        });
      }
      return readyPromiseRef.current;
    };

    setupReadyPromise();

    const initialize = () => {
      if (!window.google?.accounts?.oauth2) {
        return;
      }
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        prompt: '',
        callback: () => {},
      });
      setIsReady(true);
      readyResolveRef.current?.();
      readyRejectRef.current = null;
      readyPromiseRef.current = Promise.resolve();
    };

    if (window.google?.accounts?.oauth2) {
      initialize();
      return;
    }

    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      initialize();
    };

    const handleError = () => {
      const message = 'Google 로그인 스크립트를 불러오지 못했습니다.';
      setError(message);
      readyRejectRef.current?.(new Error(message));
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  const ensureClientReady = useCallback(async () => {
    if (tokenClientRef.current) {
      return;
    }
    if (readyPromiseRef.current) {
      await readyPromiseRef.current;
    }
    if (!tokenClientRef.current) {
      throw new Error(error || 'Google 로그인 초기화 중 오류가 발생했습니다.');
    }
  }, [error]);

  const startGoogleLogin = useCallback(
    ({ persist }) =>
      new Promise(async (resolve, reject) => {
        try {
          await ensureClientReady();
        } catch (readyError) {
          reject(readyError);
          return;
        }

        if (!tokenClientRef.current) {
          reject(new Error('Google 로그인 초기화가 완료되지 않았습니다.'));
          return;
        }
        setIsAuthenticating(true);
        let isSettled = false;
        let focusListenerAttached = false;
        let focusTimeoutId = null;

        const cleanupFocusListener = () => {
          if (focusTimeoutId) {
            clearTimeout(focusTimeoutId);
            focusTimeoutId = null;
          }
          if (focusListenerAttached) {
            window.removeEventListener('focus', handleFocusCancel);
            focusListenerAttached = false;
          }
        };

        const handleFocusCancel = () => {
          if (!isSettled) {
            isSettled = true;
            cleanupFocusListener();
            setIsAuthenticating(false);
            reject(new Error('Google 로그인이 취소되었습니다.'));
          }
        };

        focusTimeoutId = window.setTimeout(() => {
          window.addEventListener('focus', handleFocusCancel, { once: true });
          focusListenerAttached = true;
        }, 300);

        tokenClientRef.current.callback = async (response) => {
          if (isSettled) {
            return;
          }
          isSettled = true;
          cleanupFocusListener();
          if (!response || response.error || !response.access_token) {
            setIsAuthenticating(false);
            reject(
              new Error(
                response?.error_description ||
                  'Google 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
              )
            );
            return;
          }
          try {
            const result = await authApi.loginWithGoogleToken(response.access_token, {
              persist,
            });
            setIsAuthenticating(false);
            resolve(result);
          } catch (apiError) {
            setIsAuthenticating(false);
            reject(apiError);
          }
        };
        tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
      }),
    [ensureClientReady]
  );

  return {
    isReady,
    error,
    isAuthenticating,
    startGoogleLogin,
  };
}
