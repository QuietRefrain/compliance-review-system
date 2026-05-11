'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAppStore, type AIModelInfo } from '@/lib/store';
import {
  Plus,
  Trash2,
  Star,
  Edit2,
  BrainCircuit,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const PROVIDER_OPTIONS = [
  { value: 'zhipu', label: '智谱 AI (GLM)', description: '使用 z-ai-web-dev-sdk 内置接口' },
  { value: 'openai', label: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5 等' },
  { value: 'deepseek', label: 'DeepSeek', description: 'DeepSeek-V2, DeepSeek-Coder 等' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude 3.5 Sonnet, Claude 3 Opus 等' },
  { value: 'custom', label: '自定义 (OpenAI 兼容)', description: '任何兼容 OpenAI API 的服务' },
];

const PRESET_MODELS: Record<string, string[]> = {
  zhipu: ['glm-4', 'glm-4-plus', 'glm-4-flash', 'glm-4-long'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  custom: [],
};

export function ModelManager() {
  const { models, setModels, selectedModelId, setSelectedModelId } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // 表单状态
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('zhipu');
  const [formModelId, setFormModelId] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      setModels(data.models || []);
    } catch (err) {
      console.error('获取模型列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormProvider('zhipu');
    setFormModelId('');
    setFormApiKey('');
    setFormBaseUrl('');
    setFormMaxTokens(4096);
    setFormTemperature(0.7);
    setFormIsDefault(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  const handleEdit = (model: AIModelInfo) => {
    setFormName(model.name);
    setFormProvider(model.provider);
    setFormModelId(model.modelId);
    setFormApiKey('');
    setFormBaseUrl(model.baseUrl || '');
    setFormMaxTokens(model.maxTokens);
    setFormTemperature(model.temperature);
    setFormIsDefault(model.isDefault);
    setEditingId(model.id);
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!formName || !formModelId) {
      toast.error('请填写模型名称和模型ID');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // 更新
        const res = await fetch(`/api/models/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            provider: formProvider,
            modelId: formModelId,
            apiKey: formApiKey || undefined,
            baseUrl: formBaseUrl || undefined,
            maxTokens: formMaxTokens,
            temperature: formTemperature,
            isDefault: formIsDefault,
          }),
        });
        const data = await res.json();
        if (data.model) {
          toast.success('模型更新成功');
        }
      } else {
        // 创建
        const res = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            provider: formProvider,
            modelId: formModelId,
            apiKey: formApiKey || undefined,
            baseUrl: formBaseUrl || undefined,
            maxTokens: formMaxTokens,
            temperature: formTemperature,
            isDefault: formIsDefault,
          }),
        });
        const data = await res.json();
        if (data.model) {
          toast.success('模型添加成功');
        }
      }

      setShowAdd(false);
      resetForm();
      fetchModels();
    } catch (err) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/models/${id}`, { method: 'DELETE' });
      toast.success('模型已删除');
      fetchModels();
    } catch (err) {
      toast.error('删除失败');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      toast.success('已设为默认模型');
      fetchModels();
    } catch (err) {
      toast.error('设置失败');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      toast.success(isActive ? '模型已启用' : '模型已禁用');
      fetchModels();
    } catch (err) {
      toast.error('操作失败');
    }
  };

  const providerLabel = (p: string) => PROVIDER_OPTIONS.find(o => o.value === p)?.label || p;

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI 模型管理</h3>
          <p className="text-sm text-muted-foreground mt-1">
            配置和切换不同的 AI 大模型，支持 OpenAI、Anthropic、DeepSeek 等多种提供者
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> 添加模型
        </Button>
      </div>

      {/* 默认模型选择器 */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">当前活跃模型：</span>
            </div>
            <Select value={selectedModelId || ''} onValueChange={setSelectedModelId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="使用默认模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">自动（默认模型）</SelectItem>
                {models.filter(m => m.isActive).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 模型列表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <Card key={model.id} className={`hover:shadow-sm transition-shadow ${!model.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{model.name}</h4>
                      {model.isDefault && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          <Star className="w-3 h-3 mr-0.5" /> 默认
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {providerLabel(model.provider)} · {model.modelId}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Max Tokens: {model.maxTokens}</span>
                      <span>Temperature: {model.temperature}</span>
                    </div>
                    {model.baseUrl && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                        Base URL: {model.baseUrl}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={model.isActive}
                    onCheckedChange={(v) => handleToggleActive(model.id, v)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  {!model.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(model.id)}
                      className="text-xs"
                    >
                      <Star className="w-3 h-3 mr-1" /> 设为默认
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(model)}
                    className="text-xs"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> 编辑
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(model.id)}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> 删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {models.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-16 text-center">
              <BrainCircuit className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">暂无 AI 模型配置</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                系统默认使用智谱 GLM-4 模型，您也可以添加其他模型
              </p>
              <Button onClick={handleAdd} className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-1" /> 添加模型
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑模型' : '添加 AI 模型'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>模型名称 *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="如: GPT-4o, Claude 3.5 Sonnet"
                className="mt-1"
              />
            </div>

            <div>
              <Label>提供者 *</Label>
              <Select value={formProvider} onValueChange={(v) => { setFormProvider(v); setFormModelId(''); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>模型 ID *</Label>
              {PRESET_MODELS[formProvider]?.length > 0 ? (
                <Select value={formModelId} onValueChange={setFormModelId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择预设模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_MODELS[formProvider].map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formModelId}
                  onChange={(e) => setFormModelId(e.target.value)}
                  placeholder="如: gpt-4o, deepseek-chat"
                  className="mt-1"
                />
              )}
            </div>

            {formProvider !== 'zhipu' && (
              <>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder={editingId ? '留空保持不变' : '输入 API Key'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Base URL（可选）</Label>
                  <Input
                    value={formBaseUrl}
                    onChange={(e) => setFormBaseUrl(e.target.value)}
                    placeholder="自定义 API 地址"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formProvider === 'openai' && '默认: https://api.openai.com/v1'}
                    {formProvider === 'anthropic' && '默认: https://api.anthropic.com/v1'}
                    {formProvider === 'deepseek' && '默认: https://api.deepseek.com/v1'}
                    {formProvider === 'custom' && '必填: 输入兼容 OpenAI 的 API 地址'}
                  </p>
                </div>
              </>
            )}

            <div>
              <Label>Max Tokens: {formMaxTokens}</Label>
              <Slider
                value={[formMaxTokens]}
                onValueChange={([v]) => setFormMaxTokens(v)}
                min={256}
                max={32768}
                step={256}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Temperature: {formTemperature}</Label>
              <Slider
                value={[formTemperature]}
                onValueChange={([v]) => setFormTemperature(v)}
                min={0}
                max={1}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={formIsDefault} onCheckedChange={setFormIsDefault} />
              <Label>设为默认模型</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editingId ? '保存更改' : '添加模型'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
