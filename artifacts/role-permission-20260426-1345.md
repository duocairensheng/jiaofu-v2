# 客户管理 — 角色权限系统

## 改动摘要

### index.html（11,192 bytes）
- 客户表格头：`角色`+`渠道/区域` → `区域`+`分配经理`（7列不变）
- 移除 `customerFilterRole` 下拉筛选器

### app.js（74,431 bytes）
1. **登录系统** — 用户带角色：`initUsers()` 默认3用户（admin/区总, pm001+pm002/推广经理），登录写 `currentUser`
2. **侧边栏UI** — `updateSidebarUserInfo()` 显示用户名+角色标签+退出按钮；`applyRoleBasedUI()` 推广经理隐藏系统设置
3. **客户CRUD** — `getCustomers()/getMyCustomers()/renderCustomersTable()` + `window.editCustomer/assignCustomer/deleteCustomer` + `addCustomerBtn` 处理器（区总可分配经理）
4. **角色过滤** — `renderOrdersTable` + `renderDashboard` 推广经理只看分配客户的数据
5. **客户建议列表** — 报单表单 `customerSuggestions` 按角色填充（区总全量/推广经理仅分配客户）

### styles.css
- `.user-badge` / `.user-name` / `.user-role-tag` / `.logout-link` 侧边栏用户信息样式

## 权限矩阵

| 功能 | 区总 | 推广经理 |
|------|------|---------|
| 查看所有客户 | ✓ | ✗ (仅分配) |
| 客户分配管理 | ✓ | ✗ |
| 删除客户 | ✓ | ✗ |
| 编辑客户信息 | ✓ | ✓ |
| 查看所有报单 | ✓ | ✗ (仅分配客户) |
| 创建报单 | ✓ | ✓ |
| 查看仪表盘 | ✓ (全量) | ✓ (仅分配) |
| 数据分析 | ✓ | ✓ (已支持客户筛选) |
| 系统设置 | ✓ | ✗ |

## 默认账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 区总 |
| pm001 | pm001123 | 推广经理 |
| pm002 | pm002123 | 推广经理 |

## 验证
- ✅ 25 项关键符号检查全部通过
- ✅ Node.js 语法检查通过
