// Zustand store - 全局状态管理

import { create } from 'zustand';

export type AgentStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentStep {
  type: string;
  name: string;
  status: AgentStepStatus;
  message: string;
  output?: string;
  duration?: number;
  tokenUsage?: number;
}

export interface TaskProgress {
  taskId: string;
  isRunning: boolean;
  currentStep: string;
  progress: number;
  steps: AgentStep[];
}

export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  maxTokens: number;
  temperature: number;
  isDefault: boolean;
  isActive: boolean;
}

interface AppState {
  // 当前活跃的 Tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // 任务执行进度
  taskProgress: TaskProgress | null;
  setTaskProgress: (progress: TaskProgress | null) => void;
  updateAgentStep: (stepType: string, status: AgentStepStatus, message: string, output?: string) => void;

  // AI 模型列表
  models: AIModelInfo[];
  setModels: (models: AIModelInfo[]) => void;

  // 选中的模型
  selectedModelId: string | null;
  setSelectedModelId: (id: string | null) => void;

  // 侧边栏
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  taskProgress: null,
  setTaskProgress: (progress) => set({ taskProgress: progress }),
  updateAgentStep: (stepType, status, message, output) =>
    set((state) => {
      if (!state.taskProgress) return state;
      const steps = state.taskProgress.steps.map((s) =>
        s.type === stepType ? { ...s, status, message, output } : s
      );
      return {
        taskProgress: {
          ...state.taskProgress,
          steps,
          currentStep: stepType,
          progress: Math.round(
            (steps.filter((s) => s.status === 'completed').length / steps.length) * 100
          ),
        },
      };
    }),

  models: [],
  setModels: (models) => set({ models }),

  selectedModelId: null,
  setSelectedModelId: (id) => set({ selectedModelId: id }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
