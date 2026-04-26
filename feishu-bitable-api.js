// 飞书多维表格 API 封装
// auto-generated 2026-04-26

(function() {
    'use strict';

    var cfg = window.FEISHU_BITABLE;
    if (!cfg) return console.error('[Bitable] config missing');

    var BASE = 'https://open.feishu.cn/open-apis/bitable/v1/apps/' + cfg.appToken + '/tables/';
    var AUTH_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    var _tokenCache = null;
    var _tokenExpiry = 0;

    // ========== Token ==========

    function getAccessToken() {
        if (_tokenCache && Date.now() < _tokenExpiry) {
            return Promise.resolve(_tokenCache);
        }
        return fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ app_id: cfg.appId, app_secret: cfg.appSecret })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.code !== 0) throw new Error('Token failed: ' + data.msg);
                _tokenCache = data.tenant_access_token;
                _tokenExpiry = Date.now() + (data.expire - 300) * 1000;
                return _tokenCache;
            });
    }

    function api(method, url, body) {
        return getAccessToken().then(function(token) {
            var opts = {
                method: method,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + token
                }
            };
            if (body) opts.body = JSON.stringify(body);
            return fetch(url, opts).then(function(r) { return r.json(); });
        });
    }

    // ========== 库存 CRUD ==========

    function listInventory() {
        var url = BASE + cfg.tables.inventory + '/records?page_size=500';
        return api('GET', url).then(function(res) {
            if (res.code !== 0) throw new Error(res.msg);
            return (res.data.items || []).map(mapInventoryRecord);
        });
    }

    function mapInventoryRecord(item) {
        var f = item.fields;
        return {
            id: item.record_id,
            series: f['产品系列'] || '',
            name: f['产品名称'] || '',
            grade: f['年级'] || '',
            subject: f['科目'] || '',
            volume: f['册次'] || '',
            version: f['版本'] || '',
            price: Number(f['定价']) || 0,
            quantity: Number(f['实际库存']) || 0,
            theoryQty: Number(f['理论库存']) || 0,
            actualQty: (Number(f['实际库存']) || 0) - (Number(f['理论库存']) || 0),
            status: f['状态'] || '正常',
            updateTime: typeof f['更新时间'] === 'number' ? new Date(f['更新时间']).toLocaleString() : (f['更新时间'] || '')
        };
    }

    function toInventoryFields(data) {
        return {
            '产品系列': data.series || '',
            '产品名称': data.name || '',
            '年级': data.grade || '',
            '科目': data.subject || '',
            '册次': data.volume || '',
            '版本': data.version || '',
            '定价': Number(data.price) || 0,
            '理论库存': Number(data.theoryQty) || 0,
            '实际库存': Number(data.quantity) || 0,
            '差异': Number(data.actualQty) || 0,
            '状态': data.status || '正常',
            '更新时间': Date.now()
        };
    }

    function createInventory(data) {
        return api('POST', BASE + cfg.tables.inventory + '/records', { fields: toInventoryFields(data) })
            .then(function(res) {
                if (res.code !== 0) throw new Error(res.msg);
                return res.data.record.record_id;
            });
    }

    function updateInventory(recordId, data) {
        return api('PUT', BASE + cfg.tables.inventory + '/records/' + recordId, { fields: toInventoryFields(data) })
            .then(function(res) {
                if (res.code !== 0) throw new Error(res.msg);
            });
    }

    function deleteInventory(recordId) {
        return api('DELETE', BASE + cfg.tables.inventory + '/records/' + recordId);
    }

    // ========== 报单 CRUD ==========

    function listOrders() {
        var url = BASE + cfg.tables.orders + '/records?page_size=500';
        return api('GET', url).then(function(res) {
            if (res.code !== 0) throw new Error(res.msg);
            return (res.data.items || []).map(mapOrderRecord);
        });
    }

    function mapOrderRecord(item) {
        var f = item.fields;
        return {
            id: item.record_id,
            orderTime: formatDateMs(f['报单时间']),
            company: f['公司名称'] || '',
            customer: f['客户名称'] || '',
            school: f['学校名称'] || '',
            series: f['产品系列'] || '',
            name: f['产品名称'] || '',
            grade: f['年级'] || '',
            subject: f['科目'] || '',
            volume: f['册次'] || '',
            version: f['版本'] || '',
            price: Number(f['定价']) || 0,
            studentQty: Number(f['学用数量']) || 0,
            teacherQty: Number(f['教师学用数量']) || 0,
            totalQty: Number(f['合计数量']) || 0,
            teachingQty: Number(f['教用数量']) || 0,
            amount: Number(f['金额']) || 0,
            channel: f['发货渠道'] || '',
            address: f['发货地址'] || '',
            status: f['发货状态'] || '待发货',
            assignedTo: f['报单人'] || ''
        };
    }

    function toOrderFields(data) {
        return {
            '报单时间': toEpochMs(data.orderTime),
            '公司名称': data.company || '',
            '客户名称': data.customer || '',
            '学校名称': data.school || '',
            '产品系列': data.series || '',
            '产品名称': data.name || '',
            '年级': data.grade || '',
            '科目': data.subject || '',
            '册次': data.volume || '',
            '版本': data.version || '',
            '定价': Number(data.price) || 0,
            '学用数量': Number(data.studentQty) || 0,
            '教师学用数量': Number(data.teacherQty) || 0,
            '合计数量': Number(data.totalQty) || 0,
            '教用数量': Number(data.teachingQty) || 0,
            '金额': Number(data.amount) || 0,
            '发货渠道': data.channel || '',
            '发货地址': data.address || '',
            '发货状态': data.status || '待发货',
            '报单人': data.assignedTo || '',
            '创建时间': Date.now()
        };
    }

    function createOrder(data) {
        return api('POST', BASE + cfg.tables.orders + '/records', { fields: toOrderFields(data) })
            .then(function(res) {
                if (res.code !== 0) throw new Error(res.msg);
                return res.data.record.record_id;
            });
    }

    function updateOrder(recordId, data) {
        return api('PUT', BASE + cfg.tables.orders + '/records/' + recordId, { fields: toOrderFields(data) })
            .then(function(res) {
                if (res.code !== 0) throw new Error(res.msg);
            });
    }

    function deleteOrder(recordId) {
        return api('DELETE', BASE + cfg.tables.orders + '/records/' + recordId);
    }

    // ========== 客户 CRUD ==========

    function listCustomers() {
        var url = BASE + cfg.tables.customers + '/records?page_size=500';
        return api('GET', url).then(function(res) {
            if (res.code !== 0) throw new Error(res.msg);
            return (res.data.items || []).map(mapCustomerRecord);
        });
    }

    function mapCustomerRecord(item) {
        var f = item.fields;
        return {
            id: item.record_id,
            name: f['客户名称'] || '',
            region: f['区域'] || '',
            phone: f['电话'] || '',
            note: f['备注'] || '',
            assignedTo: f['分配经理'] || ''
        };
    }

    function toCustomerFields(data) {
        return {
            '客户名称': data.name || '',
            '区域': data.region || '',
            '电话': data.phone || '',
            '备注': data.note || '',
            '分配经理': data.assignedTo || ''
        };
    }

    function createCustomer(data) {
        return api('POST', BASE + cfg.tables.customers + '/records', { fields: toCustomerFields(data) })
            .then(function(res) {
                if (res.code !== 0) throw new Error(res.msg);
                return res.data.record.record_id;
            });
    }

    function updateCustomer(recordId, data) {
        return api('PUT', BASE + cfg.tables.customers + '/records/' + recordId, { fields: toCustomerFields(data) })
            .then(function(res) {
                if (res.code !== 0) throw new Error(res.msg);
            });
    }

    function deleteCustomer(recordId) {
        return api('DELETE', BASE + cfg.tables.customers + '/records/' + recordId);
    }

    // ========== 批量同步 ==========

    function syncAllInventory(items) {
        return listInventory().then(function(existing) {
            return Promise.all(existing.map(function(r) { return deleteInventory(r.id); }));
        }).then(function() {
            return Promise.all(items.map(function(item) { return createInventory(item); }));
        });
    }

    function syncAllOrders(items) {
        return listOrders().then(function(existing) {
            return Promise.all(existing.map(function(r) { return deleteOrder(r.id); }));
        }).then(function() {
            return Promise.all(items.map(function(item) { return createOrder(item); }));
        });
    }

    // ========== 工具 ==========

    function formatDateMs(v) {
        if (!v) return '';
        if (typeof v === 'string') return v;
        var d = new Date(v);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function toEpochMs(v) {
        if (!v) return null;
        if (typeof v === 'number') return v;
        return new Date(v + 'T00:00:00+08:00').getTime();
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    // ========== 暴露到 window ==========

    window.BitableAPI = {
        listInventory: listInventory,
        createInventory: createInventory,
        updateInventory: updateInventory,
        deleteInventory: deleteInventory,
        syncAllInventory: syncAllInventory,

        listOrders: listOrders,
        createOrder: createOrder,
        updateOrder: updateOrder,
        deleteOrder: deleteOrder,
        syncAllOrders: syncAllOrders,

        listCustomers: listCustomers,
        createCustomer: createCustomer,
        updateCustomer: updateCustomer,
        deleteCustomer: deleteCustomer,

        getAccessToken: getAccessToken
    };

})();
