import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  Handle,
  Position,
} from '@xyflow/react';
import { Button, Input, Modal, Form, Select, Card, Space, message, List, Popconfirm } from 'antd';
import { SaveOutlined, FolderOpenOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { saveFlow, updateFlow, getFlow, getFlowList, deleteFlow, FlowData } from '@/services/tool/flow';
import '@xyflow/react/dist/style.css';

const { TextArea } = Input;

// 自定义节点组件 - 带连接点
const CustomNode = ({ data, selected }: any) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        border: selected ? '2px solid #1890ff' : '1px solid #ccc',
        backgroundColor: data.type === 'input' ? '#e6f7ff' : data.type === 'output' ? '#f6ffed' : '#fff',
        minWidth: '120px',
        textAlign: 'center',
        boxShadow: selected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
        position: 'relative',
      }}
    >
      {/* 顶部连接点 - 目标 */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ background: '#555', width: 10, height: 10 }}
      />
      {/* 左侧连接点 - 目标 */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ background: '#555', width: 10, height: 10 }}
      />

      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.label}</div>
      {data.description && (
        <div style={{ fontSize: '12px', color: '#666' }}>{data.description}</div>
      )}

      {/* 底部连接点 - 源 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ background: '#555', width: 10, height: 10 }}
      />
      {/* 右侧连接点 - 源 */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ background: '#555', width: 10, height: 10 }}
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const defaultNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    data: { label: '开始节点', type: 'input', description: '流程起点' },
    position: { x: 250, y: 0 },
  },
  {
    id: '2',
    type: 'custom',
    data: { label: '中间节点 A', type: 'default', description: '处理数据' },
    position: { x: 100, y: 150 },
  },
  {
    id: '3',
    type: 'custom',
    data: { label: '中间节点 B', type: 'default', description: '处理逻辑' },
    position: { x: 400, y: 150 },
  },
  {
    id: '4',
    type: 'custom',
    data: { label: '结束节点', type: 'output', description: '流程终点' },
    position: { x: 250, y: 300 },
  },
];

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'bottom-source', animated: true },
  { id: 'e1-3', source: '1', target: '3', sourceHandle: 'bottom-source', animated: true },
  { id: 'e2-4', source: '2', target: '4', sourceHandle: 'bottom-source', animated: true },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'bottom-source', animated: true },
];

interface NodeFormData {
  label: string;
  type: string;
  description: string;
}

interface SaveFormData {
  name: string;
  description: string;
}

const ReactFlowDemoInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [flowList, setFlowList] = useState<any[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [saveForm] = Form.useForm();
  const { project } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  // 点击空白处取消选中
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // 点击节点选中
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // 双击节点直接编辑
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsEdit(true);
    form.setFieldsValue({
      label: node.data.label,
      type: node.data.type || 'default',
      description: node.data.description || '',
    });
    setIsModalOpen(true);
  }, [form]);

  // 打开新增节点弹窗
  const handleAddNode = () => {
    setIsEdit(false);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 打开编辑节点弹窗
  const handleEditNode = () => {
    if (!selectedNode) {
      message.warning('请先选择一个节点');
      return;
    }
    setIsEdit(true);
    form.setFieldsValue({
      label: selectedNode.data.label,
      type: selectedNode.data.type || 'default',
      description: selectedNode.data.description || '',
    });
    setIsModalOpen(true);
  };

  // 删除节点
  const handleDeleteNode = () => {
    if (!selectedNode) {
      message.warning('请先选择一个节点');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除节点 "${selectedNode.data.label}" 吗？`,
      onOk: () => {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) =>
          eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id),
        );
        setSelectedNode(null);
        message.success('节点已删除');
      },
    });
  };

  // 保存节点
  const handleSaveNode = (values: NodeFormData) => {
    if (isEdit && selectedNode) {
      // 编辑现有节点
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: values.label,
                  type: values.type,
                  description: values.description,
                },
              }
            : n,
        ),
      );
      message.success('节点已更新');
    } else {
      // 新增节点
      const newNode: Node = {
        id: `${Date.now()}`,
        type: 'custom',
        position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
        data: {
          label: values.label,
          type: values.type,
          description: values.description,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      message.success('节点已添加');
    }
    setIsModalOpen(false);
    form.resetFields();
  };

  // 保存流程图到后端
  const handleSaveFlow = async (values: SaveFormData) => {
    try {
      const flowData: FlowData = {
        id: currentFlowId || undefined,
        name: values.name,
        description: values.description,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type || 'custom',
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          animated: e.animated,
        })),
      };

      let res;
      if (currentFlowId) {
        res = await updateFlow(flowData);
      } else {
        res = await saveFlow(flowData);
      }

      if (res.code === 200) {
        message.success(currentFlowId ? '流程图已更新' : '流程图已保存');
        if (!currentFlowId && res.data?.id) {
          setCurrentFlowId(res.data.id);
        }
        setIsSaveModalOpen(false);
        saveForm.resetFields();
      } else {
        message.error(res.msg || '保存失败');
      }
    } catch (error) {
      message.error('保存失败，请检查网络连接');
    }
  };

  // 加载流程图列表
  const handleLoadFlowList = async () => {
    try {
      const res: any = await getFlowList({ pageNum: 1, pageSize: 100 });
      // RuoYi 列表返回格式：{ code, msg, rows, total }
      if (res.code === 200) {
        setFlowList(res.rows || []);
        setIsLoadModalOpen(true);
      }
    } catch (error) {
      message.error('加载列表失败');
    }
  };

  // 加载单个流程图
  const handleLoadFlow = async (id: number) => {
    try {
      const res = await getFlow(id);
      if (res.code === 200 && res.data) {
        const flowData = res.data;
        if (flowData.nodes) {
          setNodes(flowData.nodes);
        }
        if (flowData.edges) {
          setEdges(flowData.edges);
        }
        setCurrentFlowId(id);
        setIsLoadModalOpen(false);
        message.success('流程图已加载');
      }
    } catch (error) {
      message.error('加载失败');
    }
  };

  // 删除流程图
  const handleDeleteFlow = async (id: number) => {
    try {
      const res = await deleteFlow(id);
      if (res.code === 200) {
        message.success('流程图已删除');
        // 刷新列表
        handleLoadFlowList();
        if (currentFlowId === id) {
          setCurrentFlowId(null);
        }
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: 'calc(100vh - 120px)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left">
          <Card size="small" style={{ width: 300 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>节点操作</div>
              <Space wrap>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNode}>
                  新增节点
                </Button>
                <Button icon={<EditOutlined />} onClick={handleEditNode} disabled={!selectedNode}>
                  编辑节点
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={handleDeleteNode} disabled={!selectedNode}>
                  删除节点
                </Button>
              </Space>
              {selectedNode && (
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  已选中: <strong>{selectedNode.data.label}</strong>
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                提示：双击节点可直接编辑，拖拽可移动，选中后按 Delete 可删除
              </div>
              <div style={{ marginTop: 4, fontSize: '12px', color: '#999' }}>
                从节点边缘圆点拖拽可创建连接线
              </div>

              <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>流程图管理</div>
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => {
                      if (currentFlowId) {
                        // 直接更新
                        saveForm.setFieldsValue({ name: '', description: '' });
                      }
                      setIsSaveModalOpen(true);
                    }}
                  >
                    {currentFlowId ? '更新流程图' : '保存流程图'}
                  </Button>
                  <Button icon={<FolderOpenOutlined />} onClick={handleLoadFlowList}>
                    加载流程图
                  </Button>
                </Space>
                {currentFlowId && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#52c41a' }}>
                    当前编辑中 (ID: {currentFlowId})
                  </div>
                )}
              </div>
            </Space>
          </Card>
        </Panel>
      </ReactFlow>

      {/* 节点编辑弹窗 */}
      <Modal
        title={isEdit ? '编辑节点' : '新增节点'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
      >
        <Form form={form} onFinish={handleSaveNode} layout="vertical">
          <Form.Item
            name="label"
            label="节点名称"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="节点类型"
            initialValue="default"
            rules={[{ required: true, message: '请选择节点类型' }]}
          >
            <Select
              options={[
                { value: 'input', label: '开始节点' },
                { value: 'default', label: '普通节点' },
                { value: 'output', label: '结束节点' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入节点描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 保存流程图弹窗 */}
      <Modal
        title="保存流程图"
        open={isSaveModalOpen}
        onOk={() => saveForm.submit()}
        onCancel={() => {
          setIsSaveModalOpen(false);
          saveForm.resetFields();
        }}
      >
        <Form form={saveForm} onFinish={handleSaveFlow} layout="vertical">
          <Form.Item
            name="name"
            label="流程图名称"
            rules={[{ required: true, message: '请输入流程图名称' }]}
          >
            <Input placeholder="请输入流程图名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入流程图描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 加载流程图弹窗 */}
      <Modal
        title="选择流程图"
        open={isLoadModalOpen}
        onCancel={() => setIsLoadModalOpen(false)}
        footer={null}
      >
        <List
          dataSource={flowList}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="primary" size="small" onClick={() => handleLoadFlow(item.id)}>
                  加载
                </Button>,
                <Popconfirm
                  title="确认删除"
                  description="确定要删除这个流程图吗？"
                  onConfirm={() => handleDeleteFlow(item.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button danger size="small">
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={item.description || '暂无描述'}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

const ReactFlowDemo: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ReactFlowDemoInner />
    </ReactFlowProvider>
  );
};

export default ReactFlowDemo;
