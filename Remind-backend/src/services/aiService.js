const openAiClient = require('../clients/openAiClient');

const POSITIVE_KEYWORDS = ['행복', '기쁨', '감사', '좋다', '설레', '신난'];
const NEGATIVE_KEYWORDS = ['슬픔', '우울', '짜증', '화나', '불안', '걱정', '힘들'];
const BLOCK_KEYWORDS = ['자살', '죽고', '폭탄', '살해', '욕'];

const LABEL_ALIASES = {
  긍정: 'positive',
  긍정적: 'positive',
  positive: 'positive',
  부정: 'negative',
  부정적: 'negative',
  negative: 'negative',
  중립: 'neutral',
  neutral: 'neutral',
  혼합: 'neutral',
  mixed: 'neutral',
  복합: 'neutral',
};

const ANALYZE_SYSTEM_PROMPT = [
  '당신은 감정 분석과 심리 피드백을 전문으로 수행하는 AI 멘탈 코치입니다.',
  '지침:',
  '1. 사용자의 글을 읽고 감정 전반 성향을 판별하세요: 긍정, 중립, 부정, 혼합 중 하나.',
  '2. 주요 감정 단어와 원인을 2~5개 추출하세요.',
  '3. 감정 강도(confidence)를 0.0~1.0 범위에서 판단하세요.',
  '4. 하루 감정을 20자 이하의 자연스러운 한국어 문장으로 요약하세요.',
  '5. 위로·격려·조언을 2~3문장(필요 시 최대 8문장)으로 제공하세요. 톤은 따뜻하고 공감적으로 유지하세요.',
  '규칙:',
  '- 긍정과 부정이 동시에 뚜렷하면 label은 "혼합".',
  '- 감정이 불명확하면 label="중립", confidence≤0.3.',
  '- summary에는 특수문자나 이모지를 사용하지 마세요.',
  '- feedback은 부드럽고 따뜻하게 작성하세요.',
  '- 자해, 폭력, 혐오 표현은 완곡하게 재구성하세요.',
  '- 출력은 아래 JSON 형식으로만 답하세요. JSON 외 텍스트나 코드블록을 포함하지 마세요.',
  '{',
  '  "label": "긍정|중립|부정|혼합",',
  '  "confidence": 0.0,',
  '  "keywords": ["감정", "주요 단어"],',
  '  "summary": "20자 이하 자연스러운 한국어 문장",',
  '  "feedback": "위로·격려·조언 2~3문장 (필요 시 최대 8문장)"',
  '}',
].join('\n');

const clamp = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return NaN;
  }
  return Math.min(max, Math.max(min, number));
};

const toConfidence = (value) => {
  const normalized = clamp(value, 0, 1);
  if (!Number.isFinite(normalized)) {
    return 0.5;
  }
  return normalized;
};

const normalizeLabel = (label) => {
  if (!label) return 'neutral';
  const key = String(label).trim().toLowerCase();
  return LABEL_ALIASES[key] || LABEL_ALIASES[label] || 'neutral';
};

const normalizeKeywords = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 5);
};

const stripCodeFence = (raw) => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```[a-zA-Z]*\s*/i, '').replace(/```$/i, '').trim();
  }
  return trimmed;
};

const analyzeEmotionHeuristic = (content) => {
  let score = 0;
  POSITIVE_KEYWORDS.forEach((word) => {
    if (content.includes(word)) score += 1;
  });
  NEGATIVE_KEYWORDS.forEach((word) => {
    if (content.includes(word)) score -= 1;
  });

  const normalized = Math.max(-2, Math.min(2, score));
  const emotionScore = Number(((normalized / 2 + 0.5) * 100).toFixed(2)); // 0-100 scale

  let emotion = 'neutral';
  if (emotionScore > 60) emotion = 'positive';
  if (emotionScore < 40) emotion = 'negative';

  return { emotion, emotionScore };
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

const buildHeuristicAnalysis = (content, moderation) => {
  const { emotion, emotionScore } = analyzeEmotionHeuristic(content);
  return {
    emotion,
    emotionScore: Number((emotionScore / 10).toFixed(2)),
    summary: summarize(content),
    advice: buildAdvice(emotion),
    keywords: [],
    moderationVerdict: moderation.verdict,
    moderationConfidence: moderation.confidence,
  };
};

const analyzeWithOpenAi = async (content) => {
  const response = await openAiClient.createChatCompletion({
    messages: [
      { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `사용자 회고:\n${content}`,
      },
    ],
    responseFormat: 'json_object',
    temperature: 0.1,
    maxTokens: 600,
  });

  const messageContent = response.choices?.[0]?.message?.content;
  if (!messageContent) {
    throw new Error('OpenAI 응답에서 메시지를 찾지 못했습니다.');
  }

  const cleaned = stripCodeFence(messageContent);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`OpenAI 응답 JSON 파싱 실패: ${error.message}`);
  }

  const emotion = normalizeLabel(parsed.label);
  const confidence = toConfidence(parsed.confidence);
  const summary = String(parsed.summary || '').trim();
  const advice = String(parsed.feedback || '').trim();
  const keywords = normalizeKeywords(parsed.keywords);

  return {
    emotion,
    emotionScore: Number((confidence * 10).toFixed(2)),
    summary,
    advice,
    keywords,
  };
};

const analyzeJournal = async (content) => {
  const moderation = moderateContent(content);

  const runHeuristic = () => buildHeuristicAnalysis(content, moderation);

  if (!openAiClient.isConfigured) {
    return runHeuristic();
  }

  try {
    const analysis = await analyzeWithOpenAi(content);
    return {
      ...analysis,
      summary: analysis.summary || summarize(content),
      advice: analysis.advice || buildAdvice(analysis.emotion),
      moderationVerdict: moderation.verdict,
      moderationConfidence: moderation.confidence,
    };
  } catch (error) {
    console.error('Failed to analyze journal with OpenAI:', error);
    return runHeuristic();
  }
};

const fakeReport = () => ({
  summary: '이번 주 감정은 안정적이었으며 자기돌봄 실천이 잘 유지되고 있어요.',
  highlight: '감정 기록을 5일 연속 이어갔어요!',
  positivity: 0.62,
  negativity: 0.21,
  stability: 0.73,
});

const coach = async (content) => {
  const analysis = await analyzeJournal(content);
  return {
    summary: analysis.summary,
    advice: analysis.advice,
    emotion: analysis.emotion,
  };
};

module.exports = {
  analyzeJournal,
  analyzeEmotion: analyzeEmotionHeuristic,
  moderateContent,
  summarize,
  buildAdvice,
  fakeReport,
  coach,
};
