// Agent 类型定义 - 可在客户端和服务端共享使用

export const AGENT_TYPES = ['retrieval', 'analysis', 'risk', 'revision'] as const;
export type AgentType = typeof AGENT_TYPES[number];

export const AGENT_INFO: Record<AgentType, { name: string; description: string; icon: string }> = {
  retrieval: {
    name: '法规检索 Agent',
    description: '从法规知识库中检索相关法律法规条款',
    icon: '🔍',
  },
  analysis: {
    name: '合规分析 Agent',
    description: '逐条比对文档内容与法规要求',
    icon: '🔬',
  },
  risk: {
    name: '风险评级 Agent',
    description: '多维度风险评估和优先级排序',
    icon: '⚠️',
  },
  revision: {
    name: '文档修订 Agent',
    description: '生成修订建议和修改后文档',
    icon: '✏️',
  },
};
