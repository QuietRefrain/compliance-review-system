// 四个核心 Agent 实现：检索 / 分析 / 风险评级 / 修订
// ⚠️ 此文件只能在服务端使用（依赖 ai-service）

import { aiService, type AIModelConfig, type ChatMessage } from './ai-service';
import type { AgentType } from './agent-types';

// ==================== Agent 基类 ====================
export interface AgentResult {
  success: boolean;
  output: string;
  tokenUsage?: number;
  duration?: number;
  error?: string;
}

export interface AgentContext {
  documentContent: string;
  documentTitle?: string;
  previousResults?: Record<string, string>;
}

abstract class BaseAgent {
  abstract name: string;
  abstract type: string;
  abstract description: string;

  protected abstract buildSystemPrompt(): string;
  protected abstract buildUserPrompt(context: AgentContext): string;

  async execute(context: AgentContext, modelConfig: AIModelConfig): Promise<AgentResult> {
    const startTime = Date.now();
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: this.buildUserPrompt(context) },
      ];

      const result = await aiService.chat(messages, modelConfig);
      const duration = Date.now() - startTime;

      return {
        success: true,
        output: result.content,
        tokenUsage: result.tokenUsage,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        output: '',
        duration,
        error: error.message || 'Agent 执行失败',
      };
    }
  }
}

// ==================== 1. 检索 Agent ====================
export class RetrievalAgent extends BaseAgent {
  name = '法规检索 Agent';
  type = 'retrieval';
  description = '从法规知识库中检索与待审查文档相关的法律法规条款';

  protected buildSystemPrompt(): string {
    return `你是一个专业的法规检索专家。你的任务是根据提供的文档内容，识别出所有可能涉及的法律领域和法规要求。

你需要：
1. 识别文档类型（如：劳动合同、采购合同、保密协议、数据处理协议等）
2. 列出该类型文档涉及的所有法律领域
3. 对每个法律领域，列出关键的合规检查要点
4. 给出每项检查要点的法规依据

请以 JSON 格式输出，结构如下：
{
  "documentType": "文档类型",
  "legalDomains": [
    {
      "domain": "法律领域名称",
      "checkPoints": [
        {
          "point": "检查要点",
          "regulationBasis": "法规依据",
          "importance": "high/medium/low"
        }
      ]
    }
  ]
}

请确保覆盖所有相关法律领域，不要遗漏。`;
  }

  protected buildUserPrompt(context: AgentContext): string {
    return `请分析以下文档，识别所有涉及的法律领域和合规检查要点：

文档标题：${context.documentTitle || '未命名文档'}

文档内容：
${context.documentContent}`;
  }
}

// ==================== 2. 分析 Agent ====================
export class AnalysisAgent extends BaseAgent {
  name = '合规分析 Agent';
  type = 'analysis';
  description = '对文档进行逐条合规性分析，识别与法规要求的偏离';

  protected buildSystemPrompt(): string {
    return `你是一个资深的合规分析专家。你的任务是基于法规检索结果，对文档内容进行深入的合规性分析。

你需要：
1. 逐条比对文档内容与法规要求
2. 识别所有与法规不符的条款或表述
3. 对于每个发现的问题，说明具体违反了哪条法规
4. 分析问题的严重程度和可能的法律后果
5. 对未发现问题的部分，也予以确认说明

请以 JSON 格式输出，结构如下：
{
  "analysisSummary": "总体分析摘要",
  "issues": [
    {
      "id": 1,
      "clauseLocation": "问题所在位置（如：第3条第2款）",
      "clauseContent": "原文内容",
      "regulationReference": "违反的法规条款",
      "issueDescription": "问题描述",
      "severity": "critical/high/medium/low",
      "legalConsequence": "可能的法律后果",
      "suggestedFix": "建议的修改方向"
    }
  ],
  "compliantClauses": [
    {
      "clauseLocation": "合规条款位置",
      "clauseContent": "原文内容",
      "regulationReference": "符合的法规条款",
      "note": "合规说明"
    }
  ]
}`;
  }

  protected buildUserPrompt(context: AgentContext): string {
    const retrievalResult = context.previousResults?.retrieval || '未提供检索结果';
    return `请基于以下法规检索结果，对文档进行合规性分析：

## 法规检索结果
${retrievalResult}

## 待审查文档
文档标题：${context.documentTitle || '未命名文档'}

文档内容：
${context.documentContent}

请逐条分析，确保不遗漏任何合规问题。`;
  }
}

// ==================== 3. 风险评级 Agent ====================
export class RiskAssessmentAgent extends BaseAgent {
  name = '风险评级 Agent';
  type = 'risk';
  description = '根据合规分析结果，对发现的问题进行风险评级和优先级排序';

  protected buildSystemPrompt(): string {
    return `你是一个专业的风险评估专家。你的任务是基于合规分析结果，对所有发现的合规问题进行风险评级和优先级排序。

你需要：
1. 对每个问题进行多维度的风险评估
2. 考虑法律风险、业务风险、声誉风险等多个维度
3. 给出综合风险等级和优先级排序
4. 提供风险缓解建议
5. 标注是否需要紧急处理

风险等级定义：
- critical: 可能导致重大法律诉讼、行政处罚或严重财务损失
- high: 存在明显合规缺陷，可能导致法律纠纷
- medium: 存在合规风险但不紧急，建议尽快修订
- low: 轻微合规问题，可在下次修订时处理

请以 JSON 格式输出，结构如下：
{
  "overallRiskLevel": "critical/high/medium/low",
  "riskScore": 85,
  "riskSummary": "整体风险摘要",
  "riskItems": [
    {
      "issueId": 1,
      "riskLevel": "critical/high/medium/low",
      "riskDimensions": {
        "legalRisk": "高/中/低",
        "businessRisk": "高/中/低",
        "reputationRisk": "高/中/低"
      },
      "priority": 1,
      "urgentAction": true/false,
      "mitigationSuggestion": "风险缓解建议",
      "deadline": "建议处理时限"
    }
  ],
  "recommendations": ["整体建议1", "整体建议2"]
}`;
  }

  protected buildUserPrompt(context: AgentContext): string {
    const analysisResult = context.previousResults?.analysis || '未提供分析结果';
    const retrievalResult = context.previousResults?.retrieval || '未提供检索结果';
    return `请基于以下合规分析和法规检索结果，进行风险评估：

## 法规检索结果
${retrievalResult}

## 合规分析结果
${analysisResult}

## 文档标题
${context.documentTitle || '未命名文档'}

请对所有问题进行系统的风险评估和优先级排序。`;
  }
}

// ==================== 4. 修订 Agent ====================
export class RevisionAgent extends BaseAgent {
  name = '文档修订 Agent';
  type = 'revision';
  description = '根据风险评级结果，生成文档修订建议和修改后的文档版本';

  protected buildSystemPrompt(): string {
    return `你是一个专业的法律文书修订专家。你的任务是基于风险评级结果，生成具体的文档修订建议，并输出修改后的文档版本。

你需要：
1. 针对每个高风险问题，给出具体的修订方案
2. 修订方案应包含：修改前对比、修改后内容、修改理由
3. 生成完整的修改后文档
4. 确保修订后的文档完全符合法规要求
5. 保持文档的原有意图和商业合理性

请以 JSON 格式输出，结构如下：
{
  "revisionSummary": "修订总体说明",
  "revisions": [
    {
      "issueId": 1,
      "originalText": "原文内容",
      "revisedText": "修改后内容",
      "reason": "修改理由及法规依据",
      "riskLevel": "对应的风险等级"
    }
  ],
  "revisedDocument": "完整的修改后文档内容",
  "additionalClauses": [
    {
      "suggestion": "建议增加的条款内容",
      "reason": "增加理由",
      "regulationReference": "法规依据"
    }
  ]
}`;
  }

  protected buildUserPrompt(context: AgentContext): string {
    const riskResult = context.previousResults?.risk || '未提供风险评级结果';
    const analysisResult = context.previousResults?.analysis || '未提供分析结果';
    return `请基于以下风险评估和合规分析结果，生成文档修订方案：

## 风险评估结果
${riskResult}

## 合规分析结果
${analysisResult}

## 原始文档
文档标题：${context.documentTitle || '未命名文档'}

文档内容：
${context.documentContent}

请生成详细的修订方案和修改后的完整文档。确保所有修改都符合法规要求。`;
  }
}

// ==================== Agent 工厂 ====================
export function createAgent(type: string): BaseAgent {
  switch (type) {
    case 'retrieval':
      return new RetrievalAgent();
    case 'analysis':
      return new AnalysisAgent();
    case 'risk':
      return new RiskAssessmentAgent();
    case 'revision':
      return new RevisionAgent();
    default:
      throw new Error(`未知的 Agent 类型: ${type}`);
  }
}
