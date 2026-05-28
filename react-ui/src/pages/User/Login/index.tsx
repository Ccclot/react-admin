import Footer from '@/components/Footer';
import { getCaptchaImg, login } from '@/services/system/auth';
import { getRoutersInfo, setRemoteMenu } from '@/services/session';
import {
  LockOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { FormattedMessage, history, useIntl, useModel, Helmet } from '@umijs/max';
import { Alert, message, Row, Col, Image } from 'antd';
import Settings from '../../../../config/defaultSettings';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { clearSessionToken, setSessionToken } from '@/access';

// 样式对象
const containerStyle: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
};

const leftContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '65%',
  height: '100%',
  background: 'linear-gradient(154deg, rgba(191, 210, 236, 0) 0%, rgba(191, 210, 236, 0.7) 25%, #bfd2ec 50%, rgba(191, 210, 236, 0.7) 75%, rgba(191, 210, 236, 0) 100%)',
  borderRight: '1px solid #eee',
};

const rightContainerStyle: React.CSSProperties = {
  minWidth: '400px',
  width: '35%',
  height: '100%',
  padding: '0 2%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  flexDirection: 'column',
  backgroundColor: '#fff',
};

const footerStyle: React.CSSProperties = {
  position: 'absolute',
  height: '40px',
  lineHeight: '40px',
  bottom: '0',
  width: '100%',
  textAlign: 'center',
  color: 'gray',
  fontFamily: 'Arial',
  fontSize: '12px',
  letterSpacing: '1px',
};

// CSS keyframes 动画
const jumpAnimationStyle = `
@keyframes jump {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
`;

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

// Logo动画组件 - SVG动画
const AnimatedLogo: React.FC = () => {
  return (
    <svg
      enableBackground="new 0 0 800 800"
      version="1.1"
      viewBox="0 0 800 800"
      style={{
        width: '50%',
        height: '50%',
        animation: 'jump 3s infinite ease-in-out',
      }}
    >
      <defs>
        <filter id="blur1">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>
      {/* 简化的书本/文档图标 */}
      <g>
        <rect x="200" y="150" width="400" height="500" rx="20" fill="#bfd2ec" filter="url(#blur1)" opacity="0.5" />
        <rect x="220" y="170" width="360" height="460" rx="15" fill="#3759a7" />
        <rect x="250" y="200" width="300" height="400" rx="10" fill="#fff" />
        {/* 书页线条 */}
        <line x1="280" y1="250" x2="520" y2="250" stroke="#e0e0e0" strokeWidth="3" />
        <line x1="280" y1="300" x2="520" y2="300" stroke="#e0e0e0" strokeWidth="3" />
        <line x1="280" y1="350" x2="520" y2="350" stroke="#e0e0e0" strokeWidth="3" />
        <line x1="280" y1="400" x2="520" y2="400" stroke="#e0e0e0" strokeWidth="3" />
        <line x1="280" y1="450" x2="520" y2="450" stroke="#e0e0e0" strokeWidth="3" />
        {/* 快书标记 */}
        <circle cx="400" cy="500" r="40" fill="#3759a7" />
        <text x="400" y="510" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">K</text>
      </g>
    </svg>
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({code: 200});
  const { initialState, setInitialState } = useModel('@@initialState');
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [uuid, setUuid] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const intl = useIntl();

  const getCaptchaCode = async () => {
    const response = await getCaptchaImg();
    const imgdata = `data:image/png;base64,${response.img}`;
    setCaptchaCode(imgdata);
    setUuid(response.uuid);
  };

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const response = await login({ ...values, uuid });
      if (response.code === 200) {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        const current = new Date();
        const expireTime = current.setTime(current.getTime() + 1000 * 12 * 60 * 60);
        setSessionToken(response?.token, response?.token, expireTime);
        message.success(defaultLoginSuccessMessage);
        // 获取菜单路由数据
        const menuData = await getRoutersInfo();
        setRemoteMenu(menuData);
        await fetchUserInfo();
        // 刷新页面以重新注册路由
        const urlParams = new URL(window.location.href).searchParams;
        window.location.href = urlParams.get('redirect') || '/';
        return;
      } else {
        clearSessionToken();
        setUserLoginState({ ...response });
        getCaptchaCode();
      }
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      message.error(defaultLoginFailureMessage);
    }
  };
  const { code } = userLoginState;

  useEffect(() => {
    getCaptchaCode();
  }, []);

  return (
    <div>
      <style>{jumpAnimationStyle}</style>
      <div style={containerStyle}>
        <Helmet>
          <title>
            {intl.formatMessage({
              id: 'menu.login',
              defaultMessage: '登录页',
            })}
            - {Settings.title}
          </title>
        </Helmet>

        {/* 左侧动画区域 */}
        <div style={leftContainerStyle}>
          <AnimatedLogo />
        </div>

        {/* 召侧登录表单区域 */}
        <div style={rightContainerStyle}>
          {/* 内容容器 - 垂直居中 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* 欢迎标题区域 */}
            <div style={{
              width: '100%',
              maxWidth: '75vw',
              minWidth: '280px',
              marginBottom: '20px',
              padding: '0 25px',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                margin: '10px 0',
                textAlign: 'left',
                position: 'relative',
              }}>
                欢迎使用 👋🏻
                <span style={{
                  position: 'absolute',
                  fontSize: '30px',
                  top: '-21px',
                  left: '0px',
                  fontWeight: 800,
                  opacity: 0.1,
                  backgroundImage: 'linear-gradient(180deg, #1d52f3, #68c7fd)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '2px 2px 4px rgba(65, 88, 208, 0.4), 4px 4px 8px rgba(200, 80, 192, 0.3), 6px 6px 12px rgba(255, 204, 112, 0.2)',
                  textTransform: 'uppercase',
                }}>
                  WELCOME
                </span>
              </h2>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 500,
                margin: '0 0 0 45px',
                color: '#666',
              }}>
                Ccclot's智能管理系统
              </h3>
            </div>

            <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            background: '#ffffff',
            padding: '25px 25px 5px 25px',
            minHeight: '400px',
          }}
          title={false}
          subTitle={false}
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          {code !== 200 && (
            <LoginMessage
              content={userLoginState.msg || intl.formatMessage({
                id: 'pages.login.accountLogin.errorMessage',
                defaultMessage: '账户或密码错误',
              })}
            />
          )}

          <ProFormText
            name="username"
            initialValue="admin"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined style={{ color: '#3759a7' }} />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.login.username.placeholder',
              defaultMessage: '请输入账号',
            })}
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.login.username.required"
                    defaultMessage="请输入您的账号"
                  />
                ),
              },
            ]}
          />

          <ProFormText.Password
            name="password"
            initialValue="admin123"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined style={{ color: '#3759a7' }} />,
              suffix: showPassword ? (
                <EyeOutlined
                  onClick={() => setShowPassword(false)}
                  style={{ cursor: 'pointer', color: '#999' }}
                />
              ) : (
                <EyeInvisibleOutlined
                  onClick={() => setShowPassword(true)}
                  style={{ cursor: 'pointer', color: '#999' }}
                />
              ),
              type: showPassword ? 'text' : 'password',
            }}
            placeholder={intl.formatMessage({
              id: 'pages.login.password.placeholder',
              defaultMessage: '请输入密码',
            })}
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.login.password.required"
                    defaultMessage="请输入您的密码"
                  />
                ),
              },
            ]}
          />

          <Row gutter={8}>
            <Col span={16}>
              <ProFormText
                name="code"
                fieldProps={{
                  size: 'large',
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.captcha.placeholder',
                  defaultMessage: '请输入验证码',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.captcha.required"
                        defaultMessage="请输入验证码"
                      />
                    ),
                  },
                ]}
              />
            </Col>
            <Col span={8}>
              <Image
                src={captchaCode}
                alt="验证码"
                style={{
                  display: 'inline-block',
                  verticalAlign: 'top',
                  cursor: 'pointer',
                  height: '40px',
                  marginTop: '4px',
                }}
                preview={false}
                onClick={() => getCaptchaCode()}
              />
            </Col>
          </Row>

            <div style={{ marginBottom: 24 }}>
              <ProFormCheckbox noStyle name="rememberMe">
                记住密码
              </ProFormCheckbox>
            </div>
          </LoginForm>
          </div>

          {/* 底部版权 */}
          <div style={footerStyle}>
            © Ccclot
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
