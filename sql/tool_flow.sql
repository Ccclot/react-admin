-- ----------------------------
-- 流程图表
-- ----------------------------
DROP TABLE IF EXISTS `tool_flow`;
CREATE TABLE `tool_flow` (
  `id`          bigint(20)    NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name`        varchar(100)  NOT NULL                COMMENT '流程图名称',
  `description` varchar(500)  DEFAULT NULL            COMMENT '流程图描述',
  `nodes`       longtext      DEFAULT NULL            COMMENT '节点JSON数据',
  `edges`       longtext      DEFAULT NULL            COMMENT '连线JSON数据',
  `create_by`   varchar(64)   DEFAULT ''              COMMENT '创建者',
  `create_time` datetime      DEFAULT NULL            COMMENT '创建时间',
  `update_by`   varchar(64)   DEFAULT ''              COMMENT '更新者',
  `update_time` datetime      DEFAULT NULL            COMMENT '更新时间',
  `remark`      varchar(500)  DEFAULT NULL            COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='流程图';

-- ----------------------------
-- 菜单SQL（可选，根据实际菜单结构调整 parent_id）
-- ----------------------------
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('流程图设计', 3, 5, 'reactflow', 'tool/ReactFlow/index', 1, 0, 'C', '0', '0', 'tool:flow:list', 'tree', 'admin', sysdate(), '流程图设计菜单');

-- ----------------------------
-- 按钮权限SQL
-- ----------------------------
SET @parentId = (SELECT menu_id FROM sys_menu WHERE menu_name = '流程图设计' LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('流程图查询', @parentId, 1, '#', '', 1, 0, 'F', '0', '0', 'tool:flow:query', '#', 'admin', sysdate(), '');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('流程图新增', @parentId, 2, '#', '', 1, 0, 'F', '0', '0', 'tool:flow:add', '#', 'admin', sysdate(), '');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('流程图修改', @parentId, 3, '#', '', 1, 0, 'F', '0', '0', 'tool:flow:edit', '#', 'admin', sysdate(), '');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('流程图删除', @parentId, 4, '#', '', 1, 0, 'F', '0', '0', 'tool:flow:remove', '#', 'admin', sysdate(), '');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('流程图导出', @parentId, 5, '#', '', 1, 0, 'F', '0', '0', 'tool:flow:export', '#', 'admin', sysdate(), '');
