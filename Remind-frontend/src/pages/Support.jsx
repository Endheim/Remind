import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import authBackgrounds from '../constants/authBackgrounds';
import '../styles/auth.css';
import '../styles/support.css';

const helpOptions = [
  {
    title: '내 계정 찾기',
    description: 'Ndheim에서 사용한 적이 있는 이메일 또는 전화번호를 입력해 계정을 찾아주세요.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.624,15a8.03,8.03,0,0,0,10.619.659l5.318,5.318a1,1,0,0,0,1.414-1.414l-5.318-5.318A8.04,8.04,0,0,0,3.624,3.624,8.042,8.042,0,0,0,3.624,15Zm1.414-9.96a6.043,6.043,0,1,1-1.77,4.274A6,6,0,0,1,5.038,5.038ZM4.622,9.311a1,1,0,0,1,2,0A2.692,2.692,0,0,0,9.311,12a1,1,0,0,1,0,2A4.7,4.7,0,0,1,4.622,9.311Z"
          fill="#6c5ce7"
        />
      </svg>
    ),
  },
  {
    title: '비밀번호 찾기',
    description: '등록된 이메일로 인증 코드를 받아 새 비밀번호를 설정하세요.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.3212 10.6852L4 19L6 21M7 16L9 18M20 7.5C20 9.98528 17.9853 12 15.5 12C13.0147 12 11 9.98528 11 7.5C11 5.01472 13.0147 3 15.5 3C17.9853 3 20 5.01472 20 7.5Z"
          stroke="#f4b400"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Support() {
  const heroBackground = useMemo(
    () => authBackgrounds[Math.floor(Math.random() * authBackgrounds.length)],
    []
  );
  const heroImage = heroBackground?.src ?? authBackgrounds[0].src;
  const heroCredit = heroBackground?.credit ?? authBackgrounds[0].credit;

  return (
    <div className="login-view support-view">
      <div className="login-visual support-visual" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="login-overlay" aria-hidden="true" />
        <div className="login-brand">
          <img className="brand-wordmark" src="/logo_team.svg" alt="Re:Mind 로고" />
          <p className="brand-caption">로그인 또는 계정 만들기</p>
        </div>
        <p className="login-credit">{heroCredit}</p>
      </div>

      <section className="login-panel support-panel">
        <Link className="back-link support-return" to="/login">
          ← 로그인으로 돌아가기
        </Link>
        <h1>도움말 보기</h1>
        <p className="support-description">
          로그인하는 데 문제가 발생한 경우 아래 옵션을 시도해 보세요. 추가 지원이 필요하시면{' '}
          <a href="mailto:support@remind.ai">Ndheim 지원팀</a>으로 문의하세요.
        </p>

        <div className="support-card-list">
          {helpOptions.map((option) => (
            <article key={option.title} className="support-card">
              <div className="support-icon" aria-hidden="true">
                {option.icon}
              </div>
              <div className="support-content">
                <strong>{option.title}</strong>
                <p>{option.description}</p>
              </div>
              <span className="support-arrow" aria-hidden="true">
                →
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
