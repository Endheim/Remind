import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authBackgrounds from '../constants/authBackgrounds';
import '../styles/auth.css';
import { authApi } from '../api';
import { useGoogleSocialLogin } from '../hooks/useGoogleSocialLogin';
import { buildOAuthRedirectUrl } from '../utils/oauth';

const socialProviders = [
  { id: 'google', label: 'Google', icon: '/Google_icon.svg' },
  { id: 'naver', label: 'Naver', icon: '/naver_icon.svg' },
  { id: 'instagram', label: 'Instagram', icon: '/instagram_icon.svg' },
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const initialStep = searchParams.get('step') === '2' ? 2 : 1;
  const socialMode = searchParams.get('mode');
  const socialEmail = searchParams.get('email') || '';
  const isSocialFlow = Boolean(socialMode);
  const [step, setStep] = useState(initialStep);
  const [registerEmail, setRegisterEmail] = useState(socialEmail);
  const [registerEmailError, setRegisterEmailError] = useState('');
  const [isRegisterEmailTouched, setIsRegisterEmailTouched] = useState(false);
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordError, setRegisterPasswordError] = useState('');
  const [isRegisterPasswordTouched, setIsRegisterPasswordTouched] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [userId, setUserId] = useState('');
  const [userIdError, setUserIdError] = useState('');
  const [isUserIdTouched, setIsUserIdTouched] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(isSocialFlow);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const {
    error: googleError,
    isAuthenticating: isGoogleAuthenticating,
    startGoogleLogin,
  } = useGoogleSocialLogin();
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState('');
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(null);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const [isDataTransferChecked, setIsDataTransferChecked] = useState(false);
  const [consentError, setConsentError] = useState('');

  useEffect(() => {
    if (!isSocialFlow && authApi.isAuthenticated()) {
      navigate('/journals', { replace: true });
    }
  }, [navigate, isSocialFlow]);

  const heroBackground = useMemo(
    () => authBackgrounds[Math.floor(Math.random() * authBackgrounds.length)],
    []
  );
  const heroImage = heroBackground?.src ?? authBackgrounds[0].src;
  const heroCredit = heroBackground?.credit ?? authBackgrounds[0].credit;
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 80 }, (_, index) => (currentYear - index).toString());
  }, []);

  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, index) => (index + 1).toString()), []);
  const oauthRedirectUri = useMemo(
    () =>
      buildOAuthRedirectUrl({
        source: 'register',
        persist: 'persist',
      }),
    []
  );

  useEffect(() => {
    if (isSocialFlow) {
      setStep(2);
      if (socialEmail) {
        setRegisterEmail(socialEmail);
      }
    }
  }, [isSocialFlow, socialEmail]);

  useEffect(() => {
    const handleFocus = () => {
      if (isSocialLoading) {
        setIsSocialLoading(false);
        setStatusMessage('');
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isSocialLoading]);

  useEffect(() => {
    if (isSocialFlow || step !== 2 || isEmailVerified) {
      return;
    }
    if (!registerEmail.trim()) {
      return;
    }

    let isCancelled = false;

    const checkEmail = async () => {
      try {
        setIsCheckingEmail(true);
        const result = await authApi.checkEmailAvailability(registerEmail.trim());
        if (!result.available && !isCancelled) {
          setIsRegisterEmailTouched(true);
          setRegisterEmailError('이미 등록된 이메일 입니다.');
          setIsEmailVerified(false);
          setStep(1);
        } else if (!isCancelled) {
          setIsEmailVerified(true);
        }
      } catch (error) {
        if (!isCancelled) {
          setIsRegisterEmailTouched(true);
          setRegisterEmailError(
            error.message || '이메일 주소 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          );
          setIsEmailVerified(false);
          setStep(1);
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingEmail(false);
        }
      }
    };

    checkEmail();

    return () => {
      isCancelled = true;
    };
  }, [isSocialFlow, step, registerEmail, isEmailVerified]);

  const validateUserId = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '닉네임을 입력해주세요.';
    }
    if (trimmedValue.length < 2 || trimmedValue.length > 20) {
      return '닉네임은 2~20자로 입력해 주세요.';
    }
    return '';
  };

  const validateRegisterEmail = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '이메일 주소를 입력해 주세요.';
    }

    if (trimmedValue.length < 8 || trimmedValue.length > 64) {
      return '이메일 주소 길이는 8자에서 64자 사이여야 합니다.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedValue)) {
      return '이메일 주소를 입력해 주세요.';
    }

    return '';
  };

  const validateRegisterPassword = (value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return '비밀번호를 입력해 주세요.';
    }

    if (trimmedValue.length < 8) {
      return '비밀번호는 8자 이상으로 입력해 주세요.';
    }

    return '';
  };

  const handleStepOneSubmit = async (event) => {
    event.preventDefault();
    const emailError = validateRegisterEmail(registerEmail);
    const passwordError = validateRegisterPassword(registerPassword);
    setIsRegisterEmailTouched(true);
    setIsRegisterPasswordTouched(true);
    setRegisterEmailError(emailError);
    setRegisterPasswordError(passwordError);
    if (emailError || passwordError) {
      return;
    }
    setSubmitError('');
    try {
      setIsCheckingEmail(true);
      const result = await authApi.checkEmailAvailability(registerEmail.trim());
      if (!result.available) {
        setRegisterEmailError('이미 등록된 이메일 입니다.');
        setIsEmailVerified(false);
        return;
      }
    } catch (error) {
      setRegisterEmailError(
        error.message || '이메일 주소 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      );
      setIsEmailVerified(false);
      return;
    } finally {
      setIsCheckingEmail(false);
    }
    setRegisterEmailError('');
    setIsEmailVerified(true);
    setStep(2);
  };

  const handleRegisterEmailBlur = () => {
    if (!isRegisterEmailTouched) {
      setIsRegisterEmailTouched(true);
    }
    setRegisterEmailError(validateRegisterEmail(registerEmail));
  };

  const handleRegisterEmailChange = (event) => {
    const { value } = event.target;
    setRegisterEmail(value);
    setIsEmailVerified(false);
    if (isRegisterEmailTouched) {
      setRegisterEmailError(validateRegisterEmail(value));
    }
  };

  const handleRegisterPasswordBlur = () => {
    if (!isRegisterPasswordTouched) {
      setIsRegisterPasswordTouched(true);
    }
    setRegisterPasswordError(validateRegisterPassword(registerPassword));
  };

  const handleRegisterPasswordChange = (event) => {
    const { value } = event.target;
    setRegisterPassword(value);
    if (isRegisterPasswordTouched) {
      setRegisterPasswordError(validateRegisterPassword(value));
    }
  };

  const handleStepTwoSubmit = async (event) => {
    event.preventDefault();
    const error = validateUserId(userId);
    setIsUserIdTouched(true);
    setUserIdError(error);
    if (error) {
      return;
    }
    if (isNicknameAvailable === false) {
      setSubmitError('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.');
      return;
    }

    if (!isPrivacyChecked || !isDataTransferChecked) {
      setConsentError('필수 항목에 모두 동의해 주세요.');
      return;
    }
    setConsentError('');

    setSubmitError('');
    try {
      setIsSubmitting(true);
      if (isSocialFlow) {
        setStatusMessage('프로필을 설정하는 중입니다...');
        await authApi.updateProfile({
          nickname: userId.trim(),
          profileComplete: true,
        });
        setStatusMessage('프로필이 저장되었습니다! 회고 화면으로 이동합니다.');
      } else {
        setStatusMessage('계정을 생성 중입니다...');
        await authApi.register(
          {
            email: registerEmail.trim(),
            password: registerPassword,
            nickname: userId.trim(),
            consentPrivacy: true,
            consentDataTransfer: true,
          },
          { persist: true }
        );
        setStatusMessage('계정이 생성되었습니다! 회고 화면으로 이동합니다.');
      }
      navigate('/journals', { replace: true });
    } catch (error) {
      if (error.status === 409) {
        setStatusMessage('');
        setSubmitError('');
        setIsEmailVerified(false);
        setIsRegisterEmailTouched(true);
        setRegisterEmailError('이미 등록된 이메일 입니다.');
        setStep(1);
      } else {
        setSubmitError(error.message || '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        setStatusMessage('');
      }
    } finally {
      setIsSubmitting(false);
    }
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
        setIsSocialLoading(true);
        const result = await startGoogleLogin({ persist: true });
        if (result.isNew && result.user?.email) {
          const params = new URLSearchParams({
            step: '2',
            mode: 'google',
            email: result.user.email,
          });
          navigate(`/register?${params.toString()}`, { replace: true });
          return;
        }
        navigate('/journals', { replace: true });
      } catch (error) {
        setSubmitError(error.message || 'Google 로그인에 실패했습니다.');
      } finally {
        setStatusMessage('');
        setIsSocialLoading(false);
      }
      return;
    }

    if (provider === 'naver') {
      try {
        setSubmitError('');
        setStatusMessage('소셜 로그인 페이지로 이동합니다...');
        setIsSocialLoading(true);
        const startUrl = authApi.buildOAuthStartUrl(provider, oauthRedirectUri);
        window.location.href = startUrl;
      } catch (error) {
        setIsSocialLoading(false);
        setStatusMessage('');
        setSubmitError(error.message || '소셜 로그인에 실패했습니다. 다시 시도해 주세요.');
      }
      return;
    }
  };

  const handleUserIdBlur = () => {
    if (!isUserIdTouched) {
      setIsUserIdTouched(true);
    }
    setUserIdError(validateUserId(userId));
  };

  const handleUserIdChange = (event) => {
    const { value } = event.target;
    setUserId(value);
    setNicknameStatus('');
    setIsNicknameAvailable(null);
    if (isUserIdTouched) {
      setUserIdError(validateUserId(value));
    }
  };

  const handleNicknameCheck = async () => {
    const error = validateUserId(userId);
    setIsUserIdTouched(true);
    setUserIdError(error);
    if (error) {
      setNicknameStatus('');
      setIsNicknameAvailable(null);
      return;
    }
    try {
      setIsCheckingNickname(true);
      setSubmitError('');
      setNicknameStatus('닉네임을 확인하고 있습니다...');
      const result = await authApi.checkNicknameAvailability(userId.trim());
      if (result.available) {
        setNicknameStatus('사용 가능한 닉네임입니다.');
        setIsNicknameAvailable(true);
      } else {
        setNicknameStatus('이미 사용 중인 닉네임입니다.');
        setIsNicknameAvailable(false);
      }
    } catch (error) {
      setNicknameStatus(error.message || '닉네임 확인에 실패했습니다. 다시 시도해 주세요.');
      setIsNicknameAvailable(null);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  return (
    <div className="login-view register-view">
      <div className="login-visual" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="login-overlay" aria-hidden="true" />
        <div className="login-brand">
          <img className="brand-wordmark" src="/logo_team.svg" alt="Re:Mind 로고" />
          <p className="brand-caption">로그인 또는 계정 만들기</p>
        </div>
        <p className="login-credit">{heroCredit}</p>
      </div>

      <section className="login-panel register-panel">
        <Link className="back-link" to="/">
          ← 홈으로
        </Link>

        <p className="step-label">단계 {isSocialFlow ? 2 : step} / 2</p>
        <h1>계정 만들기</h1>
        <p className="login-subtext">
          이미 계정이 있으신가요?{' '}
          <Link className="text-button" to="/login">
            로그인
          </Link>
        </p>

        {step === 1 && !isSocialFlow ? (
          <>
            <div className="social-row register-social-row" aria-label="소셜 계정으로 계속">
              {socialProviders.map((provider) => (
                <button
                  className="social-circle"
                  type="button"
                  key={provider.id}
                  onClick={() => handleSocialLogin(provider.id)}
                  disabled={
                    provider.id === 'google'
                      ? isSocialLoading || isGoogleAuthenticating
                      : isSocialLoading
                  }
                >
                  <img src={provider.icon} alt={`${provider.label} 아이콘`} />
                </button>
              ))}
            </div>

            <div className="divider">
              <span>또는</span>
            </div>

            <form className="register-form" onSubmit={handleStepOneSubmit} noValidate>
              <label htmlFor="register-email">이메일 주소</label>
              <div className={`input-wrapper ${registerEmailError ? 'has-error' : ''}`}>
                <input
                  id="register-email"
                  type="text"
                  inputMode="email"
                  placeholder="이메일 주소를 입력해 주세요."
                  required
                  value={registerEmail}
                  onChange={handleRegisterEmailChange}
                  onBlur={handleRegisterEmailBlur}
                  aria-invalid={Boolean(registerEmailError)}
                  aria-describedby={registerEmailError ? 'register-email-error' : undefined}
                />
              </div>
              {registerEmailError && (
                <p className="error-text" id="register-email-error">
                  {registerEmailError}
                </p>
              )}

              <label htmlFor="register-password">비밀번호</label>
              <div className={`input-wrapper password ${registerPasswordError ? 'has-error' : ''}`}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력해 주세요."
                  required
                  value={registerPassword}
                  onChange={handleRegisterPasswordChange}
                  onBlur={handleRegisterPasswordBlur}
                  aria-invalid={Boolean(registerPasswordError)}
                  aria-describedby={registerPasswordError ? 'register-password-error' : undefined}
                />
                <button
                  type="button"
                  className="visibility-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  <img
                    src={showPassword ? '/password_on.svg' : '/password_off.svg'}
                    alt=""
                    aria-hidden="true"
                  />
                </button>
              </div>
              {registerPasswordError && (
                <p className="error-text" id="register-password-error">
                  {registerPasswordError}
                </p>
              )}

              <button type="submit" className="primary full" disabled={isCheckingEmail}>
                {isCheckingEmail ? '확인 중…' : '계속'}
              </button>
            </form>
          </>
        ) : (
          <form className="register-form" onSubmit={handleStepTwoSubmit} noValidate>
            {registerEmail && (
              <div className="info-chip" role="status">
                {registerEmail} 계정으로 가입을 진행합니다. 아래 약관을 확인해 주세요.
              </div>
            )}
            <div className="field-with-meta">
              <label htmlFor="register-user-id">닉네임</label>
              <div className="input-with-button">
                <div className={`input-wrapper ${userIdError ? 'has-error' : ''}`}>
                  <input
                    id="register-user-id"
                    type="text"
                    maxLength={24}
                    placeholder="닉네임을 입력해 주세요."
                    value={userId}
                    onChange={handleUserIdChange}
                    onBlur={handleUserIdBlur}
                    aria-invalid={Boolean(userIdError)}
                    aria-describedby={userIdError ? 'register-user-id-error' : undefined}
                  />
                </div>
                <button
                  type="button"
                  className="ghost-btn small"
                  onClick={handleNicknameCheck}
                  disabled={isCheckingNickname}
                >
                  {isCheckingNickname ? '확인 중...' : '확인'}
                </button>
              </div>
              {nicknameStatus && !userIdError && (
                <p className={isNicknameAvailable ? 'success-text' : 'error-text'}>
                  {nicknameStatus}
                </p>
              )}
              {userIdError && (
                <p className="error-text" id="register-user-id-error">
                  {userIdError}
                </p>
              )}
            </div>

            <div className="register-grid">
              <div>
                <label htmlFor="register-last-name">성</label>
                <input id="register-last-name" type="text" placeholder="성을 입력해 주세요." />
              </div>
              <div>
                <label htmlFor="register-first-name">이름</label>
                <input id="register-first-name" type="text" placeholder="이름을 입력해 주세요." />
              </div>
            </div>

            <div className="birth-grid">
              <label className="birth-label" htmlFor="register-birth-year">
                생년월일
              </label>
              <div className="birth-fields">
                <select
                  id="register-birth-year"
                  value={birthYear}
                  onChange={(event) => setBirthYear(event.target.value)}
                  required
                >
                  <option value="" disabled hidden>
                    년
                  </option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  id="register-birth-month"
                  value={birthMonth}
                  onChange={(event) => setBirthMonth(event.target.value)}
                  required
                >
                  <option value="" disabled hidden>
                    월
                  </option>
                  {Array.from({ length: 12 }, (_, index) => (index + 1).toString()).map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  id="register-birth-day"
                  value={birthDay}
                  onChange={(event) => setBirthDay(event.target.value)}
                  required
                >
                  <option value="" disabled hidden>
                    일
                  </option>
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="consent-section">
              <h3>필수 항목</h3>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={isPrivacyChecked}
                  onChange={(event) => {
                    setIsPrivacyChecked(event.target.checked);
                    if (event.target.checked && isDataTransferChecked) {
                      setConsentError('');
                    }
                  }}
                />
                개인정보 처리방침에 따른 내 개인 정보 수집 및 사용에 동의합니다.
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={isDataTransferChecked}
                  onChange={(event) => {
                    setIsDataTransferChecked(event.target.checked);
                    if (isPrivacyChecked && event.target.checked) {
                      setConsentError('');
                    }
                  }}
                />
                Ndheim의 개인정보 처리방침에 따른 Ndheim 및 국내외 서비스 제공자에 대한 내 개인정보 이전에
                동의합니다.
              </label>
              {consentError && <p className="error-text">{consentError}</p>}
            </div>

            <div className="consent-section optional">
              <h3>Ndheim과의 선택적 소통</h3>
              <p className="consent-note">
                팀 Ndheim은 귀하에게 맞춤형 서비스와 관련된 소식, 기능 업데이트를 알리고자합니다. 자세한 내용은
                개인정보 처리방침을 참조해 주시기 바라며, 귀하는 언제든지 수신을 거부할 수 있습니다.
              </p>
              <label className="checkbox-row">
                <input type="checkbox" />
                이메일 광고 수신에 동의합니다.
              </label>
              <label className="checkbox-row">
                <input type="checkbox" />
                Ndheim의 개인정보 처리방침에 따른 마케팅 목적의 내 개인정보 수집 및 이용(국내외 제3자에게 이전
                포함)에 동의합니다.
              </label>
            </div>

            <p className="consent-note final-note">
              「계정 만들기」 버튼을 클릭하면, 귀하는 서비스 이용약관 및 개인정보 처리방침의 내용을 충분히
              이해하고 이에 동의한 것으로 간주됩니다.
            </p>

            {submitError && <p className="error-text">{submitError}</p>}
            {statusMessage && <p className="success-text">{statusMessage}</p>}

            <button
              type="submit"
              className="primary full"
              disabled={isSubmitting || !isPrivacyChecked || !isDataTransferChecked}
            >
              {isSubmitting ? '계정 생성 중…' : '계정 만들기'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
