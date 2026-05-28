// 必须在所有 require 之前设置
process.env.COPILOTKIT_TELEMETRY_DISABLED = 'true';

const express = require('express');
const {
  CopilotRuntime,
  AnthropicAdapter,
  copilotRuntimeNodeExpressEndpoint,
} = require('@copilotkit/runtime');
const Anthropic = require('@anthropic-ai/sdk').default;

const PORT = process.env.COPILOT_PORT || 4000;

// Anthropic 配置
const ANTHROPIC_API_KEY = '9cccde2027eea22723e1d45bb9ab267d:NWM5MmIwYjQ0NjVkMjI5MzI2MjA4N2Ni';
const ANTHROPIC_MODEL = 'astron-code-latest';

// 创建 Anthropic 客户端实例
const anthropicClient = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  baseURL: 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2',
});

// 创建 Anthropic 适配器
const anthropicAdapter = new AnthropicAdapter({
  model: ANTHROPIC_MODEL,
  anthropic: anthropicClient,
});

// 创建 CopilotRuntime 实例
const runtime = new CopilotRuntime({});

// 创建 Express 应用
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`CopilotKit backend: http://localhost:${PORT}`);
  console.log(`Model: ${ANTHROPIC_MODEL}`);
  console.log(`========================================\n`);
});