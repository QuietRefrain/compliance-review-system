// AI 模型管理 API - CRUD + 切换默认模型

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - 获取所有模型配置
export async function GET() {
  try {
    const models = await db.aIModel.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    // 隐藏 API Key 的中间部分
    const safeModels = models.map(m => ({
      ...m,
      apiKey: m.apiKey ? `${m.apiKey.slice(0, 6)}****${m.apiKey.slice(-4)}` : null,
    }));

    return NextResponse.json({ models: safeModels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 创建新模型配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, provider, modelId, apiKey, baseUrl, maxTokens, temperature, isDefault } = body;

    if (!name || !provider || !modelId) {
      return NextResponse.json(
        { error: '名称、提供商和模型ID为必填项' },
        { status: 400 }
      );
    }

    // 如果设为默认，先取消其他默认
    if (isDefault) {
      await db.aIModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await db.aIModel.create({
      data: {
        name,
        provider,
        modelId,
        apiKey: apiKey || null,
        baseUrl: baseUrl || null,
        maxTokens: maxTokens || 4096,
        temperature: temperature ?? 0.7,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ model });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
