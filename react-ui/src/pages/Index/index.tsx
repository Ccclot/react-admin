import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, Typography, Space, theme, Tag, Divider, Input } from 'antd';
import { useCopilotReadable,useCopilotAction } from '@copilotkit/react-core';
import { RobotOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import './index.less';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const Index: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [aiInput, setAiInput] = useState('');

  // 让 AI 了解当前页面上下文
  useCopilotReadable({
    description: "首页用户信息",
    value: JSON.stringify({
      userName: currentUser?.userName,
      nickName: currentUser?.nickName,
      roles: currentUser?.roles,
      permissions: currentUser?.permissions,
    }),
  });

  return (
    <PageContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 欢迎卡片 */}
        <Card
          style={{
            borderRadius: 8,
            minHeight: 200,
          }}
        >
          <Space direction="vertical" size="middle">
            <div>
              <Title
                level={2}
                style={{
                  color: token.colorTextHeading,
                  marginBottom: 16,
                }}
              >
								{currentUser?.nickName ? `您好，${currentUser.nickName}！` : '您好！'}

							</Title>
              <Paragraph
                style={{
                  fontSize: 14,
                  color: token.colorTextSecondary,
                }}
              >
                当前时间：{new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </Paragraph>
            </div>
          </Space>
        </Card>

      </Space>
    </PageContainer>
  );
};

export default Index;
