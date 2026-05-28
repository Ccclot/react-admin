import { useCopilotAction } from "@copilotkit/react-core";
import { message } from "antd";
import {
  getUserList,
  getUser,
  addUser,
  updateUser,
  removeUser,
  changeUserStatus,
} from "@/services/system/user";

/**
 * 用户管理相关的 CopilotKit Actions
 * 让 AI 能够执行用户管理操作
 */
export function useUserActions() {
  // 查询用户列表
  // @ts-ignore
	useCopilotAction({
    name: "getUserList",
    description: "查询用户列表。可以按用户名、手机号、状态等条件筛选。",
    parameters: [
      {
        name: "userName",
        type: "string" as const,
        description: "用户名（可选，模糊查询）",
        required: false,
      },
      {
        name: "phonenumber",
        type: "string" as const,
        description: "手机号码（可选）",
        required: false,
      },
      {
        name: "status",
        type: "string" as const,
        description: "用户状态：0=正常，1=停用（可选）",
        required: false,
      },
      {
        name: "pageNum",
        type: "number" as const,
        description: "页码，默认1",
        required: false,
      },
      {
        name: "pageSize",
        type: "number" as const,
        description: "每页数量，默认10",
        required: false,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await getUserList({
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 10,
          ...params,
        });
        if (result.code === 200) {
          return {
            success: true,
            data: result.rows,
            total: result.total,
            message: `查询成功，共找到 ${result.total} 条记录`,
          };
        }
        return { success: false, message: result.msg };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  });

  // 查询用户详情
  useCopilotAction({
    name: "getUserDetail",
    description: "根据用户ID查询用户详细信息",
    parameters: [
      {
        name: "userId",
        type: "number" as const,
        description: "用户ID",
        required: true,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await getUser(params.userId);
        if (result.code === 200) {
          return {
            success: true,
            data: result.data,
            message: `查询用户成功：${result.data?.userName}`,
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
    description: "新增系统用户。需要提供用户名、昵称、密码等基本信息。",
    parameters: [
      {
        name: "userName",
        type: "string" as const,
        description: "用户登录名（必填，唯一）",
        required: true,
      },
      {
        name: "nickName",
        type: "string" as const,
        description: "用户昵称（必填）",
        required: true,
      },
      {
        name: "password",
        type: "string" as const,
        description: "用户密码（必填）",
        required: true,
      },
      {
        name: "phonenumber",
        type: "string" as const,
        description: "手机号码（可选）",
        required: false,
      },
      {
        name: "email",
        type: "string" as const,
        description: "邮箱地址（可选）",
        required: false,
      },
      {
        name: "sex",
        type: "string" as const,
        description: "性别：0=男，1=女，2=未知（可选）",
        required: false,
      },
      {
        name: "status",
        type: "string" as const,
        description: "状态：0=正常，1=停用（可选，默认0）",
        required: false,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await addUser({
          ...params,
          status: params.status || "0",
        });
        if (result.code === 200) {
          message.success(`用户 ${params.userName} 创建成功`);
          return {
            success: true,
            message: `用户 ${params.userName} 创建成功`,
          };
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
    description: "修改用户信息。需要提供用户ID和要修改的字段。",
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
        description: "用户昵称（可选）",
        required: false,
      },
      {
        name: "phonenumber",
        type: "string" as const,
        description: "手机号码（可选）",
        required: false,
      },
      {
        name: "email",
        type: "string" as const,
        description: "邮箱地址（可选）",
        required: false,
      },
      {
        name: "sex",
        type: "string" as const,
        description: "性别：0=男，1=女，2=未知（可选）",
        required: false,
      },
      {
        name: "status",
        type: "string" as const,
        description: "状态：0=正常，1=停用（可选）",
        required: false,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await updateUser(params);
        if (result.code === 200) {
          message.success("用户信息修改成功");
          return {
            success: true,
            message: "用户信息修改成功",
          };
        }
        message.error(result.msg);
        return { success: false, message: result.msg };
      } catch (error: any) {
        message.error(error.message);
        return { success: false, message: error.message };
      }
    },
  });

  // 删除用户
  useCopilotAction({
    name: "deleteUser",
    description: "删除用户。可以删除单个或多个用户。",
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
        const result = await removeUser(params.userIds);
        if (result.code === 200) {
          message.success("用户删除成功");
          return {
            success: true,
            message: `成功删除用户 ID: ${params.userIds}`,
          };
        }
        message.error(result.msg);
        return { success: false, message: result.msg };
      } catch (error: any) {
        message.error(error.message);
        return { success: false, message: error.message };
      }
    },
  });

  // 修改用户状态
  useCopilotAction({
    name: "changeUserStatus",
    description: "启用或停用用户",
    parameters: [
      {
        name: "userId",
        type: "number" as const,
        description: "用户ID",
        required: true,
      },
      {
        name: "status",
        type: "string" as const,
        description: "状态：0=正常（启用），1=停用",
        required: true,
      },
    ],
    handler: async (params: Record<string, any>) => {
      try {
        const result = await changeUserStatus(params.userId, params.status);
        if (result.code === 200) {
          message.success(`用户状态已${params.status === "0" ? "启用" : "停用"}`);
          return {
            success: true,
            message: `用户状态已${params.status === "0" ? "启用" : "停用"}`,
          };
        }
        message.error(result.msg);
        return { success: false, message: result.msg };
      } catch (error: any) {
        message.error(error.message);
        return { success: false, message: error.message };
      }
    },
  });
}
