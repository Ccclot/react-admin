# CopilotKit 集成指南

本文档详细说明如何在项目中集成 CopilotKit，实现 AI 智能助手功能。

---

## 目录

- [概述](#概述)
- [架构说明](#架构说明)
- [后端实现](#后端实现)
- [前端实现（React）](#前端实现react)
- [前端实现（Vue2）](#前端实现vue2)
- [配置说明](#配置说明)
- [自定义 Actions](#自定义-actions)
- [常见问题](#常见问题)

---

## 概述

CopilotKit 是一个用于构建 AI 助手的框架，支持：
- AI 聊天对话
- AI 自动补全文本框
- 自定义 AI 可执行的操作（Actions）
- 上下文感知（向 AI 提供当前页面状态）

### 两种使用方式

| 方式 | 说明 | 优缺点 |
|------|------|--------|
| CopilotKit Cloud | 使用官方托管服务 | 简单，但需要付费 |
| 自托管后端 | 自己搭建后端服务 | 可控，可使用自己的 LLM API |

本文档使用**自托管后端**方式。

---

## 架构说明

```
┌─────────────────┐     HTTP      ┌─────────────────┐     API      ┌─────────────────┐
│   前端应用      │ ────────────> │  CopilotKit     │ ───────────> │   LLM API       │
│  (React/Vue)    │               │   后端服务      │              │  (Anthropic)    │
│                 │ <──────────── │  (Node.js)      │ <─────────── │                 │
└─────────────────┘               └─────────────────┘              └─────────────────┘
        │                                   │
        │  useCopilotAction                 │  AnthropicAdapter
        │  useCopilotReadable               │  CopilotRuntime
        └───────────────────────────────────┘
```

---

## 后端实现

### 1. 创建项目目录

```bash
mkdir copilotkit-backend
cd copilotkit-backend
npm init -y
```

### 2. 安装依赖

```bash
npm install @copilotkit/runtime @anthropic-ai/sdk express
```

**依赖说明：**

| 包名 | 版本 | 说明 |
|------|------|------|
| `@copilotkit/runtime` | ^1.58.0 | CopilotKit 后端运行时 |
| `@anthropic-ai/sdk` | ^0.57.0 | Anthropic API SDK |
| `express` | ^4.21.0 | Web 服务器 |

### 3. 创建服务入口

**文件：** `server.js`

```javascript
// ========================================
// 重要：必须在所有 require 之前设置
// ========================================
process.env.COPILOTKIT_TELEMETRY_DISABLED = 'true';

const express = require('express');
const {
  CopilotRuntime,
  AnthropicAdapter,
  copilotRuntimeNodeExpressEndpoint,
} = require('@copilotkit/runtime');
const Anthropic = require('@anthropic-ai/sdk').default;

// ========================================
// 配置
// ========================================
const PORT = process.env.COPILOT_PORT || 4000;

// Anthropic API 配置
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'your-api-key';
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

// ========================================
// 创建 Anthropic 客户端
// ========================================
const anthropicClient = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  baseURL: ANTHROPIC_BASE_URL,
});

// ========================================
// 创建 Anthropic 适配器
// ========================================
const anthropicAdapter = new AnthropicAdapter({
  model: ANTHROPIC_MODEL,
  anthropic: anthropicClient,  // 传入客户端实例
});

// ========================================
// 创建 CopilotRuntime 实例
// ========================================
const runtime = new CopilotRuntime({});

// ========================================
// 创建 Express 应用
// ========================================
const app = express();

// 创建端点处理器
const handler = copilotRuntimeNodeExpressEndpoint({
  runtime,
  endpoint: '/copilotkit',
  serviceAdapter: anthropicAdapter,
});

// 处理所有 /copilotkit 路由
app.all('/copilotkit*', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// 启动服务器
// ========================================
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`CopilotKit backend running on http://localhost:${PORT}`);
  console.log(`Model: ${ANTHROPIC_MODEL}`);
  console.log(`Endpoint: /copilotkit`);
  console.log(`========================================\n`);
});
```

### 4. 启动服务

```bash
node server.js
```

服务将在 `http://localhost:4000` 运行。

### 5. 验证服务

```bash
# 健康检查
curl http://localhost:4000/health

# 测试 CopilotKit 端点
curl -X POST http://localhost:4000/copilotkit \
  -H "Content-Type: application/json" \
  -d '{"method":"info"}'
```

---

## 前端实现（React）

### 1. 安装依赖

```bash
npm install @copilotkit/react-core @copilotkit/react-ui
# 或
pnpm add @copilotkit/react-core @copilotkit/react-ui
```

### 2. 创建 Provider 组件

**文件：** `src/components/CopilotKitProvider/index.tsx`

```tsx
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import React from "react";

// 引入样式
import "@copilotkit/react-ui/styles.css";

// 引入自定义 Actions（可选）
import { useUserActions } from "@/hooks/useCopilotActions";

interface CopilotKitWrapperProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

/**
 * 内部组件 - 用于调用 hooks
 */
const CopilotKitInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 注册自定义 Actions
  useUserActions();
  return <>{children}</>;
};

/**
 * CopilotKit 包装组件
 */
const CopilotKitWrapper: React.FC<CopilotKitWrapperProps> = ({
  children,
  showSidebar = false,
}) => {
  return (
    <CopilotKit
      // 后端服务地址
      runtimeUrl="http://localhost:4000/copilotkit"
    >
      <CopilotKitInner>
        {children}
      </CopilotKitInner>

      {showSidebar && (
        <CopilotSidebar
          // 系统提示词
          instructions="你是系统的智能助手，帮助用户完成各种操作。"
          // UI 标签
          labels={{
            title: "AI 助手",
            initial: "有什么可以帮助您的？",
            placeholder: "输入您的问题...",
          }}
          // 默认关闭
          defaultOpen={false}
        />
      )}
    </CopilotKit>
  );
};

export default CopilotKitWrapper;
```

### 3. 在全局布局中引入

**文件：** `src/App.tsx` 或布局组件

```tsx
import CopilotKitWrapper from '@/components/CopilotKitProvider';

function App() {
  return (
    <CopilotKitWrapper showSidebar={true}>
      {/* 你的应用内容 */}
      <Router>
        <Routes />
      </Router>
    </CopilotKitWrapper>
  );
}
```

### 4. 使用 useCopilotReadable 提供上下文

```tsx
import { useCopilotReadable } from "@copilotkit/react-core";

function UserPage() {
  const user = useCurrentUser();

  // 向 AI 提供当前用户信息
  useCopilotReadable({
    description: "当前用户信息",
    value: JSON.stringify({
      id: user.id,
      name: user.name,
      role: user.role,
    }),
  });

  return <div>...</div>;
}
```

---

## 前端实现（Vue2）

### 1. 安装依赖

```bash
npm install @copilotkit/vue-core @copilotkit/vue-ui
# 或
yarn add @copilotkit/vue-core @copilotkit/vue-ui
```

> **注意：** 如果 CopilotKit 没有官方 Vue2 支持，可以使用以下替代方案：

### 替代方案：使用 Web Components

CopilotKit 提供了 Web Components 支持，可以在任何框架中使用。

#### 安装

```bash
npm install @copilotkit/web-components
```

#### 在 Vue2 中使用

**main.js:**

```javascript
import Vue from 'vue';
import '@copilotkit/web-components';

// 定义 CopilotKit 配置
window.copilotKitConfig = {
  runtimeUrl: 'http://localhost:4000/copilotkit',
};

new Vue({
  render: h => h(App),
}).$mount('#app');
```

**App.vue:**

```vue
<template>
  <div id="app">
    <!-- CopilotKit Provider -->
    <copilot-kit-provider :runtime-url="runtimeUrl">
      <!-- 你的应用内容 -->
      <router-view />

      <!-- AI 侧边栏 -->
      <copilot-sidebar
        :instructions="instructions"
        :labels="labels"
        :default-open="false"
      />
    </copilot-kit-provider>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      runtimeUrl: 'http://localhost:4000/copilotkit',
      instructions: '你是系统的智能助手，帮助用户完成各种操作。',
      labels: {
        title: 'AI 助手',
        initial: '有什么可以帮助您的？',
        placeholder: '输入您的问题...',
      },
    };
  },
};
</script>
```

### 替代方案：直接调用 API

如果 Web Components 不可用，可以直接调用后端 API：

**src/utils/copilot.js:**

```javascript
const COPILOT_URL = 'http://localhost:4000/copilotkit';

/**
 * 发送消息到 CopilotKit
 */
export async function sendMessage(messages, context = {}) {
  const response = await fetch(`${COPILOT_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'agent/run',
      params: {
        agentId: 'default',
        body: {
          messages,
          context,
        },
      },
    }),
  });

  return response.json();
}

/**
 * 获取 CopilotKit 信息
 */
export async function getInfo() {
  const response = await fetch(`${COPILOT_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'info',
    }),
  });

  return response.json();
}
```

**Vue 组件中使用：**

```vue
<template>
  <div class="ai-assistant">
    <div class="messages">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role]"
      >
        {{ msg.content }}
      </div>
    </div>
    <input
      v-model="input"
      @keyup.enter="send"
      placeholder="输入消息..."
    />
  </div>
</template>

<script>
import { sendMessage } from '@/utils/copilot';

export default {
  name: 'AiAssistant',
  data() {
    return {
      messages: [],
      input: '',
    };
  },
  methods: {
    async send() {
      if (!this.input.trim()) return;

      // 添加用户消息
      this.messages.push({
        role: 'user',
        content: this.input,
      });

      const userInput = this.input;
      this.input = '';

      // 发送到 CopilotKit
      const response = await sendMessage(this.messages);

      // 添加 AI 回复
      if (response.messages) {
        this.messages.push({
          role: 'assistant',
          content: response.messages[0].content,
        });
      }
    },
  },
};
</script>
```

---

## 配置说明

### CopilotKit Provider 配置

```tsx
<CopilotKit
  // 后端服务地址
  runtimeUrl="http://localhost:4000/copilotkit"

  // CopilotKit Cloud API Key（使用云服务时）
  // publicApiKey="ck_pub_xxx"

  // 是否显示开发者控制台
  // showDevConsole={false}
>
```

### UI 组件选择

| 组件 | 说明 | 适用场景 |
|------|------|----------|
| `<CopilotPopup>` | 右下角小弹窗 | 简单聊天，占用空间小 |
| `<CopilotSidebar>` | 右侧侧边栏 | 完整聊天体验 |
| `<CopilotChat>` | 内嵌聊天组件 | 自定义位置 |

### CopilotSidebar 配置

```tsx
<CopilotSidebar
  // 系统提示词（重要）
  instructions={`你是系统的智能助手。
你的职责：
1. 帮助用户了解系统功能
2. 解答用户问题
3. 执行用户请求的操作

请用中文回答，保持友好和专业。`}

  // UI 文案配置
  labels={{
    title: "AI 助手",
    initial: "有什么可以帮助您的？",
    placeholder: "输入您的问题...",
    regenerate: "重新生成",
  }}

  // 默认是否打开
  defaultOpen={false}

  // 点击按钮打开
  clickToOpen={true}

  // 响应用户输入
  respondToUserInput={true}
/>
```

### CopilotPopup 配置

```tsx
<CopilotPopup
  instructions="你是智能助手..."
  labels={{
    title: "AI 助手",
    initial: "有什么可以帮助您的？",
    placeholder: "输入问题...",
  }}
  defaultOpen={false}
/>
```

---

## 自定义 Actions

Actions 让 AI 能够执行实际操作，如查询数据、新增记录等。

### React 实现

**文件：** `src/hooks/useCopilotActions.ts`

```tsx
import { useCopilotAction } from "@copilotkit/react-core";
import { message } from "antd"; // 或其他提示组件
import { getUserList, addUser, updateUser, deleteUser } from "@/api/user";

export function useUserActions() {
  // 查询用户列表
  useCopilotAction({
    name: "getUserList",
    description: "查询用户列表，可按条件筛选",
    parameters: [
      {
        name: "userName",
        type: "string" as const,
        description: "用户名（可选，模糊查询）",
        required: false,
      },
      {
        name: "status",
        type: "string" as const,
        description: "状态：0=正常，1=停用",
        required: false,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await getUserList(params);
        if (result.code === 200) {
          return {
            success: true,
            data: result.rows,
            total: result.total,
            message: `查询成功，共 ${result.total} 条记录`,
          };
        }
        return { success: false, message: result.msg };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  });

  // 新增用户
  useCopilotAction({
    name: "addUser",
    description: "新增用户",
    parameters: [
      {
        name: "userName",
        type: "string" as const,
        description: "用户名（必填，唯一）",
        required: true,
      },
      {
        name: "nickName",
        type: "string" as const,
        description: "昵称（必填）",
        required: true,
      },
      {
        name: "password",
        type: "string" as const,
        description: "密码（必填）",
        required: true,
      },
      {
        name: "email",
        type: "string" as const,
        description: "邮箱（可选）",
        required: false,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await addUser(params);
        if (result.code === 200) {
          message.success("用户创建成功");
          return { success: true, message: `用户 ${params.userName} 创建成功` };
        }
        message.error(result.msg);
        return { success: false, message: result.msg };
      } catch (error: any) {
        message.error(error.message);
        return { success: false, message: error.message };
      }
    },
  });

  // 修改用户
  useCopilotAction({
    name: "updateUser",
    description: "修改用户信息",
    parameters: [
      {
        name: "userId",
        type: "number" as const,
        description: "用户ID（必填）",
        required: true,
      },
      {
        name: "nickName",
        type: "string" as const,
        description: "昵称",
        required: false,
      },
      {
        name: "status",
        type: "string" as const,
        description: "状态：0=正常，1=停用",
        required: false,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await updateUser(params);
        if (result.code === 200) {
          message.success("修改成功");
          return { success: true };
        }
        return { success: false, message: result.msg };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  });

  // 删除用户
  useCopilotAction({
    name: "deleteUser",
    description: "删除用户",
    parameters: [
      {
        name: "userIds",
        type: "string" as const,
        description: "用户ID，多个用逗号分隔",
        required: true,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await deleteUser(params.userIds);
        if (result.code === 200) {
          message.success("删除成功");
          return { success: true };
        }
        return { success: false, message: result.msg };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  });
}
```

### Vue2 实现

在 Vue2 中，可以使用 mixin 或在组件中直接定义：

**src/mixins/copilotActions.js:**

```javascript
import { sendMessage } from '@/utils/copilot';

export default {
  methods: {
    /**
     * 注册 CopilotKit Action
     */
    registerCopilotAction(action) {
      // 存储到全局或组件实例
      if (!window.copilotActions) {
        window.copilotActions = {};
      }
      window.copilotActions[action.name] = action;
    },

    /**
     * 执行 CopilotKit Action
     */
    async executeCopilotAction(name, params) {
      const action = window.copilotActions?.[name];
      if (action && action.handler) {
        return await action.handler(params);
      }
      return { success: false, message: `Action ${name} not found` };
    },
  },

  mounted() {
    // 注册用户管理 Actions
    this.registerCopilotAction({
      name: 'getUserList',
      description: '查询用户列表',
      parameters: [
        { name: 'userName', type: 'string', description: '用户名', required: false },
      ],
      handler: async (params) => {
        const result = await this.$api.user.getList(params);
        return { success: result.code === 200, data: result.rows };
      },
    });

    this.registerCopilotAction({
      name: 'addUser',
      description: '新增用户',
      parameters: [
        { name: 'userName', type: 'string', description: '用户名', required: true },
        { name: 'nickName', type: 'string', description: '昵称', required: true },
        { name: 'password', type: 'string', description: '密码', required: true },
      ],
      handler: async (params) => {
        const result = await this.$api.user.add(params);
        if (result.code === 200) {
          this.$message.success('创建成功');
        }
        return { success: result.code === 200 };
      },
    });
  },
};
```

---

## 常见问题

### 1. Agent not found

**错误信息：**
```
Agent 'default' not found after runtime sync
```

**原因：** 后端未正确配置 agent

**解决方案：** 确保使用 `serviceAdapter` 配置：

```javascript
const handler = copilotRuntimeNodeExpressEndpoint({
  runtime,
  endpoint: '/copilotkit',
  serviceAdapter: anthropicAdapter,  // 确保传入 adapter
});
```

### 2. API key is missing

**错误信息：**
```
Anthropic API key is missing
```

**原因：** API Key 参数名错误

**解决方案：** 传入 `anthropic` 客户端实例，而不是直接传 apiKey：

```javascript
// 错误
const adapter = new AnthropicAdapter({
  model: 'xxx',
  apiKey: 'xxx',  // ❌
});

// 正确
const client = new Anthropic({ apiKey: 'xxx' });
const adapter = new AnthropicAdapter({
  model: 'xxx',
  anthropic: client,  // ✅
});
```

### 3. Telemetry error

**错误信息：**
```
TypeError: _copilotkit_shared.lambdaClient.send is not a function
```

**原因：** telemetry 模块报错

**解决方案：** 在文件**最开头**（所有 require 之前）设置：

```javascript
// 必须在第一行
process.env.COPILOTKIT_TELEMETRY_DISABLED = 'true';

// 然后才是其他代码
const express = require('express');
// ...
```

### 4. Forbidden / API 错误

**错误信息：**
```
Forbidden
AppIdNoEnoughLicenceError
```

**原因：** API Key 无权限或配额不足

**解决方案：**
1. 检查 API Key 是否有效
2. 检查 API Key 配额
3. 确认 baseURL 是否正确

### 5. Failed to fetch / Network error

**原因：** 后端服务未启动或地址错误

**解决方案：**
1. 确认后端服务正在运行
2. 检查 `runtimeUrl` 配置是否正确
3. 检查 CORS 配置

### 6. TypeScript 类型错误

**错误信息：**
```
TS2554: Expected 0 arguments, but got 1
```

**解决方案：** 使用 `as const` 或类型断言：

```tsx
useCopilotAction({
  parameters: [
    {
      name: "userId",
      type: "number" as const,  // 添加 as const
      description: "用户ID",
      required: true,
    },
  ],
  handler: async (params: Record<string, any>) => {
    // ...
  },
});
```

---

## 文件结构

```
project/
├── copilotkit-backend/              # Node.js 后端
│   ├── package.json
│   ├── server.js
│   └── node_modules/                # 已加入 .gitignore
│
├── src/
│   ├── components/
│   │   └── CopilotKitProvider/      # Provider 组件
│   │       └── index.tsx
│   │
│   ├── hooks/                       # React hooks
│   │   └── useCopilotActions.ts     # 自定义 Actions
│   │
│   ├── mixins/                      # Vue mixins
│   │   └── copilotActions.js        # 自定义 Actions
│   │
│   ├── utils/
│   │   └── copilot.js               # API 调用工具
│   │
│   └── App.tsx / App.vue            # 主应用
│
└── .gitignore                       # 忽略 node_modules
```

---

## 启动流程

### 1. 启动后端

```bash
cd copilotkit-backend
node server.js
```

输出：
```
========================================
CopilotKit backend running on http://localhost:4000
Model: astron-code-latest
Endpoint: /copilotkit
========================================
```

### 2. 启动前端

```bash
cd react-ui  # 或 vue-app
npm run dev
```

### 3. 使用 AI 助手

1. 打开应用
2. 点击 AI 助手图标（右下角或右侧）
3. 输入问题或指令
4. AI 会根据上下文回答或执行操作

---

## 使用示例

### 基础对话

```
用户: 你好，请介绍一下这个系统
AI: 您好！这是若依管理系统，包含用户管理、角色管理、菜单管理等功能模块...
```

### 执行操作

```
用户: 帮我查询所有用户
AI: [调用 getUserList action]
    查询成功，共 15 条记录：
    1. admin - 管理员
    2. user1 - 普通用户
    ...

用户: 新增一个用户，用户名是 test，昵称是测试用户
AI: [调用 addUser action]
    用户 test 创建成功！

用户: 把用户 ID 为 5 的用户停用
AI: [调用 changeUserStatus action]
    用户状态已停用
```

---

## 参考资料

- [CopilotKit 官方文档](https://docs.copilotkit.ai)
- [CopilotKit GitHub](https://github.com/CopilotKit/CopilotKit)
- [Anthropic API 文档](https://docs.anthropic.com)
