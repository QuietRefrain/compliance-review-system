// 法规知识库 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - 获取法规列表
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    const where: any = { isActive: true };
    if (category) where.category = category;

    const regulations = await db.regulation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { clauses: true },
    });

    const categories = await db.regulation.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      regulations,
      categories: categories.map(c => c.category),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 添加法规
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, content, source, effectiveDate, clauses } = body;

    if (!title || !category || !content) {
      return NextResponse.json({ error: '标题、分类和内容为必填项' }, { status: 400 });
    }

    const regulation = await db.regulation.create({
      data: {
        title,
        category,
        content,
        source: source || null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        clauses: clauses ? {
          create: clauses.map((c: any) => ({
            clauseNumber: c.clauseNumber,
            title: c.title,
            content: c.content,
            riskLevel: c.riskLevel || 'medium',
            keywords: c.keywords || null,
          })),
        } : undefined,
      },
      include: { clauses: true },
    });

    return NextResponse.json({ regulation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
