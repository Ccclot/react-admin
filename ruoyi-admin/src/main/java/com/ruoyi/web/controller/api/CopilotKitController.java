package com.ruoyi.web.controller.api;

import java.util.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;

/**
 * CopilotKit API 控制器
 * 实现 CopilotKit 后端响应协议
 *
 * @author ruoyi
 */
@RestController
@RequestMapping("/api/copilotkit")
public class CopilotKitController
{
    @Value("${copilotkit.anthropic.token:}")
    private String anthropicToken;

    @Value("${copilotkit.anthropic.baseUrl:https://maas-coding-api.cn-huabei-1.xf-yun.com/anthropic}")
    private String anthropicBaseUrl;

    @Value("${copilotkit.anthropic.model:astron-code-latest}")
    private String anthropicModel;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * CopilotKit 信息接口
     */
    @GetMapping("/info")
    public Map<String, Object> getInfo()
    {
        Map<String, Object> response = new HashMap<>();
        response.put("runtimeUrl", "/api/copilotkit");
        return response;
    }

    /**
     * CopilotKit 聊天接口
     * 处理 POST /api/copilotkit 请求
     */
    @PostMapping
    public Map<String, Object> handleCopilotRequest(@RequestBody Map<String, Object> request)
    {
        try
        {
            String operation = (String) request.get("operation");

            // CopilotKit 可能发送不同类型的操作
            if ("generateChatResponse".equals(operation))
            {
                return generateChatResponse(request);
            }

            // 默认处理为聊天请求
            return generateChatResponse(request);
        }
        catch (Exception e)
        {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return errorResponse;
        }
    }

    /**
     * 生成聊天响应
     */
    private Map<String, Object> generateChatResponse(Map<String, Object> request)
    {
        try
        {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", anthropicToken);
            headers.set("anthropic-version", "2023-06-01");

            JSONObject requestBody = new JSONObject();
            requestBody.put("model", anthropicModel);
            requestBody.put("max_tokens", 4096);

            // 提取消息
            List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
            if (messages == null)
            {
                messages = (List<Map<String, Object>>) request.get("frontend");
            }

            if (messages != null && !messages.isEmpty())
            {
                JSONArray anthropicMessages = new JSONArray();
                for (Map<String, Object> msg : messages)
                {
                    JSONObject anthropicMsg = new JSONObject();
                    anthropicMsg.put("role", msg.get("role"));

                    // 处理 content，可能是字符串或数组
                    Object content = msg.get("content");
                    if (content instanceof String)
                    {
                        anthropicMsg.put("content", content);
                    }
                    else if (content instanceof List)
                    {
                        anthropicMsg.put("content", content);
                    }

                    anthropicMessages.add(anthropicMsg);
                }
                requestBody.put("messages", anthropicMessages);
            }

            // 系统提示
            String systemPrompt = (String) request.get("system");
            if (systemPrompt == null || systemPrompt.isEmpty())
            {
                systemPrompt = "你是若依管理系统的智能助手。帮助用户了解系统功能、解答使用问题、提供操作建议。系统包含用户管理、角色管理、菜单管理、字典管理、定时任务、代码生成等功能模块。请用中文回答问题。";
            }
            requestBody.put("system", systemPrompt);

            HttpEntity<JSONObject> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JSONObject> response = restTemplate.exchange(
                anthropicBaseUrl + "/v1/messages",
                HttpMethod.POST,
                entity,
                JSONObject.class
            );

            return convertToCopilotKitResponse(response.getBody());
        }
        catch (Exception e)
        {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return errorResponse;
        }
    }

    /**
     * 将 Anthropic 响应转换为 CopilotKit 格式
     */
    private Map<String, Object> convertToCopilotKitResponse(JSONObject anthropicResponse)
    {
        Map<String, Object> response = new HashMap<>();

        if (anthropicResponse != null)
        {
            // 提取文本内容
            JSONArray content = anthropicResponse.getJSONArray("content");
            if (content != null && !content.isEmpty())
            {
                StringBuilder textBuilder = new StringBuilder();
                for (int i = 0; i < content.size(); i++)
                {
                    JSONObject item = content.getJSONObject(i);
                    if ("text".equals(item.getString("type")))
                    {
                        textBuilder.append(item.getString("text"));
                    }
                }

                // CopilotKit 响应格式
                Map<String, Object> message = new HashMap<>();
                message.put("role", "assistant");
                message.put("content", textBuilder.toString());

                response.put("message", message);
                response.put("content", textBuilder.toString());
            }

            // 传递其他信息
            if (anthropicResponse.containsKey("id"))
            {
                response.put("id", anthropicResponse.getString("id"));
            }
            if (anthropicResponse.containsKey("model"))
            {
                response.put("model", anthropicResponse.getString("model"));
            }
            if (anthropicResponse.containsKey("usage"))
            {
                response.put("usage", anthropicResponse.get("usage"));
            }
        }

        return response;
    }
}