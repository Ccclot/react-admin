import { request } from '@umijs/max';

// 流程图数据结构
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type: string;
    description?: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
}

export interface FlowData {
  id?: number;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  description?: string;
}

// 后端存储格式（nodes 和 edges 为 JSON 字符串）
interface FlowDataRaw {
  id?: number;
  name: string;
  description?: string;
  nodes: string;
  edges: string;
}

// 序列化：前端对象 -> 后端字符串
const serializeFlow = (data: FlowData): FlowDataRaw => ({
  id: data.id,
  name: data.name,
  description: data.description,
  nodes: JSON.stringify(data.nodes || []),
  edges: JSON.stringify(data.edges || []),
});

// 反序列化：后端字符串 -> 前端对象
const deserializeFlow = (raw: any): FlowData => {
  if (!raw) return raw;
  let nodes: FlowNode[] = [];
  let edges: FlowEdge[] = [];
  try {
    nodes = typeof raw.nodes === 'string' ? JSON.parse(raw.nodes) : (raw.nodes || []);
  } catch (e) {
    nodes = [];
  }
  try {
    edges = typeof raw.edges === 'string' ? JSON.parse(raw.edges) : (raw.edges || []);
  } catch (e) {
    edges = [];
  }
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    nodes,
    edges,
  };
};

// 保存流程图
export async function saveFlow(params: FlowData, options?: { [key: string]: any }) {
  return request<API.Result>('/api/tool/flow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: serializeFlow(params),
    ...(options || {})
  });
}

// 更新流程图
export async function updateFlow(params: FlowData, options?: { [key: string]: any }) {
  return request<API.Result>('/api/tool/flow', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: serializeFlow(params),
    ...(options || {})
  });
}

// 获取流程图详情（自动反序列化）
export async function getFlow(id: number, options?: { [key: string]: any }) {
  const res = await request<API.Result>('/api/tool/flow/' + id, {
    method: 'GET',
    ...(options || {})
  });
  if (res && res.code === 200 && res.data) {
    res.data = deserializeFlow(res.data) as any;
  }
  return res;
}

// 获取流程图列表
export async function getFlowList(params?: { pageSize?: number; pageNum?: number; name?: string }, options?: { [key: string]: any }) {
  return request<any>('/api/tool/flow/list', {
    method: 'GET',
    params,
    ...(options || {})
  });
}

// 删除流程图
export async function deleteFlow(id: number, options?: { [key: string]: any }) {
  return request<API.Result>('/api/tool/flow/' + id, {
    method: 'DELETE',
    ...(options || {})
  });
}
