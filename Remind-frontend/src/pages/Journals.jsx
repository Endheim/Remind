import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, emotionApi, journalApi } from '../api';
import '../styles/journals.css';

const EMOTION_META = [
  { key: 'positive', label: '긍정', tone: 'positive', color: '#16a34a' },
  { key: 'neutral', label: '중립', tone: 'neutral', color: '#6b7280' },
  { key: 'negative', label: '부정', tone: 'negative', color: '#dc2626' },
];

const emotionLabel = {
  positive: '긍정',
  neutral: '중립',
  negative: '부정',
};

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replace(/\./g, '.')
    .replace(/\s/g, ' ')
    .trim();
};

export default function Journals() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [journals, setJournals] = useState([]);
  const [summary, setSummary] = useState({ positive: 0, neutral: 0, negative: 0 });
  const [content, setContent] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [pendingJournalId, setPendingJournalId] = useState(null);

  const loadSummary = useCallback(async () => {
    const { summary: serverSummary } = await emotionApi.summary();
    setSummary(serverSummary);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const meResult = await authApi.me();
      const currentUser = meResult.user;
      setUser(currentUser);
      if (!currentUser?.profileComplete) {
        const params = new URLSearchParams({
          step: '2',
          mode: 'social',
        });
        if (currentUser?.email) {
          params.set('email', currentUser.email);
        }
        navigate(`/register?${params.toString()}`, { replace: true });
        return;
      }
      const [journalsResult, summaryResult] = await Promise.all([
        journalApi.list(),
        emotionApi.summary(),
      ]);
      const nextJournals = journalsResult.journals ?? [];
      setJournals(nextJournals);
      if (nextJournals.length > 0) {
        const latest = nextJournals[0];
        setAiResult({
          summary: latest.summary,
          advice: latest.advice,
          emotion: latest.emotion,
        });
      } else {
        setAiResult(null);
      }
      setSummary(summaryResult.summary);
      setStatusMessage('');
      setErrorMessage('');
    } catch (error) {
      if (error.status === 401) {
        authApi.logout();
        navigate('/login', { replace: true });
      } else if (error.status === 403 && error.data?.code === 'PROFILE_INCOMPLETE') {
        const params = new URLSearchParams({
          step: '2',
          mode: 'social',
        });
        navigate(`/register?${params.toString()}`, { replace: true });
      } else {
        setErrorMessage(error.message || '데이터를 불러오지 못했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const emotionStats = useMemo(() => {
    const total =
      (summary?.positive ?? 0) + (summary?.neutral ?? 0) + (summary?.negative ?? 0);
    return EMOTION_META.map((emotion) => {
      const count = summary?.[emotion.key] ?? 0;
      const percentage = total ? Math.round((count / total) * 100) : 0;
      return { ...emotion, value: percentage, count };
    });
  }, [summary]);

  const handleLogout = () => {
    authApi.logout();
    navigate('/login', { replace: true });
  };

  const handleAnalyze = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMessage('감정을 1자 이상 입력해 주세요.');
      setStatusMessage('');
      return;
    }
    setErrorMessage('');
    try {
      setIsSubmitting(true);
      setStatusMessage('AI 분석을 진행 중입니다...');
      const { journal } = await journalApi.create(trimmed);
      setJournals((prev) => [journal, ...prev]);
      setAiResult({
        summary: journal.summary,
        advice: journal.advice,
        emotion: journal.emotion,
      });
      setContent('');
      setStatusMessage('분석이 완료되었어요!');
      try {
        await loadSummary();
      } catch (summaryError) {
        console.error(summaryError);
      }
    } catch (error) {
      if (error.status === 403 && error.data?.code === 'PROFILE_INCOMPLETE') {
        const params = new URLSearchParams({
          step: '2',
          mode: 'social',
        });
        navigate(`/register?${params.toString()}`, { replace: true });
        return;
      }
      setErrorMessage(error.message || '회고 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEdit = (entry) => {
    setEditingId(entry.id);
    setEditingContent(entry.content);
    setStatusMessage('');
    setErrorMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleUpdateJournal = async () => {
    if (!editingId) return;
    const trimmed = editingContent.trim();
    if (!trimmed) {
      setErrorMessage('수정할 회고 내용을 1자 이상 입력해 주세요.');
      return;
    }
    try {
      setPendingJournalId(editingId);
      await journalApi.update(editingId, trimmed);
      setStatusMessage('회고가 수정되었습니다.');
      setEditingId(null);
      setEditingContent('');
      await loadData();
    } catch (error) {
      setErrorMessage(error.message || '회고 수정에 실패했습니다.');
    } finally {
      setPendingJournalId(null);
    }
  };

  const handleDeleteJournal = async (journalId) => {
    const confirmed = window.confirm('해당 회고를 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.');
    if (!confirmed) return;
    try {
      setPendingJournalId(journalId);
      await journalApi.remove(journalId);
      setStatusMessage('회고가 삭제되었습니다.');
      if (editingId === journalId) {
        cancelEdit();
      }
      await loadData();
    } catch (error) {
      setErrorMessage(error.message || '회고 삭제에 실패했습니다.');
    } finally {
      setPendingJournalId(null);
    }
  };

  const hasJournals = journals.length > 0;

  return (
    <div className="journal-view">
      <header className="journal-header">
        <div className="cluster">
          <strong>Re:Mind 저널</strong>
          <p>{user ? `${user.nickname}님의 감정을 기록하고 AI 코칭을 받아보세요.` : '오늘의 감정을 기록하고 AI 코칭을 받아보세요.'}</p>
        </div>
        <div className="journal-actions">
          <Link className="ghost-btn" to="/">
            홈으로
          </Link>
          <button className="logout-btn" type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      {!hasJournals && (
        <section className="journal-placeholder">
          <p>
            아직 회고를 작성하지 않았습니다. 감정을 남기면 KoBERT + GPT 조합이 감정 레이블, 점수, 마음 정리 문장을
            생성해 드립니다.
          </p>
          <div className="placeholder-card">
            <strong>AI 분석은 이렇게 진행돼요</strong>
            <ul>
              <li>감정 텍스트 전처리 및 유해성 필터링</li>
              <li>KoBERT 감정 분류 + GPT 요약/조언 생성</li>
              <li>주간 리포트와 루틴 추천으로 피드백 제공</li>
            </ul>
          </div>
        </section>
      )}

      <section className="journal-layout">
        <article className="journal-composer">
          <h3>오늘의 감정 회고</h3>
          <textarea
            rows={6}
            placeholder="오늘 하루는 어땠나요? 1~500자로 기록해보세요."
            maxLength={500}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={isSubmitting}
          />
          <div className="composer-footer">
            <span className="muted-text">{content.length} / 500자</span>
            <div className="hero-actions">
              <button className="secondary" type="button" disabled>
                임시 저장
              </button>
              <button
                className="primary"
                type="button"
                onClick={handleAnalyze}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'AI 분석 중…' : 'AI 분석하기'}
              </button>
            </div>
          </div>
          {errorMessage && <p className="error-text">{errorMessage}</p>}
          {statusMessage && <p className="success-text">{statusMessage}</p>}
        </article>

        <aside className="journal-stats">
          <div>
            <h3>최근 7일 감정 비율</h3>
            <p className="muted-text">실시간 감정 추이가 업데이트됩니다.</p>
          </div>
          <ul className="emotion-list">
            {emotionStats.map((emotion) => (
              <li key={emotion.key} className="emotion-row">
                <span className="emotion-chip" data-emotion={emotion.tone}>
                  {emotion.label}
                </span>
                <div className="emotion-bar">
                  <span style={{ width: `${emotion.value}%`, backgroundColor: emotion.color }} />
                </div>
                <span className="emotion-count">
                  {emotion.value}% ({emotion.count}건)
                </span>
              </li>
            ))}
          </ul>
          <div className="ai-highlight">
            <p className="summary">AI 오늘의 요약</p>
            <p className="advice">
              {aiResult?.summary
                ? `${aiResult.summary}`
                : '감정 리듬이 안정적이에요. 마음 가볍게, 루틴은 단단하게 유지해보세요.'}
            </p>
            <p className="advice">
              {aiResult?.advice ||
                '기록을 남기면 맞춤 조언이 여기에 표시됩니다.'}
            </p>
            {aiResult && (
              <p className="success-text">
                마지막 분석 · {emotionLabel[aiResult.emotion] ?? aiResult.emotion}
              </p>
            )}
          </div>
        </aside>
      </section>

      <div className="journal-list-header">
        <div>
          <h3>최근 회고 기록</h3>
          <p className="muted-text">24시간 이내에는 언제든지 수정/삭제할 수 있어요.</p>
        </div>
        <button className="ghost-btn small" type="button">
          주간 리포트 보기
        </button>
      </div>

      {isLoading ? (
        <p className="muted-text">데이터를 불러오는 중입니다...</p>
      ) : journals.length === 0 ? (
        <p className="muted-text">아직 작성된 회고가 없습니다.</p>
      ) : (
        <ul className="journal-list">
          {journals.map((entry) => (
            <li key={entry.id} className="journal-entry">
              <div className="journal-entry-head">
                <div>
                  <p className="muted-text">{formatDate(entry.createdAt)}</p>
                  <h4>{emotionLabel[entry.emotion] || entry.emotion} · AI 감정 분석</h4>
                  {editingId === entry.id ? (
                    <textarea
                      className="journal-edit-textarea"
                      value={editingContent}
                      maxLength={500}
                      onChange={(event) => setEditingContent(event.target.value)}
                      aria-label="회고 내용 수정"
                    />
                  ) : (
                    <p>{entry.content}</p>
                  )}
                </div>
                <span className="emotion-chip" data-emotion={entry.emotion}>
                  {emotionLabel[entry.emotion] || entry.emotion}
                </span>
              </div>
              <div className="journal-ai">
                <div>
                  <p className="label">요약</p>
                  <p>{entry.summary}</p>
                </div>
                <div>
                  <p className="label">조언</p>
                  <p>{entry.advice}</p>
                </div>
              </div>
              <div className="journal-entry-actions">
                {editingId === entry.id ? (
                  <>
                    <button className="ghost-btn small" type="button" onClick={cancelEdit}>
                      취소
                    </button>
                    <button
                      className="primary small"
                      type="button"
                      onClick={handleUpdateJournal}
                      disabled={pendingJournalId === entry.id}
                    >
                      {pendingJournalId === entry.id ? '저장 중…' : '변경 사항 저장'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="ghost-btn small"
                      type="button"
                      onClick={() => beginEdit(entry)}
                    >
                      수정
                    </button>
                    <button
                      className="ghost-btn small danger"
                      type="button"
                      onClick={() => handleDeleteJournal(entry.id)}
                      disabled={pendingJournalId === entry.id}
                    >
                      {pendingJournalId === entry.id ? '삭제 중…' : '삭제'}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
