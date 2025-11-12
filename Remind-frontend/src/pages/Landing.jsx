import { useState } from 'react';
import { Link } from 'react-router-dom';
import authBackgrounds from '../constants/authBackgrounds';
import '../styles/landing.css';

const navLinks = [
  { label: '기능', href: '#features' },
  { label: '사용방법', href: '#flow' },
  { label: '소개', href: '#about' },
  { label: '문의', href: '#contact' },
];

const featureCards = [
  {
    badge: '핵심',
    title: 'AI 감정 회고',
    description: '매일 1문장 기록만으로 감정 패턴과 감정 점수를 즉시 확인합니다.',
  },
  {
    badge: '코칭',
    title: '성장 피드백',
    description: '스트레스·회복 단어 사용량 변화를 분석해 마음을 다듬는 안내 문장을 전합니다.',
  },
  {
    badge: '리포트',
    title: '마인드 리포트',
    description: '주간/월간 리포트로 감정 변화, 키워드 클라우드, 루틴을 제안합니다.',
  },
  {
    badge: '안전',
    title: '유해성 필터링',
    description: '욕설·혐오 표현을 GPT 필터로 사전 차단하여 커뮤니티를 보호합니다.',
  },
];

const impactList = [
  {
    title: '심리적 안정감',
    body: '일상 감정 정리와 AI 피드백으로 자기이해력 향상',
  },
  {
    title: '데이터 기반 성장',
    body: '감정 그래프, 키워드 클라우드, 루틴 추천 제공',
  },
  {
    title: '사회적 가치',
    body: '고비용 상담의 대안이 되는 정서 관리 도구',
  },
];

const flowSteps = [
  'Google OAuth 또는 이메일로 로그인합니다.',
  '오늘의 감정을 1~2문장으로 기록하고 “AI 분석”을 누릅니다.',
  '감정 레이블·점수·마음 정리 메시지와 리포트 링크를 확인합니다.',
  '감정 그래프와 주간 리포트를 열람하며 성장 루틴을 적용합니다.',
];

const nfrItems = [
  {
    title: 'P95 API 응답 800ms 이하',
    body: '핵심 API는 캐싱·비동기 큐로 P95 응답을 0.8초 안으로 유지해 생생한 회고 경험을 보장합니다.',
  },
  {
    title: 'AI 응답 평균 1.5초',
    body: 'KoBERT 전처리 + GPT 프롬프트 최적화로 감정 분석과 마음 정리 문장을 1.5초 내로 전달합니다.',
  },
  {
    title: '가용성 99.5% · 일별 백업',
    body: '이중 AZ 배포와 자동 스냅샷 백업으로 데이터 손실과 다운타임을 최소화합니다.',
  },
  {
    title: 'JWT + OAuth2 + bcrypt',
    body: 'Access/Refresh 토큰, Google OAuth2, bcrypt 암호화로 인증부터 저장까지 안전하게 보호합니다.',
  },
];

const serviceModules = [
  {
    title: '기록 & 인증',
    copy: 'OAuth2 · JWT · 이메일 인증으로 사용자 여정을 안전하게 시작합니다.',
    bullets: [
      '이메일/Google 가입, Access·Refresh 토큰 발급',
      '회고 작성·조회·삭제',
      '24시간 수정 제한 정책',
    ],
  },
  {
    title: 'AI 분석 & 마음 정리',
    copy: 'KoBERT + GPT 조합으로 감정 분류와 마음을 다듬는 안내를 제공합니다.',
    bullets: ['감정 라벨/점수 산출', '요약 + 마음 정리 문장 생성', '스트레스 패턴 알림'],
  },
  {
    title: '리포트 & 통계',
    copy: '주간 리포트와 감정 그래프를 시각화해 성장 루틴을 안내합니다.',
    bullets: ['최근 7일 감정 비율 차트', '주간/월간 PDF 리포트', '키워드 클라우드와 루틴 추천'],
  },
  {
    title: '안전 & 운영',
    copy: '커뮤니티 품질을 지키는 필터와 관리자 도구를 제공합니다.',
    bullets: ['욕설·혐오 감지 필터', '신고 큐 및 검토 로그', '금칙어/임계값 설정'],
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
            <img src="/logo_white.svg" alt="Re:Mind 로고" />
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
        <section id="features" className="feature-section">
          {featureCards.map((card) => (
            <article key={card.title} className="feature-card">
              <span className="badge">{card.badge}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </section>

        <section id="about" className="impact">
          <div>
            <p className="eyebrow">Problem → Solution → Impact</p>
            <h2>기록 · 이해 · 성장의 루프</h2>
            <p>
              스트레스와 정서적 피로가 쌓인 사용자를 위해 감정 기록을 분석하고, 맞춤 피드백과 리포트로 성장
              경험을 제공합니다. 감정 데이터 기반으로 자기성찰 습관을 돕고, 접근성 높은 정서 케어 도구를
              제시합니다.
            </p>
          </div>
          <ul>
            {impactList.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="flow" className="flow">
          <div>
            <p className="eyebrow">시연 흐름</p>
            <h2>Re:Mind 사용 방법</h2>
            <ol>
              {flowSteps.map((copy, index) => (
                <li key={copy}>
                  <span>{index + 1}</span>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="card metrics">
            <h3>비기능 요구사항</h3>
            <div className="nfr-list">
              {nfrItems.map((item) => (
                <article key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="service-section" id="contact">
          <header>
            <p className="eyebrow">서비스 구상</p>
            <h2>핵심 모듈 &amp; 운영 플로우</h2>
            <p>명세서 기준으로 MVP에 필요한 사용자 여정, AI 분석, 리포트, 운영 도구를 요약했습니다.</p>
          </header>
          <div className="service-grid">
            {serviceModules.map((service) => (
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

        <section className="closing">
          <p>오늘의 감정을 기록하고, 내일의 마음을 준비해보세요.</p>
          <h2>Re:Mind가 당신의 감정 여정을 함께합니다.</h2>
          <Link className="primary" to="/login">
            베타 참여하기
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
