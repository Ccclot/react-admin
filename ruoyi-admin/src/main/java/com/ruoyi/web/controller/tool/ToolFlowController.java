package com.ruoyi.web.controller.tool;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.ToolFlow;
import com.ruoyi.system.service.IToolFlowService;

/**
 * 流程图Controller
 *
 * @author ruoyi
 */
@RestController
@RequestMapping("/tool/flow")
public class ToolFlowController extends BaseController
{
    @Autowired
    private IToolFlowService toolFlowService;

    /**
     * 查询流程图列表
     */
    @PreAuthorize("@ss.hasPermi('tool:flow:list')")
    @GetMapping("/list")
    public TableDataInfo list(ToolFlow toolFlow)
    {
        startPage();
        List<ToolFlow> list = toolFlowService.selectToolFlowList(toolFlow);
        return getDataTable(list);
    }


    /**
     * 获取流程图详细信息
     */
    @PreAuthorize("@ss.hasPermi('tool:flow:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(toolFlowService.selectToolFlowById(id));
    }

    /**
     * 新增流程图
     */
    @PreAuthorize("@ss.hasPermi('tool:flow:add')")
    @Log(title = "流程图", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ToolFlow toolFlow)
    {
        toolFlow.setCreateBy(getUsername());
        int rows = toolFlowService.insertToolFlow(toolFlow);
        if (rows > 0) {
            AjaxResult result = AjaxResult.success();
            result.put("data", toolFlow);
            return result;
        }
        return AjaxResult.error();
    }

    /**
     * 修改流程图
     */
    @PreAuthorize("@ss.hasPermi('tool:flow:edit')")
    @Log(title = "流程图", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ToolFlow toolFlow)
    {
        toolFlow.setUpdateBy(getUsername());
        return toAjax(toolFlowService.updateToolFlow(toolFlow));
    }

    /**
     * 删除流程图
     */
    @PreAuthorize("@ss.hasPermi('tool:flow:remove')")
    @Log(title = "流程图", businessType = BusinessType.DELETE)
    @DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(toolFlowService.deleteToolFlowByIds(ids));
    }
}
