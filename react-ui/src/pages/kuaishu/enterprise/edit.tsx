import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Tabs, message } from 'antd';
import { getProvinceList, getIndustryDictList } from '@/services/kuaishu/enterprise';

interface UpdateFormProps {
  open: boolean;
  values: API.Kuaishu.Enterprise;
  onSubmit: (values: API.Kuaishu.Enterprise) => void;
  onCancel: () => void;
  enterpriseTypeOptions: any;
  enterpriseCategoryOptions: any;
  enterpriseScaleOptions: any;
  enterpriseStateOptions: any;
  enterpriseAgentTypeOptions: any;
  personTaxTypeOptions: any;
}

const { Option } = Select;
const { TabPane } = Tabs;

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [provinceList, setProvinceList] = useState<any[]>([]);
  const [industryTypeList, setIndustryTypeList] = useState<any[]>([]);

  const {
    open,
    values,
    onSubmit,
    onCancel,
    enterpriseTypeOptions,
    enterpriseCategoryOptions,
    enterpriseScaleOptions,
    enterpriseStateOptions,
    enterpriseAgentTypeOptions,
    personTaxTypeOptions,
  } = props;

  useEffect(() => {
    if (open) {
      // 获取省份列表
      getProvinceList().then((res) => {
        if (res.code === 200) {
          setProvinceList(res.data || []);
        }
      });

      // 获取行业类型列表
      getIndustryDictList().then((res) => {
        if (res.code === 200) {
          setIndustryTypeList(res.data || []);
        }
      });

      // 设置表单值
      if (values && values.id) {
        form.setFieldsValue({
          ...values,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, values, form]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fieldsValue = await form.validateFields();
      onSubmit(fieldsValue);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const isEdit = values?.id !== undefined;

  return (
    <Modal
      title={isEdit ? '修改企业' : '新增企业'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Tabs defaultActiveKey="basic">
        <TabPane tab="基本信息" key="basic">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              type: '0',
              category: '0',
              scale: '0',
              state: '0',
              accountantSystem: 0,
              personTaxType: '0',
              agentType: 0,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="企业名称"
                  rules={[{ required: true, message: '请输入企业名称' }]}
                >
                  <Input placeholder="请输入企业名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="taxId"
                  label="企业税号"
                  rules={[{ required: true, message: '请输入企业税号' }]}
                >
                  <Input placeholder="请输入企业税号" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="type" label="企业性质">
                  <Select placeholder="请选择企业性质">
                    {Object.entries(enterpriseTypeOptions).map(([value, label]) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="企业类别">
                  <Select placeholder="请选择企业类别">
                    {Object.entries(enterpriseCategoryOptions).map(([value, label]) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="scale" label="企业规模">
                  <Select placeholder="请选择企业规模">
                    {Object.entries(enterpriseScaleOptions).map(([value, label]) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="industryTypeDl" label="行业类型">
                  <Select placeholder="请选择行业类型">
                    {industryTypeList.map((item) => (
                      <Option key={item.industryCode} value={item.industryCode}>
                        {item.industryName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="state" label="代理状态">
                  <Select placeholder="请选择企业代理状态">
                    {Object.entries(enterpriseStateOptions).map(([value, label]) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="accountantSystem" label="会计制度">
                  <Select placeholder="请选择企业会计制度">
                    <Option value={0}>小企业会计准则</Option>
                    <Option value={3}>企业会计准则</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="loginTaxId" label="登录税号">
                  <Input placeholder="请输入登录税号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operateId" label="税局账号">
                  <Input placeholder="请输入电子税务局登录登录账号" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="password" label="登录密码">
                  <Input.Password placeholder="请输入登录密码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="personTaxAccount" label="个税账号">
                  <Input placeholder="请输入个税账号（不填默认为申报密码方式）" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="personTaxPassword" label="个税密码">
                  <Input.Password placeholder="请输入个税密码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="personTaxType" label="个税申报">
                  <Select placeholder="请选择个税申报类别">
                    {Object.entries(personTaxTypeOptions).map(([value, label]) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="province" label="所属省份">
                  <Select placeholder="请选择所属省份" showSearch filterable allowClear>
                    {provinceList.map((item) => (
                      <Option key={item.name} value={item.name}>
                        {item.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="legalPerson" label="企业法人">
                  <Input placeholder="请输入企业法人" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="createAccount" label="建账时间">
                  <DatePicker picker="month" style={{ width: '100%' }} format="YYYY年MM月" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="startAccount" label="开始期间">
                  <DatePicker picker="month" style={{ width: '100%' }} format="YYYY年MM月" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="address" label="企业地址">
                  <Input placeholder="请输入企业地址" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="phone" label="联系电话">
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="bankName" label="开户银行">
                  <Input placeholder="请输入开户银行" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bankAccount" label="银行帐号">
                  <Input placeholder="请输入银行帐号" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="defaultRecorder" label="记账员">
                  <Input placeholder="请输入默认记账员" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="defaultAuditor" label="审核员">
                  <Input placeholder="请输入默认审核员" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="agentType" label="申报状态">
                  <Select placeholder="请选择申报状态">
                    {Object.entries(enterpriseAgentTypeOptions).map(([value, label]) => (
                      <Option key={value} value={Number(value)}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="profitRatio" label="利润系数">
                  <Input placeholder="请输入利润系数" type="number" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default UpdateForm;
