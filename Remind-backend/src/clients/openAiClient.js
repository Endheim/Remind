const config = require('../config');

const fetch = (() => {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error('Global fetch is not available. Node.js 18+ is required.');
  }
  return globalThis.fetch.bind(globalThis);
})();

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL =
  process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

class OpenAiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  get isConfigured() {
    return Boolean(this.apiKey);
  }

  async createChatCompletion({
    messages,
    responseFormat = 'json_object',
    temperature = 0.2,
    maxTokens = 800,
    model = DEFAULT_MODEL,
  }) {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key is not configured');
    }

    const tokenFields = ['max_completion_tokens', 'max_tokens', null];
    const temperatureOptions = [];

    if (typeof temperature === 'number') {
      temperatureOptions.push(temperature);
    }

    if (!temperatureOptions.includes(1)) {
      temperatureOptions.push(1);
    }

    let lastError;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const logError = ({ status, durationMs, tokenField, temperature, message }) => {
      console.error(
        `[OpenAI] Request failed (requestId=${requestId}, status=${status}, duration=${durationMs}ms, tokenField=${tokenField}, temperature=${temperature})${message ? `: ${message}` : ''}`
      );
    };

    const sendRequest = async (tokenField, tempValue) => {
      const body = {
        model,
        messages,
      };

      body.temperature = tempValue;

      if (
        maxTokens !== undefined &&
        maxTokens !== null &&
        tokenField
      ) {
        body[tokenField] = maxTokens;
      }

      if (responseFormat) {
        body.response_format = { type: responseFormat };
      }

      const start = Date.now();

      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const durationMs = Date.now() - start;

      if (!response.ok) {
        const text = await response.text();
        const error = new Error(
          `OpenAI API error (${response.status}): ${text}`
        );
        error.status = response.status;
        error.responseText = text;
        logError({
          durationMs,
          status: response.status,
          tokenField: tokenField || 'none',
          temperature: tempValue,
          message: text.slice(0, 200),
        });
        throw error;
      }

      const json = await response.json();
      return json;
    };

    for (const field of tokenFields) {
      for (const temp of temperatureOptions) {
        try {
          return await sendRequest(field, temp);
        } catch (error) {
          lastError = error;

          const message = error.responseText || error.message || '';
          const isUnsupportedTokenField =
            error.status === 400 &&
            typeof message === 'string' &&
            message.includes('Unsupported parameter') &&
            field &&
            message.includes(field);

          const isUnsupportedTemperature =
            error.status === 400 &&
            typeof message === 'string' &&
            message.includes('Unsupported value') &&
            message.includes('temperature') &&
            temp !== undefined &&
            temp !== null;

          if (!isUnsupportedTokenField && !isUnsupportedTemperature) {
            throw error;
          }

          // If unsupported temperature, continue with next temp option
          if (isUnsupportedTemperature) {
            continue;
          }

          // If unsupported token field, break to try next field
          break;
        }
      }
    }

    throw lastError;
  }
}

const openAiClient = new OpenAiClient(config.ai.openAiKey);

module.exports = openAiClient;
