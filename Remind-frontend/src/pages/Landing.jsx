import { useState } from 'react';
import { Link } from 'react-router-dom';
import authBackgrounds from '../constants/authBackgrounds';
import '../styles/landing.css';

const navLinks = [
  { label: '소개', href: '#about' },
  { label: '제품', href: '#product' },
  { label: '사용 흐름', href: '#flow' },
  { label: '활용 예시', href: '#usecases' },
  { label: '문의', href: '#contact' },
];

const productCards = [
  {
    badge: '기록',
    title: '감정 다이어리',
    description: '하루 1분 기록만으로 감정 그래프와 키워드를 생성합니다.',
  },
  {
    badge: '코칭',
    title: 'GPT 피드백',
    description: 'OpenAI GPT API가 감정 요약과 맞춤 피드백을 제공해 회복 루틴을 제안합니다.',
  },
  {
    badge: '리포트',
    title: '인사이트 허브',
    description: '주간 리포트, 루틴 제안, 감정 데이터 익스포트 기능을 제공합니다.',
  },
  {
    badge: '가드',
    title: '모더레이션',
    description: '욕설·자해 키워드를 필터링하고 관리 로그를 남겨 안전한 경험을 만듭니다.',
  },
];

const aboutHighlights = [
  {
    title: 'Re:Mind 소개',
    body: 'AI 감정 회고 플랫폼으로, 사용자 스스로 감정을 기록·이해·루틴화하도록 설계했습니다.',
  },
  {
    title: 'Team Ndheim',
    body: '팀원은 두 명입니다. 한 명은 기획부터 프론트·백엔드 개발까지 맡고, 다른 한 명은 디자인·PM·QA를 담당합니다. 2025 해커톤에서 출발했습니다.',
  },
  {
    title: '브랜드 포지션',
    body: '“감정을 솔직하게 기록하고 회복을 돕는 파트너”라는 톤으로 텍스트와 UI를 제작합니다.',
  },
];

const useCaseCards = [
  {
    title: '슬랙/디스코드 커뮤니티',
    copy: '커뮤니티 멤버의 감정 상태를 주간 리포트로 공유해 온보딩과 케어 세션에 활용합니다.',
    bullets: ['데일리 회고 챌린지', '모더레이터용 정서 모니터링', '익명 리포트 공유'],
  },
  {
    title: '조직 내 멤버 케어',
    copy: 'HR/리더가 팀원의 감정 흐름을 익명으로 확인하고, 1:1 케어 세션을 설계할 수 있습니다.',
    bullets: ['Google SSO 연동', '감정 그래프 API', 'PDF 리포트 내보내기'],
  },
  {
    title: '멘탈 케어 스타트업',
    copy: '상담이 어려운 사용자에게 저비용 정서 케어 루틴을 제공하는 SaaS 형태로 라이선스합니다.',
    bullets: ['브랜드 커스터마이징', 'Webhook 연동', '온보딩 컨설팅'],
  },
  {
    title: 'Team Ndheim',
    copy: '두 명의 팀이 운영합니다. 한 명은 기획과 개발 전 과정을, 다른 한 명은 디자인·PM·QA를 담당하며, 해커톤에서 검증한 프로토타입을 계속 발전시킵니다.',
    bullets: ['GitHub: github.com/Endheim'],
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroBackground] = useState(
    () => authBackgrounds[Math.floor(Math.random() * authBackgrounds.length)]
  );
  const heroImage = heroBackground?.src ?? authBackgrounds[0].src;
  const heroCredit = heroBackground?.credit ?? authBackgrounds[0].credit;

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing">
      <header className="hero" id="top" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="overlay" aria-hidden="true" />
        <nav className="nav">
          <Link className="logo" to="/" onClick={closeMenu}>
            <img
              src="/logo_white.svg"
              alt="Re:Mind 로고"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = '/logo_team.svg';
              }}
            />
            <span>Re:Mind</span>
          </Link>
          <button
            className={`nav-toggle ${menuOpen ? 'active' : ''}`}
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="nav-links">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <Link className="login-btn" to="/login">
            로그인
          </Link>
        </nav>
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-links">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
            <Link className="login-btn mobile-login" to="/login" onClick={closeMenu}>
              로그인
            </Link>
          </div>
        </div>
        <div className="hero-content">
          <p className="eyebrow">AI 기반 멘탈 성장 회고 플랫폼</p>
          <h1>
            오늘의 감정을 이해하고,
            <br />
            내일의 마음을 가꾸는 AI 회고 플랫폼
          </h1>
          <p className="subtitle">
            AI가 감정 패턴을 분석하고 맞춤 피드백과 리포트를 생성해
            <br />
            자기이해력과 회복탄력성을 높여줍니다.
          </p>
          <p className="team-note">
            Team Ndheim은 여러 엔드포인트가 모여 집을 이루듯 화합으로 Re:Mind를 빚어냅니다.
          </p>
          <div className="hero-actions">
            <Link className="primary" to="/login">
              지금 시작하기
            </Link>
            <a className="secondary" href="#flow">
              시연 영상 보기
            </a>
          </div>
        </div>
        <p className="hero-credit">{heroCredit}</p>
      </header>

      <main>
        <section id="about" className="impact">
          <article className="impact-intro">
            <h2>Re:Mind는 어떤 서비스인가요?</h2>
            <p>
              감정을 기록하고 AI 피드백으로 성장 루틴을 설계하는 정서 케어 SaaS입니다. 개인 이용자는 자기이해와
              회복탄력성을 높이고, 팀/커뮤니티는 구성원 케어 데이터를 한눈에 확인할 수 있습니다.
            </p>
          </article>
          <div className="impact-cards">
            {aboutHighlights.map((item, index) => (
              <article key={item.title} className="impact-card">
                <span className="card-index">0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="product" className="feature-section">
          {productCards.map((card) => (
            <article key={card.title} className="feature-card">
              <span className="badge">{card.badge}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </section>

        <section id="flow" className="flow">
          <div className="flow-guide">
            <p className="eyebrow">사용 흐름</p>
            <h2>Re:Mind 사용 방법</h2>
            <ol className="flow-steps">
              <li className="flow-step">
                <span className="step-index">1</span>
                <div className="step-copy">
                  <strong>Kick-off</strong>
                  <p>요구 사항과 팀의 목적을 정의하며 도입 범위를 확정합니다.</p>
                </div>
              </li>
              <li className="flow-step">
                <span className="step-index">2</span>
                <div className="step-copy">
                  <strong>사용자 초대</strong>
                  <p>Google 또는 이메일 계정으로 초대해 첫 회고를 기록하게 합니다.</p>
                </div>
              </li>
              <li className="flow-step">
                <span className="step-index">3</span>
                <div className="step-copy">
                  <strong>AI 분석 &amp; 피드백</strong>
                  <p>감정 요약·조언·그래프가 카드로 생성되어 루틴을 제안합니다.</p>
                </div>
              </li>
              <li className="flow-step">
                <span className="step-index">4</span>
                <div className="step-copy">
                  <strong>리포트 공유</strong>
                  <p>주간 리포트와 CSV 익스포트로 팀 인사이트를 공유합니다.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="service-section" id="usecases">
          <header>
            <p className="eyebrow">Use cases</p>
            <h2>이렇게 활용됩니다</h2>
          </header>
          <div className="service-grid">
            {useCaseCards.map((service) => (
              <article key={service.title} className="service-card">
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
                <ul>
                  {service.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

      <section className="closing" id="contact">
        <p className="closing-lede">“기록 → 이해 → 루틴”의 감정 케어 경험을 브랜딩부터 운영까지 함께 설계합니다.</p>
        <h2>Re:Mind와 협업하거나 도입하고 싶으신가요?</h2>
        <Link className="primary" to="/login">
          서비스 체험하기
        </Link>
      </section>
      </main>

      <footer className="landing-footer">
        <p>ⓒ 2025 Team Ndheim — All rights reserved.</p>
        <p className="credit-list">
          background00 · background02: ⓒ한국관광공사-김지호 / background01: ⓒ한국관광공사-이청이 / background03:
          ⓒ한국관광공사-강경오 / background04: ⓒ한국관광공사-이범수 / background05: ⓒ한국관광공사-부산관광공사
        </p>
      </footer>
    </div>
  );
}
