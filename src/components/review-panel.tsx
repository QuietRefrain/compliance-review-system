'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore, type AgentStepStatus } from '@/lib/store';
import { AGENT_INFO, type AgentType } from '@/lib/agent-types';
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  FlaskConical,
  AlertTriangle,
  PenLine,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const AGENT_ICONS: Record<string, React.ReactNode> = {
  retrieval: <Search className="w-5 h-5" />,
  analysis: <FlaskConical className="w-5 h-5" />,
  risk: <AlertTriangle className="w-5 h-5" />,
  revision: <PenLine className="w-5 h-5" />,
};

interface StepState {
  type: AgentType;
  name: string;
  status: AgentStepStatus;
  message: string;
  output?: string;
  duration?: number;
  tokenUsage?: number;
}

export function ReviewPanel() {
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepState[]>(
    (Object.keys(AGENT_INFO) as AgentType[]).map((type) => ({
      type,
      name: AGENT_INFO[type].name,
      status: 'pending',
      message: '等待执行',
    }))
  );
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const { models } = useAppStore();
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // 轮询任务状态
  const pollTask = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (!data.task) return;

      const task = data.task;
      const logs: any[] = task.agentLogs || [];

      // 更新步骤状态
      const stepTypeMap = ['retrieval', 'analysis', 'risk', 'revision'];
      const newSteps = stepTypeMap.map((type): StepState => {
        const log = logs.find((l: any) => l.agentType === type);
        if (!log) {
          return {
            type: type as AgentType,
            name: AGENT_INFO[type as AgentType].name,
            status: 'pending' as AgentStepStatus,
            message: '等待执行',
          };
        }
        return {
          type: type as AgentType,
          name: log.agentName,
          status: log.status as AgentStepStatus,
          message:
            log.status === 'completed'
              ? '执行完成'
              : log.status === 'failed'
              ? `失败: ${log.error || '未知错误'}`
              : log.status === 'running'
              ? '正在执行...'
              : '等待执行',
          output: log.output || undefined,
          duration: log.duration || undefined,
          tokenUsage: log.tokenUsage || undefined,
        };
      });

      setSteps(newSteps);

      // 检查是否完成
      if (task.status === 'completed' || task.status === 'failed') {
        setRunning(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        if (task.status === 'completed') {
          toast.success('合规审查完成！');
        } else {
          toast.error('审查任务执行失败');
        }
      }
    } catch (err) {
      console.error('轮询失败:', err);
    }
  }, []);

  const handleStart = async () => {
    if (!documentContent.trim()) {
      toast.error('请输入待审查的文档内容');
      return;
    }

    setRunning(true);
    // 重置步骤
    setSteps(
      (Object.keys(AGENT_INFO) as AgentType[]).map((type) => ({
        type,
        name: AGENT_INFO[type].name,
        status: 'pending',
        message: '等待执行',
      }))
    );

    try {
      // 先创建任务
      const createRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: documentTitle ? `审查: ${documentTitle}` : '合规审查任务',
          documentTitle: documentTitle || undefined,
          documentContent,
          aiModelId: selectedModelId || undefined,
        }),
      });
      const createData = await createRes.json();
      if (!createData.task) {
        toast.error('创建任务失败');
        setRunning(false);
        return;
      }

      const newTaskId = createData.task.id;
      setTaskId(newTaskId);

      // 启动审查
      const startRes = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: newTaskId,
          aiModelId: selectedModelId || undefined,
        }),
      });
      const startData = await startRes.json();
      if (startData.success) {
        toast.success(`审查已启动，使用模型: ${startData.model}`);
        // 开始轮询
        pollRef.current = setInterval(() => pollTask(newTaskId), 2000);
      } else {
        toast.error(startData.error || '启动失败');
        setRunning(false);
      }
    } catch (err) {
      toast.error('启动审查失败');
      setRunning(false);
    }
  };

  const handleReset = () => {
    setDocumentTitle('');
    setDocumentContent('');
    setTaskId(null);
    setRunning(false);
    setSteps(
      (Object.keys(AGENT_INFO) as AgentType[]).map((type) => ({
        type,
        name: AGENT_INFO[type].name,
        status: 'pending',
        message: '等待执行',
      }))
    );
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const toggleExpand = (type: string) => {
    setExpandedSteps((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const getStatusIcon = (status: AgentStepStatus) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: AgentStepStatus) => {
    switch (status) {
      case 'running':
        return 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20';
      case 'completed':
        return 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20';
      case 'failed':
        return 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20';
      default:
        return 'border-border';
    }
  };

  // 计算总进度
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const totalProgress = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左侧：文档输入 */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-emerald-500" />
              文档输入
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">文档标题</label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="如：劳动合同书"
                className="mt-1"
                disabled={running}
              />
            </div>
            <div>
              <label className="text-sm font-medium">文档内容</label>
              <Textarea
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="粘贴待审查的合同、协议等文档内容..."
                className="mt-1 min-h-[300px]"
                disabled={running}
              />
            </div>
            <div>
              <label className="text-sm font-medium">选择 AI 模型</label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={running}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="使用默认模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">自动（默认模型）</SelectItem>
                  {models
                    .filter((m) => m.isActive)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleStart}
                disabled={running || !documentContent.trim()}
                className="flex-1"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    审查中... {totalProgress}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    开始审查
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={running}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* 总进度条 */}
            {running && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>总体进度</span>
                  <span>{totalProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 右侧：Agent 执行状态 */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Multi-Agent 协作流程
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.type}
                  className={`rounded-lg border-2 p-4 transition-all duration-300 ${getStatusColor(
                    step.status
                  )}`}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => step.output && toggleExpand(step.type)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 步骤编号 */}
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-foreground">{AGENT_ICONS[step.type]}</div>
                        <div>
                          <p className="text-sm font-medium">{step.name}</p>
                          <p className="text-xs text-muted-foreground">{step.message}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.duration && (
                        <span className="text-xs text-muted-foreground">
                          {(step.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                      {step.tokenUsage && (
                        <Badge variant="outline" className="text-xs">
                          {step.tokenUsage} tokens
                        </Badge>
                      )}
                      {getStatusIcon(step.status)}
                      {step.output && (
                        expandedSteps[step.type] ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </div>

                  {/* 展开结果 */}
                  {expandedSteps[step.type] && step.output && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-80 whitespace-pre-wrap">
                        {formatJSON(step.output)}
                      </pre>
                    </div>
                  )}

                  {/* 连接线 */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center mt-2">
                      <div className="w-0.5 h-4 bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 工作流说明 */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">协作流程说明</h5>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong>1. 法规检索</strong> → 识别文档类型，检索相关法律法规条款</p>
                <p><strong>2. 合规分析</strong> → 逐条比对文档内容与法规要求</p>
                <p><strong>3. 风险评级</strong> → 多维度评估风险，优先级排序</p>
                <p><strong>4. 文档修订</strong> → 生成修订建议和修改后文档</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
