// 多 Agent 协作编排引擎 - 顺序执行四个 Agent，支持实时进度更新

import { createAgent, type AgentContext, type AgentResult } from './agents';
import { AGENT_TYPES, type AgentType } from './agent-types';
import type { AIModelConfig } from './ai-service';
import { db } from './db';

export interface OrchestrationProgress {
  currentStep: AgentType;
  stepIndex: number;
  totalSteps: number;
  stepStatus: 'running' | 'completed' | 'failed';
  message: string;
  results: Record<string, AgentResult>;
}

export type ProgressCallback = (progress: OrchestrationProgress) => void;

export class OrchestrationEngine {
  private steps: AgentType[] = [...AGENT_TYPES];
  private modelConfig: AIModelConfig;
  private taskId: string;
  private onProgress: ProgressCallback;

  constructor(
    taskId: string,
    modelConfig: AIModelConfig,
    onProgress: ProgressCallback
  ) {
    this.taskId = taskId;
    this.modelConfig = modelConfig;
    this.onProgress = onProgress;
  }

  async execute(documentContent: string, documentTitle?: string): Promise<Record<string, AgentResult>> {
    const context: AgentContext = {
      documentContent,
      documentTitle,
      previousResults: {},
    };

    const results: Record<string, AgentResult> = {};

    for (let i = 0; i < this.steps.length; i++) {
      const stepType = this.steps[i];
      const agent = createAgent(stepType);

      // 更新进度：当前 Agent 开始执行
      this.onProgress({
        currentStep: stepType,
        stepIndex: i,
        totalSteps: this.steps.length,
        stepStatus: 'running',
        message: `${agent.name} 正在执行...`,
        results: { ...results },
      });

      // 更新数据库中的任务状态
      await db.complianceTask.update({
        where: { id: this.taskId },
        data: {
          currentStep: stepType,
          progress: Math.round((i / this.steps.length) * 100),
        },
      });

      // 创建 Agent 执行日志
      const log = await db.agentLog.create({
        data: {
          taskId: this.taskId,
          agentType: stepType,
          agentName: agent.name,
          status: 'running',
          input: JSON.stringify({ documentTitle, stepType }),
        },
      });

      const startTime = Date.now();

      try {
        const result = await agent.execute(context, this.modelConfig);

        // 更新日志
        await db.agentLog.update({
          where: { id: log.id },
          data: {
            status: result.success ? 'completed' : 'failed',
            output: result.output,
            error: result.error,
            duration: result.duration,
            tokenUsage: result.tokenUsage,
            completedAt: new Date(),
          },
        });

        results[stepType] = result;

        if (result.success) {
          // 将结果存入上下文，供后续 Agent 使用
          context.previousResults![stepType] = result.output;

          // 更新任务中的对应结果字段
          const resultFieldMap: Record<string, string> = {
            retrieval: 'retrievalResult',
            analysis: 'analysisResult',
            risk: 'riskResult',
            revision: 'revisionResult',
          };

          await db.complianceTask.update({
            where: { id: this.taskId },
            data: {
              [resultFieldMap[stepType]]: result.output,
            },
          });

          // 更新进度：当前 Agent 执行完成
          this.onProgress({
            currentStep: stepType,
            stepIndex: i,
            totalSteps: this.steps.length,
            stepStatus: 'completed',
            message: `${agent.name} 执行完成`,
            results: { ...results },
          });
        } else {
          // Agent 执行失败
          this.onProgress({
            currentStep: stepType,
            stepIndex: i,
            totalSteps: this.steps.length,
            stepStatus: 'failed',
            message: `${agent.name} 执行失败: ${result.error}`,
            results: { ...results },
          });

          // 即使某个 Agent 失败，也继续执行后续 Agent（使用之前的结果）
          context.previousResults![stepType] = result.error || '执行失败';
        }
      } catch (error: any) {
        // 捕获意外错误
        await db.agentLog.update({
          where: { id: log.id },
          data: {
            status: 'failed',
            error: error.message || '未知错误',
            duration: Date.now() - startTime,
            completedAt: new Date(),
          },
        });

        results[stepType] = {
          success: false,
          output: '',
          error: error.message || '未知错误',
          duration: Date.now() - startTime,
        };

        this.onProgress({
          currentStep: stepType,
          stepIndex: i,
          totalSteps: this.steps.length,
          stepStatus: 'failed',
          message: `${agent.name} 发生异常: ${error.message}`,
          results: { ...results },
        });
      }
    }

    // 计算统计信息
    const stats = this.calculateStats(results);

    // 更新任务最终状态
    await db.complianceTask.update({
      where: { id: this.taskId },
      data: {
        status: 'completed',
        progress: 100,
        currentStep: 'revision',
        totalIssues: stats.totalIssues,
        highRiskCount: stats.highRiskCount,
        mediumRiskCount: stats.mediumRiskCount,
        lowRiskCount: stats.lowRiskCount,
        completedAt: new Date(),
      },
    });

    return results;
  }

  private calculateStats(results: Record<string, AgentResult>) {
    let totalIssues = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    // 从分析结果中提取统计
    const analysisResult = results.analysis;
    if (analysisResult?.success) {
      try {
        const parsed = JSON.parse(analysisResult.output);
        if (parsed.issues && Array.isArray(parsed.issues)) {
          totalIssues = parsed.issues.length;
          parsed.issues.forEach((issue: any) => {
            if (issue.severity === 'critical' || issue.severity === 'high') highRiskCount++;
            else if (issue.severity === 'medium') mediumRiskCount++;
            else lowRiskCount++;
          });
        }
      } catch {
        // JSON 解析失败，使用默认值
      }
    }

    return { totalIssues, highRiskCount, mediumRiskCount, lowRiskCount };
  }
}
