# 智能合规审查系统

基于 Multi-Agent 协作的智能合规审查系统，支持自由切换 AI 大模型，提供法规检索、合规分析、风险评级和文档修订全流程自动化。

## 功能特性

- **多 Agent 协作**：检索、分析、风险评级、文档修订四个 Agent 协同工作
- **多模型支持**：支持 OpenAI、Anthropic、DeepSeek、智谱 AI 等多种大模型
- **实时审查**：输入文档即可实时获得合规审查结果
- **任务管理**：查看历史审查任务和详细执行日志
- **法规知识库**：内置法规条款数据库，支持智能检索

## 技术栈

- **框架**：Next.js 16 + React 19 + TypeScript
- **样式**：Tailwind CSS 4 + shadcn/ui
- **数据库**：SQLite + Prisma ORM
- **AI SDK**：z-ai-web-dev-sdk
- **状态管理**：Zustand

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
bun install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL=file:./db/custom.db
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库结构
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run db:push` | 推送数据库结构 |
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run db:reset` | 重置数据库 |

## 项目结构

```
├── prisma/              # 数据库模型
│   └── schema.prisma    # Prisma 模型定义
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API 路由
│   │   ├── layout.tsx   # 根布局
│   │   └── page.tsx     # 主页面
│   ├── components/      # React 组件
│   │   ├── dashboard.tsx       # 仪表盘
│   │   ├── model-manager.tsx   # 模型管理
│   │   ├── review-panel.tsx    # 实时审查
│   │   └── task-manager.tsx    # 任务管理
│   ├── lib/             # 工具函数
│   │   ├── agent-types.ts      # Agent 类型定义
│   │   └── store.ts            # Zustand 状态管理
│   └── components/ui/   # shadcn/ui 组件
├── .env                 # 环境变量
├── next.config.ts       # Next.js 配置
└── package.json         # 项目依赖
```

## 配置 AI 模型

1. 进入"模型管理"页面
2. 点击"添加模型"
3. 选择提供商并填写配置：
   - **智谱 AI**：无需配置 API Key，使用内置接口
   - **OpenAI/DeepSeek/Anthropic**：需要填写 API Key
   - **自定义**：填写 Base URL 和 API Key

## 使用流程

1. **配置模型**：在"模型管理"中添加或选择 AI 模型
2. **实时审查**：在"实时审查"页面输入文档内容，点击开始审查
3. **查看结果**：审查完成后查看各 Agent 的执行结果和风险评级
4. **任务管理**：在"审查任务"页面查看历史任务

## 数据库模型

- **AIModel**：AI 模型配置
- **Regulation**：法规知识库
- **RegulationClause**：法规条款
- **ComplianceTask**：合规审查任务
- **AgentLog**：Agent 执行日志

## 注意事项

- 开发环境使用 SQLite 文件数据库，数据存储在 `db/custom.db`
- 生产环境建议切换到 PostgreSQL 或 MySQL
- API Key 存储在数据库中，请妥善保管

## License

MIT
