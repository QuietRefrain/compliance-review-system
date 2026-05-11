'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAppStore } from '@/lib/store';
import { Dashboard } from '@/components/dashboard';
import { TaskManager } from '@/components/task-manager';
import { ModelManager } from '@/components/model-manager';
import { ReviewPanel } from '@/components/review-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  FileSearch,
  Settings2,
  BrainCircuit,
  Menu,
  X,
  Shield,
  Sparkles,
} from 'lucide-react';

const emptySubscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;

const tabs = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'tasks', label: '审查任务', icon: FileSearch },
  { id: 'review', label: '实时审查', icon: BrainCircuit },
  { id: 'models', label: '模型管理', icon: Settings2 },
];

export default function Home() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, setModels } = useAppStore();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    // 加载模型列表
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (data.models) setModels(data.models);
      })
      .catch(console.error);
  }, [setModels]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* 侧边栏 */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } border-r border-border bg-card transition-all duration-300 flex flex-col shrink-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold truncate">合规审查系统</h1>
              <p className="text-xs text-muted-foreground truncate">Multi-Agent AI</p>
            </div>
          )}
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="truncate">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* 底部 */}
        {sidebarOpen && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>AI 驱动合规审查</span>
            </div>
          </div>
        )}
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              {activeTab === 'review' && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                  Multi-Agent
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'tasks' && <TaskManager />}
          {activeTab === 'review' && <ReviewPanel />}
          {activeTab === 'models' && <ModelManager />}
        </div>
      </main>
    </div>
  );
}
