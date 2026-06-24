import React, { useState, useRef, useEffect } from 'react';
import { useIntl, useAccess } from '@umijs/max';
import { Card, FormInstance, Modal, Button, message, Space, Popover, Input, Select, Switch, Dropdown } from 'antd';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons';
import { getEnterpriseList, removeEnterprise, updateEnterpriseStatus } from '@/services/kuaishu/enterprise';
import { getDictValueEnum } from '@/services/system/dict';
import UpdateForm from './edit';

const { confirm } = Modal;

/**
 * 删除企业
 */
const handleRemove = async (selectedRows: API.Kuaishu.Enterprise[]) => {
  const hide = message.loading('正在删除');
  if (!selectedRows) return true;
  try {
    await removeEnterprise(selectedRows.map((row) => row.id).join(','));
    hide();
    message.success('删除成功，即将刷新');
    return true;
  } catch (error) {
    hide();
    message.error('删除失败，请重试');
    return false;
  }
};

const handleRemoveOne = async (selectedRow: API.Kuaishu.Enterprise) => {
  const hide = message.loading('正在删除');
  if (!selectedRow) return true;
  try {
    await removeEnterprise(String(selectedRow.id));
    hide();
    message.success('删除成功，即将刷新');
    return true;
  } catch (error) {
    hide();
    message.error('删除失败，请重试');
    return false;
  }
};

const EnterpriseTableList: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const formTableRef = useRef<FormInstance>();

  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.Kuaishu.Enterprise>();
  const [selectedRows, setSelectedRows] = useState<API.Kuaishu.Enterprise[]>([]);

  const [enterpriseTypeOptions, setEnterpriseTypeOptions] = useState<any>([]);
  const [enterpriseCategoryOptions, setEnterpriseCategoryOptions] = useState<any>([]);
  const [enterpriseScaleOptions, setEnterpriseScaleOptions] = useState<any>([]);
  const [enterpriseStateOptions, setEnterpriseStateOptions] = useState<any>([]);
  const [enterpriseAgentTypeOptions, setEnterpriseAgentTypeOptions] = useState<any>([]);
  const [personTaxTypeOptions, setPersonTaxTypeOptions] = useState<any>([]);

  const [searchParams, setSearchParams] = useState({
    name: undefined,
    taxId: undefined,
    loginTaxId: undefined,
    type: undefined,
    category: undefined,
    scale: undefined,
    state: undefined,
    agentType: undefined,
    loginType: undefined,
  });

  const access = useAccess();

  const intl = useIntl();

  useEffect(() => {
    getDictValueEnum('enterprise_type').then((data) => {
      setEnterpriseTypeOptions(data);
    });
    getDictValueEnum('enterprise_category').then((data) => {
      setEnterpriseCategoryOptions(data);
    });
    getDictValueEnum('enterprise_scale').then((data) => {
      setEnterpriseScaleOptions(data);
    });
    getDictValueEnum('enterprise_state').then((data) => {
      setEnterpriseStateOptions(data);
    });
    getDictValueEnum('enterprise_agent_type').then((data) => {
      setEnterpriseAgentTypeOptions(data);
    });
    getDictValueEnum('person_tax_type').then((data) => {
      setPersonTaxTypeOptions(data);
    });
  }, []);

  const showChangeStatusConfirm = (record: API.Kuaishu.Enterprise) => {
    const text = record.state === '1' ? '启用' : '停用';
    const newStatus = record.state === '0' ? '1' : '0';
    confirm({
      title: `确认要${text}${record.name}企业吗？`,
      onOk() {
        updateEnterpriseStatus({ id: record.id, state: newStatus }).then((resp) => {
          if (resp.code === 200) {
            messageApi.open({
              type: 'success',
              content: '更新成功！',
            });
            actionRef.current?.reload();
          } else {
            messageApi.open({
              type: 'error',
              content: resp.msg || '更新失败！',
            });
          }
        });
      },
    });
  };

  // 查询表单内容
  const queryFormContent = (
    <div style={{ width: 320 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>企业名称</label>
        <Input
          placeholder="请输入企业名称"
          value={searchParams.name}
          onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value || undefined })}
          allowClear
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>企业税号</label>
        <Input
          placeholder="请输入企业税号"
          value={searchParams.taxId}
          onChange={(e) => setSearchParams({ ...searchParams, taxId: e.target.value || undefined })}
          allowClear
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>登录税号</label>
        <Input
          placeholder="请输入登录税号"
          value={searchParams.loginTaxId}
          onChange={(e) => setSearchParams({ ...searchParams, loginTaxId: e.target.value || undefined })}
          allowClear
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>企业性质</label>
        <Select
          placeholder="请选择企业性质"
          value={searchParams.type}
          onChange={(value) => setSearchParams({ ...searchParams, type: value })}
          options={Object.entries(enterpriseTypeOptions).map(([value, label]) => ({ value, label }))}
          allowClear
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>企业类别</label>
        <Select
          placeholder="请选择企业类别"
          value={searchParams.category}
          onChange={(value) => setSearchParams({ ...searchParams, category: value })}
          options={Object.entries(enterpriseCategoryOptions).map(([value, label]) => ({ value, label }))}
          allowClear
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>企业规模</label>
        <Select
          placeholder="请选择企业规模"
          value={searchParams.scale}
          onChange={(value) => setSearchParams({ ...searchParams, scale: value })}
          options={Object.entries(enterpriseScaleOptions).map(([value, label]) => ({ value, label }))}
          allowClear
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>代理状态</label>
        <Select
          placeholder="请选择代理状态"
          value={searchParams.state}
          onChange={(value) => setSearchParams({ ...searchParams, state: value })}
          options={Object.entries(enterpriseStateOptions).map(([value, label]) => ({ value, label }))}
          allowClear
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>申报状态</label>
        <Select
          placeholder="请选择申报状态"
          value={searchParams.agentType}
          onChange={(value) => setSearchParams({ ...searchParams, agentType: value })}
          options={Object.entries(enterpriseAgentTypeOptions).map(([value, label]) => ({ value: Number(value), label }))}
          allowClear
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>登录方式</label>
        <Select
          placeholder="请选择登录方式"
          value={searchParams.loginType}
          onChange={(value) => setSearchParams({ ...searchParams, loginType: value })}
          options={[
            { value: 1, label: '企业业务' },
            { value: 0, label: '代理业务' },
          ]}
          allowClear
          style={{ width: '100%' }}
        />
      </div>
      <Space>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={() => {
            actionRef.current?.reload();
          }}
        >
          确定
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setSearchParams({
              name: undefined,
              taxId: undefined,
              loginTaxId: undefined,
              type: undefined,
              category: undefined,
              scale: undefined,
              state: undefined,
              agentType: undefined,
              loginType: undefined,
            });
            actionRef.current?.reload();
          }}
        >
          重置
        </Button>
      </Space>
    </div>
  );

  const columns: ProColumns<API.Kuaishu.Enterprise>[] = [
    {
      title: '企业名称',
      dataIndex: 'name',
      valueType: 'text',
      minWidth: 240,
      ellipsis: true,
    },
    {
      title: '企业税号',
      dataIndex: 'taxId',
      valueType: 'text',
      width: 180,
      ellipsis: true,
    },
    {
      title: '登录方式',
      dataIndex: 'loginType',
      valueType: 'select',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        return record.taxId !== record.loginTaxId ? '代理业务' : '企业业务';
      },
    },
    {
      title: '企业类别',
      dataIndex: 'category',
      valueType: 'select',
      width: 100,
      hideInSearch: true,
      valueEnum: enterpriseCategoryOptions,
    },
    {
      title: '企业规模',
      dataIndex: 'scale',
      valueType: 'select',
      width: 100,
      hideInSearch: true,
      valueEnum: enterpriseScaleOptions,
    },
    {
      title: '个税申报',
      dataIndex: 'personTaxType',
      valueType: 'select',
      width: 100,
      hideInSearch: true,
      valueEnum: personTaxTypeOptions,
    },
    {
      title: '代理状态',
      dataIndex: 'state',
      valueType: 'select',
      width: 100,
      hideInSearch: true,
      valueEnum: enterpriseStateOptions,
      render: (_, record) => {
        return (
          <Switch
            checked={record.state === '0'}
            checkedChildren="正常"
            unCheckedChildren="停用"
            onClick={() => showChangeStatusConfirm(record)}
          />
        );
      },
    },
    {
      title: '操作',
      dataIndex: 'option',
      width: 180,
      valueType: 'option',
      fixed: 'right',
      render: (_, record) => [
        <Button
          type="link"
          size="small"
          key="edit"
          icon={<EditOutlined />}
          hidden={!access.hasPerms('enterprise:enterprise:edit')}
          onClick={() => {
            setModalVisible(true);
            setCurrentRow(record);
          }}
        >
          修改
        </Button>,
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          key="remove"
          hidden={!access.hasPerms('enterprise:enterprise:remove')}
          onClick={() => {
            Modal.confirm({
              title: '删除',
              content: '确定删除该项吗？',
              okText: '确认',
              cancelText: '取消',
              onOk: async () => {
                const success = await handleRemoveOne(record);
                if (success) {
                  actionRef.current?.reload();
                }
              },
            });
          }}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <Card>
        <ProTable<API.Kuaishu.Enterprise>
          headerTitle="企业信息"
          actionRef={actionRef}
          formRef={formTableRef}
          rowKey="id"
          key="enterpriseList"
          search={false}
          toolBarRender={() => [
            <Popover
              key="query"
              content={queryFormContent}
              title="查询条件"
              trigger="click"
              placement="bottomLeft"
            >
              <Button type="primary" icon={<SearchOutlined />}>
                查询
              </Button>
            </Popover>,
            <Button
              type="primary"
              key="add"
              icon={<PlusOutlined />}
              hidden={!access.hasPerms('enterprise:enterprise:add')}
              onClick={() => {
                setCurrentRow(undefined);
                setModalVisible(true);
              }}
            >
              新增
            </Button>,
            <Button
              type="primary"
              key="edit"
              icon={<EditOutlined />}
              disabled={selectedRows.length !== 1}
              hidden={!access.hasPerms('enterprise:enterprise:edit')}
              onClick={() => {
                setCurrentRow(selectedRows[0]);
                setModalVisible(true);
              }}
            >
              修改
            </Button>,
          ]}
          request={(params) =>
            getEnterpriseList({ ...params, ...searchParams } as API.Kuaishu.EnterpriseListParams).then((res) => {
              const result = {
                data: res.rows,
                total: res.total,
                success: true,
              };
              return result;
            })
          }
          columns={columns}
          rowSelection={{
            onChange: (_, selectedRows) => {
              setSelectedRows(selectedRows);
            },
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
      <UpdateForm
        onSubmit={async (values) => {
          let success = false;
          if (currentRow?.id) {
            success = await updateEnterprise({ ...values, id: currentRow.id } as API.Kuaishu.Enterprise).then((res) => {
              if (res.code === 200) {
                message.success('修改成功');
                return true;
              }
              message.error(res.msg || '修改失败');
              return false;
            });
          } else {
            success = await addEnterprise({ ...values } as API.Kuaishu.Enterprise).then((res) => {
              if (res.code === 200) {
                message.success('新增成功');
                return true;
              }
              message.error(res.msg || '新增失败');
              return false;
            });
          }
          if (success) {
            setModalVisible(false);
            setCurrentRow(undefined);
            actionRef.current?.reload();
          }
        }}
        onCancel={() => {
          setModalVisible(false);
          setCurrentRow(undefined);
        }}
        open={modalVisible}
        values={currentRow || {}}
        enterpriseTypeOptions={enterpriseTypeOptions}
        enterpriseCategoryOptions={enterpriseCategoryOptions}
        enterpriseScaleOptions={enterpriseScaleOptions}
        enterpriseStateOptions={enterpriseStateOptions}
        enterpriseAgentTypeOptions={enterpriseAgentTypeOptions}
        personTaxTypeOptions={personTaxTypeOptions}
      />
    </PageContainer>
  );
};

export default EnterpriseTableList;
