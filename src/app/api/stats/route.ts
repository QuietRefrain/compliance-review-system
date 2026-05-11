// 统计数据 API

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalTasks,
      completedTasks,
      runningTasks,
      pendingTasks,
      failedTasks,
      recentTasks,
      models,
    ] = await Promise.all([
      db.complianceTask.count(),
      db.complianceTask.count({ where: { status: 'completed' } }),
      db.complianceTask.count({ where: { status: 'running' } }),
      db.complianceTask.count({ where: { status: 'pending' } }),
      db.complianceTask.count({ where: { status: 'failed' } }),
      db.complianceTask.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          aiModel: { select: { name: true } },
        },
      }),
      db.aIModel.findMany({
        where: { isActive: true },
        select: { id: true, name: true, provider: true, modelId: true, isDefault: true },
      }),
    ]);

    // 汇总风险统计
    const completedTaskData = await db.complianceTask.findMany({
      where: { status: 'completed' },
      select: { totalIssues: true, highRiskCount: true, mediumRiskCount: true, lowRiskCount: true },
    });

    const totalIssues = completedTaskData.reduce((sum, t) => sum + t.totalIssues, 0);
    const totalHighRisk = completedTaskData.reduce((sum, t) => sum + t.highRiskCount, 0);
    const totalMediumRisk = completedTaskData.reduce((sum, t) => sum + t.mediumRiskCount, 0);
    const totalLowRisk = completedTaskData.reduce((sum, t) => sum + t.lowRiskCount, 0);

    return NextResponse.json({
      tasks: { total: totalTasks, completed: completedTasks, running: runningTasks, pending: pendingTasks, failed: failedTasks },
      risks: { total: totalIssues, high: totalHighRisk, medium: totalMediumRisk, low: totalLowRisk },
      recentTasks,
      models,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
