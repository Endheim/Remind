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
  '당신의 분석은 Re:Mind 감정 회고 시스템에 저장되어 사용자의 장기적 감정 변화를 파악하는 데 활용됩니다.',
  '아래 모든 규칙을 철저히 준수하고, 출력은 반드시 JSON 형식으로만 생성하세요.',
  '',
  '[1] 역할 및 분석 목표',
  '- 사용자의 문장을 기반으로 감정의 전반적 상태를 정밀하게 분석하세요.',
  '- 감정 라벨 분류, 감정 강도 산출, 주요 감정 단어 추출, 하루 감정 요약, 따뜻한 심리 피드백을 제공하세요.',
  '- 감정을 과도하게 단정하지 말고, 진단적 표현은 사용하지 마세요.',
  '- 심각한 위험 표현(자책, 우울감 심화, 자해 암시 등) 감지 시 피드백 길이를 4~8문장으로 확장하되 부드럽게 지지하세요.',
  '',
  '[2] 감정 라벨 규칙',
  '- 라벨은 긍정, 중립, 부정, 혼합 중 하나입니다.',
  '- 긍정: 긍정적 언어, 감사, 성취, 평온함, 만족감이 드러나는 경우.',
  '- 중립: 감정 기복이 거의 없거나 표현이 모호한 경우.',
  '- 부정: 스트레스, 불안, 분노, 피로, 자책, 슬픔 등 부정적 감정이 명확할 때.',
  '- 혼합: 긍정과 부정이 동시에 충분히 드러나는 경우에만 사용하세요.',
  '- 감정이 불확실하거나 감정 단어가 거의 없으면 반드시 중립으로 라벨링하고 confidence는 0.3 이하로 설정하세요.',
  '',
  '[3] confidence 산출 규칙 (0.0~1.0)',
  '- 감정 신호가 명확하고 반복되며 강도가 강하면 0.8~1.0.',
  '- 감정 신호가 존재하지만 다소 약하면 0.5~0.79.',
  '- 감정 신호가 거의 없거나 모호하면 0.0~0.3.',
  '- confidence는 감정 분석 확신도로, 선택한 라벨과 일관되게 설정하세요.',
  '',
  '[4] keywords 규칙',
  '- 반드시 2~5개를 추출하세요.',
  '- 감정 단어나 감정의 원인을 드러내는 핵심 단어만 사용하세요.',
  '- 욕설이나 과격한 표현이 있으면 순화하여 기록합니다.',
  '',
  '[5] summary 규칙',
  '- 20자 이내의 자연스러운 한국어 문장으로 작성하세요.',
  '- 하루 감정의 본질을 명확하게 요약하세요.',
  '- 이모지나 특수문자를 사용하지 마세요.',
  '',
'[6] feedback 규칙',
'- 기본은 1~2문장으로 간단하고 짧게 작성하며, 각 문장은 64자를 넘기지 않습니다.',
'- 감정이 매우 부정적이거나 위험 신호(자살, 극단적 우울, 자해 암시 등)가 감지되면 2~6문장으로 확장하고 따뜻한 톤을 유지하며, 반드시 전문 기관 및 도움을 권유하는 안전 문구를 포함하세요.',
'- 모든 상황에서 가르치거나 단정 짓지 말고, 이해와 공감을 기반으로 조언하세요.',
'- 상담, 치료, 진단처럼 들리는 표현은 절대 사용하지 마세요.',
  '',
  '[7] JSON 출력 형식 (절대 변경 금지)',
  '{',
  '  "label": "긍정" | "중립" | "부정" | "혼합",',
  '  "confidence": 0.0,',
  '  "keywords": ["감정", "주요 단어"],',
  '  "summary": "20자 이내 감정 요약",',
  '  "feedback": "2~3문장 또는 필요 시 최대 8문장의 위로·격려·조언"',
  '}',
  '',
  '[8] 보안 & 안정성 규칙',
  '- JSON 외 텍스트를 절대 포함하지 마세요.',
  '- 따옴표, 쉼표, 괄호를 빠뜨리지 마세요.',
  '- 키 이름을 변경하거나 추가 key/value를 만들지 마세요.',
  '- 위험 표현은 완곡하게 재구성하세요.',
  '',
  '[9] 전반적 원칙',
  '- 감정을 판단하지 말고 이해와 정리에 집중하세요.',
  '- 과도한 설교를 피하고, Re:Mind의 따뜻한 감성에 맞추어 답하세요.',
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

const extractMessageContent = (message) => {
  if (!message) return null;
  const { content, tool_calls: toolCalls, parsed, refusal } = message;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (!part) return '';
        if (typeof part === 'string') return part;
        if (typeof part.text === 'string') return part.text;
        if (typeof part?.data === 'string') return part.data;
        if (typeof part?.output_text === 'string') return part.output_text;
        if (typeof part?.content === 'string') return part.content;
        if (typeof part?.arguments === 'string') return part.arguments;
        if (part?.json && typeof part.json === 'object') {
          try {
            return JSON.stringify(part.json);
          } catch (error) {
            return '';
          }
        }
        if (part?.parsed && typeof part.parsed === 'object') {
          try {
            return JSON.stringify(part.parsed);
          } catch (error) {
            return '';
          }
        }
        return '';
      })
      .join('')
      .trim();
    if (joined) {
      return joined;
    }
  }

  if (toolCalls && toolCalls.length > 0) {
    const [firstCall] = toolCalls;
    if (firstCall?.function?.arguments) {
      return firstCall.function.arguments;
    }
  }

  if (parsed && typeof parsed === 'object') {
    try {
      return JSON.stringify(parsed);
    } catch (error) {
      return null;
    }
  }

  if (refusal?.reason) {
    return refusal.reason;
  }

  return null;
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
    temperature: 1,
    maxTokens: 2500,
  });

  const [primaryChoice] = response.choices ?? [];
  let messageContent = extractMessageContent(primaryChoice?.message);

  if (!messageContent) {
    if (Array.isArray(primaryChoice?.content)) {
      messageContent = primaryChoice.content
        .map((part) => {
          if (typeof part === 'string') return part;
          if (typeof part?.text === 'string') return part.text;
          if (typeof part?.output_text === 'string') return part.output_text;
          if (typeof part?.arguments === 'string') return part.arguments;
          if (part?.json && typeof part.json === 'object') {
            try {
              return JSON.stringify(part.json);
            } catch (error) {
              return '';
            }
          }
          if (part?.parsed && typeof part.parsed === 'object') {
            try {
              return JSON.stringify(part.parsed);
            } catch (error) {
              return '';
            }
          }
          return '';
        })
        .join('')
        .trim();
    }

    if (!messageContent) {
      if (Array.isArray(primaryChoice?.output_text)) {
        messageContent = primaryChoice.output_text.join('\n').trim();
      } else if (typeof primaryChoice?.output_text === 'string') {
        messageContent = primaryChoice.output_text.trim();
      }
    }

    if (!messageContent) {
      if (Array.isArray(response.output_text)) {
        messageContent = response.output_text.join('\n').trim();
      } else if (typeof response.output_text === 'string') {
        messageContent = response.output_text.trim();
      }
    }
  }

  if (!messageContent) {
    const diagnostic = JSON.stringify(
      {
        responseId: response.id,
        choicesLength: response.choices?.length ?? 0,
        finishReason: primaryChoice?.finish_reason,
        hasOutputText:
          Boolean(primaryChoice?.output_text) || Boolean(response.output_text),
      },
      null,
      2
    );
    try {
      console.error(
        '[OpenAI] Missing message content. Raw response snapshot:',
        JSON.stringify(response, null, 2)
      );
    } catch (error) {
      console.error('[OpenAI] Missing message content. Raw response unavailable.');
    }
    throw new Error(`OpenAI 응답에서 메시지를 찾지 못했습니다. details=${diagnostic}`);
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
