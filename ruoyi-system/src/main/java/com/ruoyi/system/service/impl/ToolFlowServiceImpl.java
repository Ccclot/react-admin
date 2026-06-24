package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.ToolFlowMapper;
import com.ruoyi.system.domain.ToolFlow;
import com.ruoyi.system.service.IToolFlowService;

/**
 * 流程图Service业务层处理
 *
 * @author ruoyi
 */
@Service
public class ToolFlowServiceImpl implements IToolFlowService
{
    @Autowired
    private ToolFlowMapper toolFlowMapper;

    /**
     * 查询流程图
     */
    @Override
    public ToolFlow selectToolFlowById(Long id)
    {
        return toolFlowMapper.selectToolFlowById(id);
    }

    /**
     * 查询流程图列表
     */
    @Override
    public List<ToolFlow> selectToolFlowList(ToolFlow toolFlow)
    {
        return toolFlowMapper.selectToolFlowList(toolFlow);
    }

    /**
     * 新增流程图
     */
    @Override
    public int insertToolFlow(ToolFlow toolFlow)
    {
        return toolFlowMapper.insertToolFlow(toolFlow);
    }

    /**
     * 修改流程图
     */
    @Override
    public int updateToolFlow(ToolFlow toolFlow)
    {
        return toolFlowMapper.updateToolFlow(toolFlow);
    }

    /**
     * 批量删除流程图
     */
    @Override
    public int deleteToolFlowByIds(Long[] ids)
    {
        return toolFlowMapper.deleteToolFlowByIds(ids);
    }

    /**
     * 删除流程图信息
     */
    @Override
    public int deleteToolFlowById(Long id)
    {
        return toolFlowMapper.deleteToolFlowById(id);
    }
}
