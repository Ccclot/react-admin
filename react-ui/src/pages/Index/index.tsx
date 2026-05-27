import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, Typography, Space, theme } from 'antd';
import React from 'react';

const { Title, Paragraph } = Typography;

const Index: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        bodyStyle={{
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Space direction="vertical" size="large">
          <div>
            <Title
              level={2}
              style={{
                color: token.colorTextHeading,
                marginBottom: 16,
              }}
            >
              欢迎使用若依管理系统
            </Title>
            <Paragraph
              style={{
                fontSize: 16,
                color: token.colorTextSecondary,
                marginBottom: 8,
              }}
            >
              {currentUser?.userName ? `您好，${currentUser.userName}！` : '您好！'}
            </Paragraph>
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
    </PageContainer>
  );
};

export default Index;
