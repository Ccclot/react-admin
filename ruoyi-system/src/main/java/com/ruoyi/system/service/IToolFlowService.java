package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.ToolFlow;

/**
 * 流程图Service接口
 *
 * @author ruoyi
 */
public interface IToolFlowService
{
    /**
     * 查询流程图
     *
     * @param id 流程图主键
     * @return 流程图
     */
    public ToolFlow selectToolFlowById(Long id);

    /**
     * 查询流程图列表
     *
     * @param toolFlow 流程图
     * @return 流程图集合
     */
    public List<ToolFlow> selectToolFlowList(ToolFlow toolFlow);

    /**
     * 新增流程图
     *
     * @param toolFlow 流程图
     * @return 结果
     */
    public int insertToolFlow(ToolFlow toolFlow);

    /**
     * 修改流程图
     *
     * @param toolFlow 流程图
     * @return 结果
     */
    public int updateToolFlow(ToolFlow toolFlow);

    /**
     * 批量删除流程图
     *
     * @param ids 需要删除的主键集合
     * @return 结果
     */
    public int deleteToolFlowByIds(Long[] ids);

    /**
     * 删除流程图信息
     *
     * @param id 流程图主键
     * @return 结果
     */
    public int deleteToolFlowById(Long id);
}
