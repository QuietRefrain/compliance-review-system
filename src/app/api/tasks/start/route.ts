// 启动合规审查任务 - 执行多 Agent 协作编排

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrchestrationEngine } from '@/lib/orchestration';
import type { AIModelConfig } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, aiModelId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId 为必填项' }, { status: 400 });
    }

    const task = await db.complianceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    if (task.status === 'running') {
      return NextResponse.json({ error: '任务正在执行中' }, { status: 400 });
    }

    // 获取 AI 模型配置
    let modelConfig: AIModelConfig;

    if (aiModelId) {
      const model = await db.aIModel.findUnique({ where: { id: aiModelId } });
      if (!model) {
        return NextResponse.json({ error: 'AI 模型不存在' }, { status: 404 });
      }
      modelConfig = {
        id: model.id,
        name: model.name,
        provider: model.provider,
        modelId: model.modelId,
        apiKey: model.apiKey || undefined,
        baseUrl: model.baseUrl || undefined,
        maxTokens: model.maxTokens,
        temperature: model.temperature,
      };

      // 更新任务使用的模型
      await db.complianceTask.update({
        where: { id: taskId },
        data: { aiModelId: model.id },
      });
    } else {
      // 使用默认模型
      const defaultModel = await db.aIModel.findFirst({
        where: { isDefault: true, isActive: true },
      });

      if (!defaultModel) {
        // 使用 z-ai-web-dev-sdk 内置模型
        modelConfig = {
          id: 'default',
          name: 'GLM-4 (默认)',
          provider: 'zhipu',
          modelId: 'glm-4',
          maxTokens: 4096,
          temperature: 0.7,
        };
      } else {
        modelConfig = {
          id: defaultModel.id,
          name: defaultModel.name,
          provider: defaultModel.provider,
          modelId: defaultModel.modelId,
          apiKey: defaultModel.apiKey || undefined,
          baseUrl: defaultModel.baseUrl || undefined,
          maxTokens: defaultModel.maxTokens,
          temperature: defaultModel.temperature,
        };

        await db.complianceTask.update({
          where: { id: taskId },
          data: { aiModelId: defaultModel.id },
        });
      }
    }

    // 更新任务状态为运行中
    await db.complianceTask.update({
      where: { id: taskId },
      data: { status: 'running', progress: 0 },
    });

    // 异步执行编排（不等待完成，立即返回）
    const engine = new OrchestrationEngine(
      taskId,
      modelConfig,
      (progress) => {
        // 进度回调 - 这里只打印日志，实际通过轮询获取
        console.log(`[Orchestration] Task ${taskId}: Step ${progress.stepIndex + 1}/${progress.totalSteps} - ${progress.message}`);
      }
    );

    // 在后台执行
    engine.execute(task.documentContent, task.documentTitle || undefined)
      .then((results) => {
        console.log(`[Orchestration] Task ${taskId} completed. Steps: ${Object.keys(results).length}`);
      })
      .catch((error) => {
        console.error(`[Orchestration] Task ${taskId} failed:`, error);
        // 更新任务为失败状态
        db.complianceTask.update({
          where: { id: taskId },
          data: { status: 'failed' },
        }).catch(console.error);
      });

    return NextResponse.json({
      success: true,
      message: '审查任务已启动',
      taskId,
      model: modelConfig.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
