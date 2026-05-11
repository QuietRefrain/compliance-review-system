// AI 大模型抽象层 - 统一接口，支持自由切换模型
// ⚠️ 此文件只能在服务端使用（API Routes / Server Actions）
import 'server-only';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionResult {
  content: string;
  tokenUsage?: number;
  duration: number;
}

// AI 模型提供者接口
export interface AIProvider {
  chat(messages: ChatMessage[], config: AIModelConfig): Promise<AICompletionResult>;
}

// ==================== ZhipuAI 提供者 (默认使用 z-ai-web-dev-sdk) ====================
class ZhipuAIProvider implements AIProvider {
  async chat(messages: ChatMessage[], config: AIModelConfig): Promise<AICompletionResult> {
    const startTime = Date.now();
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const content = completion.choices?.[0]?.message?.content || '';
    const tokenUsage = completion.usage?.total_tokens || 0;
    const duration = Date.now() - startTime;

    return { content, tokenUsage, duration };
  }
}

// ==================== OpenAI 兼容提供者 ====================
class OpenAICompatibleProvider implements AIProvider {
  async chat(messages: ChatMessage[], config: AIModelConfig): Promise<AICompletionResult> {
    const startTime = Date.now();
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const apiKey = config.apiKey || '';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokenUsage = data.usage?.total_tokens || 0;
    const duration = Date.now() - startTime;

    return { content, tokenUsage, duration };
  }
}

// ==================== Anthropic 提供者 ====================
class AnthropicProvider implements AIProvider {
  async chat(messages: ChatMessage[], config: AIModelConfig): Promise<AICompletionResult> {
    const startTime = Date.now();
    const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    const apiKey = config.apiKey || '';

    // 提取 system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.modelId,
        max_tokens: config.maxTokens,
        system: systemMessage,
        messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API 请求失败 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const tokenUsage = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    const duration = Date.now() - startTime;

    return { content, tokenUsage, duration };
  }
}

// ==================== AI 模型服务 - 统一入口 ====================
class AIService {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.providers.set('zhipu', new ZhipuAIProvider());
    this.providers.set('openai', new OpenAICompatibleProvider());
    this.providers.set('deepseek', new OpenAICompatibleProvider());
    this.providers.set('custom', new OpenAICompatibleProvider());
    this.providers.set('anthropic', new AnthropicProvider());
  }

  async chat(messages: ChatMessage[], config: AIModelConfig): Promise<AICompletionResult> {
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }
    return provider.chat(messages, config);
  }

  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// 单例
export const aiService = new AIService();
