package com.ruoyi.system.domain;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

/**
 * 流程图对象 tool_flow
 *
 * @author ruoyi
 */
public class ToolFlow extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 主键ID */
    private Long id;

    /** 流程图名称 */
    @Excel(name = "流程图名称")
    private String name;

    /** 流程图描述 */
    @Excel(name = "流程图描述")
    private String description;

    /** 节点JSON数据 */
    private String nodes;

    /** 连线JSON数据 */
    private String edges;

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getDescription()
    {
        return description;
    }

    public void setDescription(String description)
    {
        this.description = description;
    }

    public String getNodes()
    {
        return nodes;
    }

    public void setNodes(String nodes)
    {
        this.nodes = nodes;
    }

    public String getEdges()
    {
        return edges;
    }

    public void setEdges(String edges)
    {
        this.edges = edges;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("name", getName())
            .append("description", getDescription())
            .append("nodes", getNodes())
            .append("edges", getEdges())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .append("remark", getRemark())
            .toString();
    }
}
