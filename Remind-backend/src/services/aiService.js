const POSITIVE_KEYWORDS = ['행복', '기쁨', '감사', '좋다', '설레', '신난'];
const NEGATIVE_KEYWORDS = ['슬픔', '우울', '짜증', '화나', '불안', '걱정', '힘들'];
const BLOCK_KEYWORDS = ['자살', '죽고', '폭탄', '살해', '욕'];

const analyzeEmotion = (content) => {
  let score = 0;
  POSITIVE_KEYWORDS.forEach((word) => {
    if (content.includes(word)) score += 1;
  });
  NEGATIVE_KEYWORDS.forEach((word) => {
    if (content.includes(word)) score -= 1;
  });

  const normalized = Math.max(-2, Math.min(2, score));
  const emotionScore = Number((normalized / 2 + 0.5).toFixed(2)); // 0-1 scale

  let emotion = 'neutral';
  if (emotionScore > 0.6) emotion = 'positive';
  if (emotionScore < 0.4) emotion = 'negative';

  return { emotion, emotionScore: Number((emotionScore * 100).toFixed(2)) };
};

const moderateContent = (content) => {
  const lower = content.toLowerCase();
  const hasBlock = BLOCK_KEYWORDS.some((word) => lower.includes(word));

  if (hasBlock) {
    return { verdict: 'block', confidence: 0.9 };
  }

  const needsReview = NEGATIVE_KEYWORDS.some((word) => lower.includes(word));
  if (needsReview) {
    return { verdict: 'review', confidence: 0.7 };
  }

  return { verdict: 'allow', confidence: 0.35 };
};

const summarize = (content) => {
  if (content.length <= 80) {
    return content;
  }
  return `${content.slice(0, 77)}...`;
};

const buildAdvice = (emotion) => {
  if (emotion === 'positive') {
    return '오늘의 긍정 에너지를 잘 기록했어요. 이 기분을 이어가요!';
  }
  if (emotion === 'negative') {
    return '힘든 감정을 인정한 것만으로도 큰 발걸음이에요. 잠시 호흡을 고르고 자신을 돌봐주세요.';
  }
  return '차분한 하루였네요. 가볍게 산책하거나 좋아하는 음악으로 마음을 채워봐요.';
};

const analyzeJournal = (content) => {
  const { emotion, emotionScore } = analyzeEmotion(content);
  const moderation = moderateContent(content);
  return {
    emotion,
    emotionScore: Number((emotionScore / 10).toFixed(2)), // map 0-100 -> 0-10
    summary: summarize(content),
    advice: buildAdvice(emotion),
    moderationVerdict: moderation.verdict,
    moderationConfidence: moderation.confidence,
  };
};

const fakeReport = () => ({
  summary: '이번 주 감정은 안정적이었으며 자기돌봄 실천이 잘 유지되고 있어요.',
  highlight: '감정 기록을 5일 연속 이어갔어요!',
  positivity: 0.62,
  negativity: 0.21,
  stability: 0.73,
});

const coach = (content) => {
  const { emotion } = analyzeEmotion(content);
  return {
    summary: summarize(content),
    advice: buildAdvice(emotion),
    emotion,
  };
};

module.exports = {
  analyzeJournal,
  analyzeEmotion,
  moderateContent,
  summarize,
  buildAdvice,
  fakeReport,
  coach,
};
