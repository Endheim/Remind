import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authBackgrounds from '../constants/authBackgrounds';
import '../styles/auth.css';
import { authApi } from '../api';
import { useGoogleSocialLogin } from '../hooks/useGoogleSocialLogin';
import { buildOAuthRedirectUrl } from '../utils/oauth';

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isIdentifierTouched, setIsIdentifierTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState(null);
  const {
    error: googleError,
    isAuthenticating: isGoogleAuthenticating,
    startGoogleLogin,
  } = useGoogleSocialLogin();

  useEffect(() => {
    if (authApi.isAuthenticated()) {
      navigate('/journals', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleFocus = () => {
      if (socialLoadingProvider) {
        setSocialLoadingProvider(null);
        setStatusMessage('');
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [socialLoadingProvider]);

  const validateIdentifier = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '아이디 또는 이메일을 입력해 주세요.';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedValue.includes('@')) {
      if (trimmedValue.length > 64) {
        return '이메일 주소 길이는 64자 이내여야 합니다.';
      }
      if (!emailPattern.test(trimmedValue)) {
        return '이메일 형식이 올바르지 않습니다.';
      }
      return '';
    }
    if (trimmedValue.length < 2 || trimmedValue.length > 20) {
      return '아이디는 2~20자로 입력해 주세요.';
    }
    const idPattern = /^[a-zA-Z0-9._-]+$/;
    if (!idPattern.test(trimmedValue)) {
      return '아이디는 영문, 숫자, ._ -만 사용할 수 있습니다.';
    }
    return '';
  };

  const validatePassword = (value) => {
    if (!value.trim()) {
      return '비밀번호를 입력해 주세요.';
    }
    if (value.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.';
    }
    return '';
  };

  const handleIdentifierBlur = () => {
    if (!isIdentifierTouched) setIsIdentifierTouched(true);
    setIdentifierError(validateIdentifier(identifier));
  };

  const handlePasswordBlur = () => {
    if (!isPasswordTouched) setIsPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  const handleIdentifierSubmit = (event) => {
    event.preventDefault();
    const nextIdentifierError = validateIdentifier(identifier);
    setIsIdentifierTouched(true);
    setIdentifierError(nextIdentifierError);
    setSubmitError('');
    if (nextIdentifierError) {
      return;
    }
    setStep(2);
    setStatusMessage('');
  };

  const resetToIdentifierStep = () => {
    setStep(1);
    setPassword('');
    setIsPasswordTouched(false);
    setPasswordError('');
    setSubmitError('');
    setStatusMessage('');
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const nextPasswordError = validatePassword(password);
    setIsPasswordTouched(true);
    setPasswordError(nextPasswordError);
    setSubmitError('');
    if (nextPasswordError) {
      return;
    }
    try {
      setIsSubmitting(true);
      setStatusMessage('로그인 중입니다...');
      const loginResult = await authApi.login(
        { identifier, password },
        { persist: rememberMe }
      );
      if (handlePostAuthRouting(loginResult, 'email')) {
        setStatusMessage('');
        return;
      }
      setStatusMessage('로그인 성공! 회고 화면으로 이동합니다.');
      navigate('/journals', { replace: true });
    } catch (error) {
      setSubmitError(error.message || '로그인에 실패했습니다. 다시 시도해 주세요.');
      setStatusMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };
  const heroBackground = useMemo(
    () => authBackgrounds[Math.floor(Math.random() * authBackgrounds.length)],
    []
  );
  const heroImage = heroBackground?.src ?? authBackgrounds[0].src;
  const heroCredit = heroBackground?.credit ?? authBackgrounds[0].credit;
  const oauthRedirectUri = useMemo(
    () =>
      buildOAuthRedirectUrl({
        source: 'login',
        persist: rememberMe ? 'persist' : 'session',
      }),
    [rememberMe]
  );
  const isSocialLoading = Boolean(socialLoadingProvider);

  const identityInitial = useMemo(() => {
    const trimmed = identifier.trim();
    return trimmed ? trimmed[0].toUpperCase() : '?';
  }, [identifier]);

  const redirectToProfileCompletion = (mode, email) => {
    const params = new URLSearchParams({
      step: '2',
      mode,
    });
    if (email) {
      params.set('email', email);
    }
    navigate(`/register?${params.toString()}`, { replace: true });
  };

  const handlePostAuthRouting = (authResult, mode) => {
    if (authResult?.user && !authResult.user.profileComplete) {
      redirectToProfileCompletion(mode, authResult.user.email);
      return true;
    }
    return false;
  };

  const handleSocialLogin = async (provider) => {
    if (provider === 'instagram') {
      setSubmitError('Instagram 로그인은 아직 지원되지 않습니다.');
      return;
    }
    if (provider === 'google') {
      if (googleError) {
        setSubmitError(googleError);
        return;
      }
      try {
        setSubmitError('');
        setStatusMessage('Google 계정으로 이동합니다...');
        setSocialLoadingProvider('google');
        const result = await startGoogleLogin({ persist: rememberMe });
        if (handlePostAuthRouting(result, 'google')) {
          return;
        }
        navigate('/journals', { replace: true });
      } catch (error) {
        setSubmitError(error.message || 'Google 로그인에 실패했습니다.');
      } finally {
        setStatusMessage('');
        setSocialLoadingProvider(null);
      }
      return;
    }

    if (provider === 'naver') {
      try {
        setSubmitError('');
        setStatusMessage('');
        setSocialLoadingProvider('naver');
        const startUrl = authApi.buildOAuthStartUrl(provider, oauthRedirectUri);
        window.location.href = startUrl;
      } catch (error) {
        setSocialLoadingProvider(null);
        setStatusMessage('');
        setSubmitError(error.message || '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
      return;
    }
  };

  return (
    <div className="login-view">
      <div className="login-visual" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="login-overlay" aria-hidden="true" />
        <div className="login-brand">
          <img className="brand-wordmark" src="/logo_team.svg" alt="Re:Mind 로고" />
          <p className="brand-caption">로그인 또는 계정 만들기</p>
        </div>
        <p className="login-credit">{heroCredit}</p>
      </div>

      <section className="login-panel">
        <Link className="back-link" to="/">
          ← 홈으로
        </Link>
        <h1>{step === 2 ? '비밀번호 입력' : '로그인'}</h1>
        <p className="login-subtext">
          신규 사용자이신가요?{' '}
          <Link className="text-button" to="/register">
            계정 만들기
          </Link>
        </p>

        {step === 1 ? (
          <form className="login-form" onSubmit={handleIdentifierSubmit} noValidate>
            <label htmlFor="login-identifier">아이디 또는 이메일</label>
            <div className={`input-wrapper ${identifierError ? 'has-error' : ''}`}>
              <input
                id="login-identifier"
                type="text"
                inputMode="text"
                placeholder="아이디 또는 이메일을 입력해 주세요."
                required
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  if (isIdentifierTouched)
                    setIdentifierError(validateIdentifier(event.target.value));
                }}
                onBlur={handleIdentifierBlur}
                aria-invalid={Boolean(identifierError)}
                aria-describedby={identifierError ? 'login-identifier-error' : undefined}
              />
            </div>
            {identifierError && (
              <p className="error-text" id="login-identifier-error">
                {identifierError}
              </p>
            )}

            <button type="submit" className="primary full">
              계속
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handlePasswordSubmit} noValidate>
            <div className="identity-header">
              <div className="identity-row">
                <div className="identity-icon" aria-hidden="true">
                  <span className="identity-initial">{identityInitial}</span>
                </div>
                <div>
                  <p className="identity-label">아이디</p>
                  <p className="identity-value">{identifier}</p>
                </div>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={resetToIdentifierStep}
              >
                다른 아이디/이메일 사용
              </button>
            </div>
            <label htmlFor="login-password">비밀번호</label>
            <div className={`input-wrapper ${passwordError ? 'has-error' : ''}`}>
              <input
                id="login-password"
                type="password"
                placeholder="비밀번호를 입력해 주세요."
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (isPasswordTouched) setPasswordError(validatePassword(event.target.value));
                }}
                onBlur={handlePasswordBlur}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'login-password-error' : undefined}
              />
            </div>
            <div className="remember-row">
              <button
                type="button"
                className={`toggle ${rememberMe ? 'on' : ''}`}
                aria-pressed={rememberMe}
                onClick={() => setRememberMe((prev) => !prev)}
              >
                <span className="toggle-thumb" />
              </button>
              <span className="remember-label">로그인 상태 유지</span>
            </div>
            {passwordError && (
              <p className="error-text" id="login-password-error">
                {passwordError}
              </p>
            )}

            {submitError && <p className="error-text">{submitError}</p>}
            {statusMessage && <p className="success-text">{statusMessage}</p>}

            <button type="submit" className="primary full" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        )}

        {step === 1 && (
          <>
            <div className="divider">
              <span>또는</span>
            </div>

            <div className="social-buttons">
              <button
                className="social-button"
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={
                  (isSocialLoading && socialLoadingProvider === 'google') ||
                  isGoogleAuthenticating
                }
              >
                <img src="/Google_icon.svg" alt="Google 계정으로 로그인 아이콘" />
                <span>
                  {socialLoadingProvider === 'google' ? 'Google 연동 중…' : 'Google 계정으로 로그인'}
                </span>
              </button>
              <button
                className="social-button"
                type="button"
                onClick={() => handleSocialLogin('naver')}
                disabled={isSocialLoading}
              >
                <img src="/naver_icon.svg" alt="Naver 계정으로 로그인 아이콘" />
                <span>
                  {socialLoadingProvider === 'naver' ? 'Naver 연동 중…' : 'Naver 계정으로 로그인'}
                </span>
              </button>
              <button
                className="social-button"
                type="button"
                onClick={() => handleSocialLogin('instagram')}
                disabled={isSocialLoading}
              >
                <img src="/instagram_icon.svg" alt="Instagram 계정으로 로그인 아이콘" />
                <span>Instagram 계정으로 로그인</span>
              </button>
            </div>
          </>
        )}

        <Link className="support-link" to="/support">
          로그인 관련 지원
        </Link>
      </section>
    </div>
  );
}
