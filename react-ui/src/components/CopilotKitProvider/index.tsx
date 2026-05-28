import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import React from "react";

// 引入 CopilotKit 样式
import "@copilotkit/react-ui/styles.css";

// 引入 Actions
import { useUserActions } from "@/hooks/useCopilotActions";

interface CopilotKitWrapperProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

/**
 * CopilotKit 内部组件 - 用于调用 hooks
 */
const CopilotKitInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 注册所有用户管理相关的 Actions
  useUserActions();

  return <>{children}</>;
};

/**
 * CopilotKit 包装组件
 * 提供全局 AI 能力支持
 */
const CopilotKitWrapper: React.FC<CopilotKitWrapperProps> = ({
  children,
  showSidebar = false,
}) => {
  return (
    <CopilotKit runtimeUrl="http://localhost:4000/copilotkit">
      <CopilotKitInner>
        {children}
      </CopilotKitInner>
      {showSidebar && (
        <CopilotSidebar
          instructions="你是管理系统的智能助手。

你的职责：
1. 帮助用户管理系统，可以执行用户的新增、修改、删除、查询等操作
2. 解答关于用户管理、角色管理、菜单管理、字典管理等模块的问题
3. 提供操作建议和最佳实践

你可以执行的操作：
- 查询用户列表 (getUserList)
- 查询用户详情 (getUserDetail)
- 新增用户 (addUser)
- 修改用户信息 (updateUser)
- 删除用户 (deleteUser)
- 启用/停用用户 (changeUserStatus)

当用户要求执行操作时，请先确认用户意图，然后调用相应的函数。
请用中文回答，保持友好和专业的态度。"
          labels={{
            title: "AI 智能助手",
            initial: "您好！我是管理系统的智能助手。我可以帮您管理用户，比如查询用户、新增用户、修改用户信息等。请问有什么可以帮助您的？",
            placeholder: "输入您的问题或指令...",
          }}
          defaultOpen={false}
        />
      )}
    </CopilotKit>
  );
};

export default CopilotKitWrapper;
