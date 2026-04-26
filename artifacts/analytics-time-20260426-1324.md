# 数据分析页 — 新增报单时间筛选维度

## 改动

### index.html（11,370 bytes）
- `analytics-filters` div 最前新增 `<select id="analyticsTime">` 下拉，放在客户之前
- 筛选顺序变为：时间 → 客户 → 学校 → 系列 → 产品 → 科目 → 册次

### app.js（62,407 bytes）— 3 处改动
1. **`initAnalyticsFilters()`** — 新增 `populateSelect('analyticsTime', getOrderDistinctValues('orderTime'), '全部时间')`
2. **change 事件绑定** — `['analyticsTime', 'analyticsCustomer', 'analyticsSchool']` 全部触发 `renderAnalytics`
3. **`renderAnalytics()` filters 对象** — 新增 `orderTime: casc['analyticsTime']?.value`

## 验证
- ✅ Node.js 语法检查通过
- ✅ 5 个关键符号全部确认
- ✅ 旧字段不受影响
