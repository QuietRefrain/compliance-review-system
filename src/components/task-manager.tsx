'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import {
  Plus,
  Play,
  Trash2,
  Eye,
  FileSearch,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  documentTitle?: string;
  status: string;
  progress: number;
  currentStep?: string;
  totalIssues: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  createdAt: string;
  aiModel?: { id: string; name: string; provider: string };
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const { models, selectedModelId, setSelectedModelId } = useAppStore();

  // 创建表单
  const [formTitle, setFormTitle] = useState('');
  const [formDocTitle, setFormDocTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formModelId, setFormModelId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('获取任务列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('请填写任务标题和文档内容');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          documentTitle: formDocTitle,
          documentContent: formContent,
          aiModelId: formModelId || undefined,
        }),
      });
      const data = await res.json();
      if (data.task) {
        toast.success('任务创建成功');
        setShowCreate(false);
        setFormTitle('');
        setFormDocTitle('');
        setFormContent('');
        setFormModelId('');
        fetchTasks();
      }
    } catch (err) {
      toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (taskId: string) => {
    setStarting(taskId);
    try {
      const res = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          aiModelId: selectedModelId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`审查任务已启动，使用模型: ${data.model}`);
        fetchTasks();
      } else {
        toast.error(data.error || '启动失败');
      }
    } catch (err) {
      toast.error('启动失败');
    } finally {
      setStarting(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      toast.success('任务已删除');
      fetchTasks();
    } catch (err) {
      toast.error('删除失败');
    }
  };

  const handleViewDetail = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      setTaskDetail(data.task);
      setShowDetail(taskId);
    } catch (err) {
      toast.error('获取详情失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '待执行', variant: 'outline' },
      running: { label: '执行中', variant: 'secondary' },
      completed: { label: '已完成', variant: 'default' },
      failed: { label: '失败', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  // 预置示例文档
  const sampleDocuments = [
    {
      title: '员工劳动合同审查',
      docTitle: '劳动合同书',
      content: `甲方（用人单位）：XX科技有限公司\n乙方（劳动者）：张三\n\n第一条 合同期限\n本合同为固定期限合同，自2024年1月1日起至2024年12月31日止。试用期为6个月。\n\n第二条 工作内容\n乙方同意在甲方担任软件工程师岗位，甲方有权根据需要调整乙方的工作岗位。\n\n第三条 劳动报酬\n乙方月工资为人民币5000元，甲方每月15日支付上月工资。\n\n第四条 工作时间\n乙方每周工作6天，每天工作9小时。\n\n第五条 保密条款\n乙方在离职后5年内不得从事与甲方相同或类似的业务，不得向任何第三方披露甲方的商业秘密。\n\n第六条 解除合同\n甲方有权随时解除本合同，无需提前通知乙方。\n\n第七条 竞业限制\n乙方离职后3年内不得加入甲方竞争对手公司，甲方不支付竞业限制补偿金。`,
    },
    {
      title: '数据处理协议审查',
      docTitle: '数据处理协议',
      content: `甲方（数据控制者）：XX网络科技集团\n乙方（数据处理者）：YY云服务公司\n\n第一条 数据处理范围\n乙方负责处理甲方的用户个人信息数据，包括但不限于姓名、身份证号、银行账户、位置信息、生物特征等。\n\n第二条 数据存储\n乙方可将数据存储于境外服务器，无需另行通知甲方。\n\n第三条 数据安全\n乙方应采取适当的技术措施保护数据安全。具体措施由乙方自行决定。\n\n第四条 数据共享\n乙方可将处理后的数据用于改善自身产品和服务。\n\n第五条 数据保留\n数据保留期限由乙方自行确定。\n\n第六条 违约责任\n因乙方原因导致数据泄露的，乙方赔偿金额上限为10万元。`,
    },
    {
      title: '采购合同审查',
      docTitle: '设备采购合同',
      content: `买方：XX制造有限公司\n卖方：ZZ设备有限公司\n\n第一条 标的物\n买方向卖方采购生产设备10台，型号为Z-2000。\n\n第二条 价款\n设备总价为人民币100万元，买方应在合同签订后3日内支付全款。\n\n第三条 交付\n卖方应于收到全款后60日内交付设备，交付地点由卖方指定。\n\n第四条 质量保证\n卖方对设备质量保证期为3个月，自交付之日起算。\n\n第五条 违约责任\n卖方延迟交付的，每日按合同总价0.01%支付违约金。违约金上限为合同总价的5%。\n\n第六条 争议解决\n因本合同产生的争议，由卖方所在地人民法院管辖。\n\n第七条 不可抗力\n卖方可将生产任务转包给第三方完成。`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">审查任务列表</h3>
          <Badge variant="secondary" className="text-xs">{tasks.length} 个任务</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> 新建任务
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建合规审查任务</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* 快速填充示例 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">快速选择示例文档：</p>
                  <div className="flex flex-wrap gap-2">
                    {sampleDocuments.map((doc) => (
                      <Button
                        key={doc.title}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormTitle(doc.title);
                          setFormDocTitle(doc.docTitle);
                          setFormContent(doc.content);
                        }}
                      >
                        {doc.title}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">任务标题 *</label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="如：员工劳动合同合规审查"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">文档标题</label>
                  <Input
                    value={formDocTitle}
                    onChange={(e) => setFormDocTitle(e.target.value)}
                    placeholder="如：劳动合同书"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">文档内容 *</label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="粘贴待审查的文档内容..."
                    className="mt-1 min-h-[200px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">选择 AI 模型</label>
                  <Select value={formModelId} onValueChange={setFormModelId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="使用默认模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    创建任务
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 任务列表 */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSearch className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">暂无审查任务</p>
            <p className="text-sm text-muted-foreground/70 mt-1">点击上方"新建任务"开始合规审查</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{task.aiModel?.name || '默认模型'}</span>
                      <span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                      {task.totalIssues > 0 && (
                        <span className="text-amber-600">
                          {task.totalIssues} 个问题
                        </span>
                      )}
                    </div>
                    {task.status === 'running' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>执行进度</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          当前步骤: {task.currentStep || '准备中...'}
                        </p>
                      </div>
                    )}
                    {task.status === 'completed' && (
                      <div className="flex items-center gap-3 mt-2">
                        {task.highRiskCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            高风险 {task.highRiskCount}
                          </Badge>
                        )}
                        {task.mediumRiskCount > 0 && (
                          <Badge variant="secondary" className="text-xs text-amber-600">
                            中风险 {task.mediumRiskCount}
                          </Badge>
                        )}
                        {task.lowRiskCount > 0 && (
                          <Badge variant="outline" className="text-xs text-emerald-600">
                            低风险 {task.lowRiskCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStart(task.id)}
                        disabled={starting === task.id}
                      >
                        {starting === task.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        开始审查
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetail(task.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 任务详情弹窗 */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>审查结果详情</DialogTitle>
          </DialogHeader>
          {taskDetail && (
            <div className="space-y-6 mt-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">任务标题</p>
                  <p className="font-medium">{taskDetail.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">使用模型</p>
                  <p className="font-medium">{taskDetail.aiModel?.name || '默认模型'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  {getStatusBadge(taskDetail.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">创建时间</p>
                  <p>{new Date(taskDetail.createdAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>

              {/* Agent 日志 */}
              <div>
                <h4 className="font-medium mb-3">Agent 执行日志</h4>
                <div className="space-y-3">
                  {taskDetail.agentLogs?.map((log: any) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                              {log.agentName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.status === 'completed' ? '已完成' : log.status === 'failed' ? '失败' : '执行中'}
                            </span>
                          </div>
                          {log.duration && (
                            <span className="text-xs text-muted-foreground">
                              耗时 {(log.duration / 1000).toFixed(1)}s
                              {log.tokenUsage ? ` · ${log.tokenUsage} tokens` : ''}
                            </span>
                          )}
                        </div>
                        {log.output && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              查看输出结果
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                              {formatJSON(log.output)}
                            </pre>
                          </details>
                        )}
                        {log.error && (
                          <p className="text-xs text-destructive mt-2">{log.error}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 各阶段结果 */}
              {taskDetail.revisionResult && (
                <div>
                  <h4 className="font-medium mb-3">修订后文档</h4>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                      {formatJSON(taskDetail.revisionResult)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
