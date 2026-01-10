// backend/src/services/aiClient.ts

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

/**
 * Универсальный AI клиент, поддерживающий Anthropic и OpenRouter
 */

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: Array<{ type: 'text'; text: string }>;
}

interface AIClientInterface {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      temperature?: number;
      system?: string;
      messages: AIMessage[];
    }): Promise<AIResponse>;
  };
}

/**
 * Создаёт клиента для OpenRouter (совместимый с Anthropic API)
 */
function createOpenRouterClient(apiKey: string): AIClientInterface {
  return {
    messages: {
      async create(params) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/kimurazver67/sport-transformation-app',
            'X-Title': 'Sport Transformation App'
          },
          body: JSON.stringify({
            model: params.model,
            max_tokens: params.max_tokens,
            temperature: params.temperature,
            messages: [
              ...(params.system ? [{ role: 'system', content: params.system }] : []),
              ...params.messages
            ]
          })
        });

        if (!response.ok) {
          const error = await response.json() as { error?: { message?: string } };
          throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };

        // Преобразуем ответ OpenRouter в формат Anthropic
        return {
          content: [
            {
              type: 'text',
              text: data.choices[0].message.content
            }
          ]
        };
      }
    }
  };
}

/**
 * Создаёт AI клиента (OpenRouter или Anthropic)
 */
export function createAIClient(): AIClientInterface | null {
  // Приоритет: OpenRouter > Anthropic
  if (config.ai?.openrouterApiKey) {
    console.log('[AI Client] Using OpenRouter API');
    return createOpenRouterClient(config.ai.openrouterApiKey);
  }

  if (config.ai?.anthropicApiKey) {
    console.log('[AI Client] Using Anthropic API');
    return new Anthropic({ apiKey: config.ai.anthropicApiKey }) as unknown as AIClientInterface;
  }

  return null;
}
