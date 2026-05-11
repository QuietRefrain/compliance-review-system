'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BrainCircuit,
  ShieldAlert,
  Activity,
} from 'lucide-react';

interface Stats {
  tasks: { total: number; completed: number; running: number; pending: number; failed: number };
  risks: { total: number; high: number; medium: number; low: number };
  recentTasks: any[];
  models: any[];
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: '总审查任务',
      value: stats.tasks.total,
      icon: FileSearch,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: '已完成',
      value: stats.tasks.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: '执行中',
      value: stats.tasks.running,
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: '发现风险',
      value: stats.risks.total,
      icon: ShieldAlert,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 风险分布 + 可用模型 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 风险等级分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              风险等级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: '高风险', count: stats.risks.high, color: 'bg-red-500', textColor: 'text-red-600' },
                { label: '中风险', count: stats.risks.medium, color: 'bg-amber-500', textColor: 'text-amber-600' },
                { label: '低风险', count: stats.risks.low, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
              ].map((item) => {
                const total = stats.risks.total || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${item.color}`} />
                        {item.label}
                      </span>
                      <span className={item.textColor}>
                        {item.count} 项 ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 可用模型 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-emerald-500" />
              AI 模型状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.models.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BrainCircuit className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无配置模型</p>
                <p className="text-xs mt-1">请在模型管理中添加 AI 模型</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.models.map((model: any) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {model.provider.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{model.name}</p>
                        <p className="text-xs text-muted-foreground">{model.modelId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {model.isDefault && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                          默认
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">{model.provider}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近任务 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            最近审查任务
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">暂无审查任务</p>
              <p className="text-xs mt-1">创建第一个合规审查任务开始使用</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-emerald-500'
                          : task.status === 'running'
                          ? 'bg-amber-500 animate-pulse'
                          : task.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.aiModel?.name || '默认模型'} · {new Date(task.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.totalIssues > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {task.totalIssues} 个问题
                      </Badge>
                    )}
                    <Badge
                      variant={
                        task.status === 'completed'
                          ? 'default'
                          : task.status === 'running'
                          ? 'secondary'
                          : task.status === 'failed'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="text-xs"
                    >
                      {task.status === 'completed'
                        ? '已完成'
                        : task.status === 'running'
                        ? '执行中'
                        : task.status === 'failed'
                        ? '失败'
                        : '待执行'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
