// 审查任务 API - 列表/创建

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      db.complianceTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          aiModel: { select: { id: true, name: true, provider: true, modelId: true } },
        },
      }),
      db.complianceTask.count({ where }),
    ]);

    return NextResponse.json({ tasks, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, documentContent, documentTitle, aiModelId } = body;

    if (!title || !documentContent) {
      return NextResponse.json(
        { error: '任务标题和文档内容为必填项' },
        { status: 400 }
      );
    }

    const task = await db.complianceTask.create({
      data: {
        title,
        description: description || null,
        documentContent,
        documentTitle: documentTitle || null,
        aiModelId: aiModelId || null,
        status: 'pending',
      },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
