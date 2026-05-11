// 单个任务 API - 获取详情/删除

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - 获取任务详情（含 Agent 日志）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await db.complianceTask.findUnique({
      where: { id },
      include: {
        aiModel: { select: { id: true, name: true, provider: true, modelId: true } },
        agentLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.agentLog.deleteMany({ where: { taskId: id } });
    await db.complianceTask.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
