// 单个模型操作 - 更新/删除/设为默认

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - 更新模型配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, provider, modelId, apiKey, baseUrl, maxTokens, temperature, isDefault, isActive } = body;

    // 如果设为默认，先取消其他默认
    if (isDefault) {
      await db.aIModel.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (provider !== undefined) updateData.provider = provider;
    if (modelId !== undefined) updateData.modelId = modelId;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const model = await db.aIModel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ model });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除模型
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.aIModel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
