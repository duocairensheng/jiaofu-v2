// 教辅管理系统 - 主逻辑

document.addEventListener('DOMContentLoaded', function() {
    console.log('教辅管理系统启动...');

    const loginPage = document.getElementById('loginPage');
    const app = document.getElementById('app');
    const loginForm = document.getElementById('loginForm');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const pages = document.querySelectorAll('.page');
    const modal = document.getElementById('modal');
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.querySelector('.modal-cancel');

    // ==================== 用户管理 ====================
    function initUsers() {
        if (!localStorage.getItem('users')) {
            var defaultUsers = [
                { username: 'admin', password: 'admin123', role: '区总', displayName: '管理员' },
                { username: 'pm001', password: 'pm001123', role: '推广经理', displayName: '张经理' },
                { username: 'pm002', password: 'pm002123', role: '推广经理', displayName: '李经理' },
                { username: 'kefu', password: 'kefu123', role: '客服', displayName: '客服专员' }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
    }

    function getUsers() { return JSON.parse(localStorage.getItem('users') || '[]'); }
    function getCurrentUser() { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
    function isRegionalManager() { var u = getCurrentUser(); return u && u.role === '区总'; }
    function isPromotionManager() { var u = getCurrentUser(); return u && u.role === '推广经理'; }

    initUsers();

    // ==================== 登录 ====================
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var users = getUsers();
        var user = users.find(function(u) { return u.username === username && u.password === password; });
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            loginPage.style.display = 'none';
            app.style.display = 'flex';
            updateSidebarUserInfo(user);
            applyRoleBasedUI(user);
            renderInventoryTable();
            renderOrdersTable();
            renderCustomersTable();
            renderDashboard();
            console.log('登录成功，欢迎 ' + user.displayName + ' (' + user.role + ')!');
        } else {
            alert('用户名或密码错误！');
        }
    });

    // ==================== 导航 ====================
    sidebarNav.addEventListener('click', function(e) {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            sidebarNav.querySelectorAll('a').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            const targetPage = e.target.getAttribute('data-page');
            pages.forEach(p => p.classList.remove('active'));
            var el = document.getElementById(targetPage + 'Page');
            if (el) {
                el.classList.add('active');
                if (targetPage === 'inventory') renderInventoryTable();
                else if (targetPage === 'orders') renderOrdersTable();
                else if (targetPage === 'customers') renderCustomersTable();
                else if (targetPage === 'analytics') renderAnalytics();
                else if (targetPage === 'dashboard') renderDashboard();
            }
        }
    });

    // ==================== 角色UI适配 ====================
    function updateSidebarUserInfo(user) {
        var header = document.querySelector('.sidebar-header');
        if (header && user) {
            header.innerHTML = '<h3>教辅管理系统</h3><div class="user-badge"><span class="user-name">' + user.displayName + '</span><span class="user-role-tag">' + user.role + '</span><a href="#" id="logoutBtn" class="logout-link">退出</a></div>';
            setTimeout(function() {
                var btn = document.getElementById('logoutBtn');
                if (btn) btn.addEventListener('click', function(e) { e.preventDefault(); localStorage.removeItem('currentUser'); location.reload(); });
            }, 0);
        }
    }

    function applyRoleBasedUI(user) {
        if (user.role === '推广经理' || user.role === '客服') {
            var s = document.querySelector('[data-page="settings"]');
            if (s && s.parentElement) s.parentElement.style.display = 'none';
        }
    }

    // ==================== 模态框 ====================
    modalClose.addEventListener('click', function() { modal.classList.remove('active'); });
    modalCancel.addEventListener('click', function() { modal.classList.remove('active'); });
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('active'); });

    window.openModal = function(title, bodyContent) {
        modal.querySelector('.modal-header h3').textContent = title;
        modal.querySelector('.modal-body').innerHTML = bodyContent;
        modal.classList.add('active');
    };
    window.closeModal = function() { modal.classList.remove('active'); };

    // ==================== 公司 & 渠道管理 ====================
    function getCompanies() {
        var saved = localStorage.getItem('companies');
        if (saved) return JSON.parse(saved);
        var defaults = ['山东传美', '广西创学', '尚学壹品'];
        localStorage.setItem('companies', JSON.stringify(defaults));
        return defaults;
    }
    function saveCompanies(list) { localStorage.setItem('companies', JSON.stringify(list)); }

    function getChannels() {
        var saved = localStorage.getItem('channels');
        if (saved) return JSON.parse(saved);
        var defaults = ['新华', '客户', '学校'];
        localStorage.setItem('channels', JSON.stringify(defaults));
        return defaults;
    }
    function saveChannels(list) { localStorage.setItem('channels', JSON.stringify(list)); }

    // ==================== 库存数据工具 ====================
    function getInventoryData() { return JSON.parse(localStorage.getItem('inventory') || '[]'); }

    // ==================== 客户管理 ====================
    function getCustomers() { return JSON.parse(localStorage.getItem('customers') || '[]'); }
    function saveCustomers(list) { localStorage.setItem('customers', JSON.stringify(list)); }

    function getMyCustomers() {
        var u = getCurrentUser();
        if (!u) return [];
        var all = getCustomers();
        if (u.role !== '推广经理') return all;
        return all.filter(function(c) { return c.assignedTo === u.username; });
    }

    function getAssignedCustomerNames() {
        return getMyCustomers().map(function(c) { return c.name; });
    }

    function renderCustomersTable() {
        var u = getCurrentUser();
        if (!u) return;
        var customers = getMyCustomers();
        var searchEl = document.getElementById('customerSearch');
        if (searchEl) {
            var s = (searchEl.value || '').toLowerCase();
            if (s) {
                customers = customers.filter(function(c) {
                    return (c.name || '').toLowerCase().indexOf(s) >= 0 ||
                           (c.region || '').toLowerCase().indexOf(s) >= 0 ||
                           (c.phone || '').toLowerCase().indexOf(s) >= 0;
                });
            }
        }
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        var tbody = document.getElementById('customersTableBody');
        if (!tbody) return;
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;">暂无客户数据</td></tr>';
            return;
        }
        var pms = {};
        if (!isPromotionManager()) {
            var users = getUsers();
            users.forEach(function(u) { if (u.role === '推广经理') pms[u.username] = u.displayName; });
        }
        var html = '';
        customers.forEach(function(c) {
            var custOrders = orders.filter(function(o) { return o.customer === c.name; });
            var lastOrder = '-';
            if (custOrders.length > 0) {
                custOrders.sort(function(a, b) { return (a.orderTime || '') < (b.orderTime || '') ? 1 : -1; });
                lastOrder = custOrders[0].orderTime || '-';
            }
            var assigneeName = c.assignedTo && pms[c.assignedTo] ? pms[c.assignedTo] : (c.assignedTo || '未分配');
            var actions = '';
            if (!isPromotionManager()) {
                actions = '<button class="btn btn-sm btn-primary" onclick="window.editCustomer(\'' + c.id + '\')">编辑</button> ';
                actions += '<button class="btn btn-sm btn-secondary" onclick="window.assignCustomer(\'' + c.id + '\')">分配</button> ';
                actions += '<button class="btn btn-sm btn-danger" onclick="window.deleteCustomer(\'' + c.id + '\')">删除</button>';
            } else {
                actions = '<button class="btn btn-sm btn-primary" onclick="window.editCustomer(\'' + c.id + '\')">编辑</button>';
            }
            html += '<tr>' +
                '<td>' + (c.name || '-') + '</td>' +
                '<td>' + (c.region || '-') + '</td>' +
                '<td>' + (c.phone || '-') + '</td>' +
                '<td>' + assigneeName + '</td>' +
                '<td>' + custOrders.length + '</td>' +
                '<td>' + lastOrder + '</td>' +
                '<td class="action-cell">' + actions + '</td>' +
                '</tr>';
        });
        tbody.innerHTML = html;
    }

    window.editCustomer = function(id) {
        var customers = getCustomers();
        var c = customers.find(function(x) { return x.id === id; });
        if (!c) { alert('客户不存在'); return; }
        var body = '<div class="form-group"><label>客户名称 *</label><input type="text" id="editCustName" value="' + (c.name || '') + '"></div>';
        body += '<div class="form-group"><label>区域</label><input type="text" id="editCustRegion" value="' + (c.region || '') + '"></div>';
        body += '<div class="form-group"><label>联系电话</label><input type="text" id="editCustPhone" value="' + (c.phone || '') + '"></div>';
        body += '<div class="form-group"><label>备注</label><input type="text" id="editCustNote" value="' + (c.note || '') + '"></div>';
        window.openModal('编辑客户', body);
        document.querySelector('.modal-confirm').onclick = function() {
            var name = document.getElementById('editCustName');
            if (!name || !name.value.trim()) { alert('请输入客户名称'); return; }
            c.name = name.value.trim();
            c.region = document.getElementById('editCustRegion')?.value.trim() || '';
            c.phone = document.getElementById('editCustPhone')?.value.trim() || '';
            c.note = document.getElementById('editCustNote')?.value.trim() || '';
            saveCustomers(customers);
            window.closeModal();
            renderCustomersTable();
        };
    };

    window.assignCustomer = function(id) {
        var customers = getCustomers();
        var c = customers.find(function(x) { return x.id === id; });
        if (!c) { alert('客户不存在'); return; }
        var pms = getUsers().filter(function(u) { return u.role === '推广经理'; });
        var body = '<p>将客户 <strong>' + c.name + '</strong> 分配给：</p>';
        body += '<div class="form-group"><select id="assignPmSelect">';
        body += '<option value="">未分配</option>';
        pms.forEach(function(p) {
            body += '<option value="' + p.username + '"' + (c.assignedTo === p.username ? ' selected' : '') + '>' + p.displayName + ' (' + p.username + ')</option>';
        });
        body += '</select></div>';
        window.openModal('分配客户', body);
        document.querySelector('.modal-confirm').onclick = function() {
            var sel = document.getElementById('assignPmSelect');
            c.assignedTo = sel ? sel.value || '' : '';
            saveCustomers(customers);
            window.closeModal();
            renderCustomersTable();
        };
    };

    window.deleteCustomer = function(id) {
        if (!confirm('确定要删除此客户吗？相关报单数据不受影响。')) return;
        var customers = getCustomers();
        saveCustomers(customers.filter(function(x) { return x.id !== id; }));
        renderCustomersTable();
    };

    function updateOrderTotals() {
        var elS = document.getElementById('orderStudentQty');
        var elT = document.getElementById('orderTeacherQty');
        var elP = document.getElementById('orderPrice');
        var elTot = document.getElementById('orderTotalQty');
        var elAmt = document.getElementById('orderAmount');
        var s = elS ? (parseInt(elS.value) || 0) : 0;
        var t = elT ? (parseInt(elT.value) || 0) : 0;
        var p = elP ? (parseFloat(elP.value) || 0) : 0;
        var tot = s + t;
        if (elTot) elTot.value = tot;
        if (elAmt) elAmt.value = (p * tot).toFixed(2);
    }



    function getTodayDate() {
        var d = new Date();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + m + '-' + day;
    }
    function getDistinctValues(field) {
        var inv = getInventoryData();
        var vals = inv.map(function(i) { return i[field]; }).filter(Boolean);
        var seen = {};
        return vals.filter(function(v) { return seen.hasOwnProperty(v) ? false : (seen[v] = true); }).sort(function(a,b) {
            if (typeof a === 'string') return a.localeCompare(b, 'zh-CN');
            return a - b;
        });
    }

    // ==================== 级联产品选择 ====================
    function populateSelect(selectId, options, placeholder) {
        var sel = document.getElementById(selectId);
        if (!sel) return;
        sel.innerHTML = '<option value="">' + (placeholder || '请选择') + '</option>';
        options.forEach(function(opt) {
            var o = document.createElement('option');
            o.value = opt; o.textContent = opt;
            sel.appendChild(o);
        });
    }

    function buildCascadeOptions(field, filters) {
        var inv = getInventoryData();
        return inv.filter(function(item) {
            for (var key in filters) {
                if (!filters[key]) continue;
                if (item[key] !== filters[key]) return false;
            }
            return true;
        }).map(function(item) { return item[field]; }).filter(function(v, i, arr) {
            return v && arr.indexOf(v) === i;
        }).sort(function(a, b) { return a.localeCompare(b, 'zh-CN'); });
    }

    function resetSelects(fromId) {
        var cascade = ['orderSeries', 'orderProduct', 'orderGrade', 'orderSubject', 'orderVolume', 'orderVersion'];
        var found = false;
        for (var i = 0; i < cascade.length; i++) {
            if (found) {
                populateSelect(cascade[i], [], '请选择');
            }
            if (cascade[i] === fromId) found = true;
        }
        var priceEl = document.getElementById('orderPrice');
        if (priceEl && found) priceEl.value = '';
    }

    function onSeriesChange() {
        var val = this.value;
        resetSelects('orderSeries');
        if (val) populateSelect('orderProduct', buildCascadeOptions('name', { series: val }), '请选择产品');
    }

    function onProductChange() {
        var val = this.value;
        var seriesVal = document.getElementById('orderSeries').value;
        resetSelects('orderProduct');
        if (val && seriesVal) populateSelect('orderGrade', buildCascadeOptions('grade', { series: seriesVal, name: val }), '请选择年级');
    }

    function onGradeChange() {
        var val = this.value;
        var seriesVal = document.getElementById('orderSeries').value;
        var prodVal = document.getElementById('orderProduct').value;
        resetSelects('orderGrade');
        if (val && seriesVal && prodVal) populateSelect('orderSubject', buildCascadeOptions('subject', { series: seriesVal, name: prodVal, grade: val }), '请选择科目');
    }

    function onSubjectChange() {
        var val = this.value;
        var seriesVal = document.getElementById('orderSeries').value;
        var prodVal = document.getElementById('orderProduct').value;
        var gradeVal = document.getElementById('orderGrade').value;
        resetSelects('orderSubject');
        if (val && seriesVal && prodVal && gradeVal) populateSelect('orderVolume', buildCascadeOptions('volume', { series: seriesVal, name: prodVal, grade: gradeVal, subject: val }), '请选择册次');
    }

    function onVolumeChange() {
        var val = this.value;
        var seriesVal = document.getElementById('orderSeries').value;
        var prodVal = document.getElementById('orderProduct').value;
        var gradeVal = document.getElementById('orderGrade').value;
        var subjVal = document.getElementById('orderSubject').value;
        resetSelects('orderVolume');
        if (val && seriesVal && prodVal && gradeVal && subjVal) populateSelect('orderVersion', buildCascadeOptions('version', { series: seriesVal, name: prodVal, grade: gradeVal, subject: subjVal, volume: val }), '请选择版本');
    }
    function onVersionChange() {
        var seriesVal = document.getElementById('orderSeries').value;
        var prodVal = document.getElementById('orderProduct').value;
        var subjVal = document.getElementById('orderSubject').value;
        var volVal = document.getElementById('orderVolume').value;
        var verVal = this.value;
        var priceEl = document.getElementById('orderPrice');
        if (!priceEl) return;
        if (seriesVal && prodVal && subjVal && volVal && verVal) {
            var inv = getInventoryData();
            var match = inv.find(function(item) {
                return item.series === seriesVal && item.name === prodVal &&
                    item.subject === subjVal && item.volume === volVal && item.version === verVal;
            });
            if (match) { priceEl.value = match.price; }
        } else {
            priceEl.value = '';
        }
        updateAmount();
    }

    function updateAmount() {
        var price = parseFloat(document.getElementById('orderPrice').value) || 0;
        var qty = parseInt(document.getElementById('orderQty').value) || 0;
        var amtEl = document.getElementById('orderAmount');
        if (amtEl) amtEl.value = (price * qty).toFixed(2);
    }

    // ==================== 报单重复检查 ====================
    function checkDuplicate(data) {
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        return orders.filter(function(o) {
            return o.company === data.company &&
                o.customer === data.customer &&
                o.school === data.school &&
                o.series === data.series &&
                o.name === data.name &&
                o.subject === data.subject &&
                o.volume === data.volume;
        });
    }

    // ==================== 库存管理 ====================
    var addInventoryBtnEl = document.getElementById('addInventoryBtn');
    if (addInventoryBtnEl) {
        addInventoryBtnEl.addEventListener('click', function() {
            var formHTML =
                '<form id="inventoryForm">' +
                '<div class="form-row">' +
                '<div class="form-group"><label>产品系列 *</label><input type="text" name="productSeries" required placeholder="如：同步练习类"></div>' +
                '<div class="form-group"><label>产品名称 *</label><input type="text" name="productName" required placeholder="如：同步训练"></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group"><label>年级</label><input type="text" name="grade" placeholder="如：高一"></div>' +
                '<div class="form-group"><label>科目</label><input type="text" name="subject" placeholder="如：语文"></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group"><label>册次</label><input type="text" name="volume" placeholder="如：必修上册"></div>' +
                '<div class="form-group"><label>版本</label><input type="text" name="version" placeholder="如：人教"></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group"><label>定价</label><input type="number" step="0.01" name="price" placeholder="如：46.65"></div>' +
                '<div class="form-group"><label>库存数量</label><input type="number" name="stockQuantity" placeholder="如：5000"></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group"><label>理论库存</label><input type="number" name="theoreticalStock" placeholder="可选"></div>' +
                '<div class="form-group"><label>实际库存</label><input type="number" name="actualStock" placeholder="可选"></div>' +
                '</div>' +
                '</form>';
            openModal('添加产品', formHTML);
            var confirmBtn = modal.querySelector('.modal-confirm');
            confirmBtn.onclick = function() {
                var form = document.getElementById('inventoryForm');
                var fd = new FormData(form);
                var data = Object.fromEntries(fd);
                var inventory = getInventoryData();
                inventory.push({
                    id: Date.now() + Math.random(),
                    series: data.productSeries,
                    name: data.productName,
                    grade: data.grade,
                    subject: data.subject,
                    volume: data.volume,
                    version: data.version,
                    price: parseFloat(data.price) || 0,
                    quantity: parseInt(data.stockQuantity) || 0,
                    theoryQty: parseInt(data.theoreticalStock) || 0,
                    actualQty: parseInt(data.actualStock) || 0,
                    status: '正常',
                    updateTime: new Date().toLocaleString()
                });
                localStorage.setItem('inventory', JSON.stringify(inventory));
                alert('产品添加成功！');
                closeModal();
                renderInventoryTable();
            };
        });
    }

    // ==================== 报单管理 — 新增报单（级联表单） ====================
    var addOrderBtnEl = document.getElementById('addOrderBtn');
    if (addOrderBtnEl) {
        addOrderBtnEl.onclick = null;
        addOrderBtnEl.addEventListener('click', function() {
            var companies = getCompanies();
            var channels = getChannels();
            var coOpts = companies.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
            var chOpts = channels.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');

            var formHTML =
                '<form id="orderForm">' +
                '<div class="form-group"><label>报单时间</label><input type="date" id="orderTime" name="orderTime" readonly value="' + getTodayDate() + '" style="width:200px"></div>' +
                // 公司
                '<div class="form-row form-row-end">' +
                '<div class="form-group flex-1"><label>公司 *</label><div class="select-add-row"><select id="orderCompany" name="company" required><option value="">请选择公司</option>' + coOpts + '</select><button type="button" class="btn btn-sm btn-outline add-opt-btn" data-target="orderCompany" data-type="company">+ 新增</button></div></div>' +
                '<div class="form-group flex-1"><label>客户名称 *</label><input type="text" id="orderCustomer" name="customer" required placeholder="输入客户名称"></div>' +
                '</div>' +
                // 学校
                '<div class="form-group"><label>学校名称 *</label><input type="text" id="orderSchool" name="school" required placeholder="输入学校名称"></div>' +
                // 产品信息（级联选择）
                '<div class="form-section-title">产品信息 <span class="hint">（从库存中选择，定价自动填充）</span></div>' +
                '<div class="form-row">' +
                '<div class="form-group flex-1"><label>产品系列</label><select id="orderSeries"><option value="">请选择系列</option></select></div>' +
                '<div class="form-group flex-1"><label>产品名称</label><select id="orderProduct"><option value="">请先选择系列</option></select></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group flex-1"><label>年级</label><select id="orderGrade"><option value="">请先选择产品</option></select></div>' +
                '<div class="form-group flex-1"><label>科目</label><select id="orderSubject"><option value="">请先选择年级</option></select></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group flex-1"><label>册次</label><select id="orderVolume"><option value="">请先选择科目</option></select></div>' +
                '<div class="form-group flex-1"><label>版本</label><select id="orderVersion"><option value="">请先选择册次</option></select></div>' +
                '</div>' +
                '<div class="form-group"><label>定价（自动填充）</label><input type="number" step="0.01" id="orderPrice" name="price" readonly placeholder="选择版本后自动填充" style="width:200px"></div>' +
                // 数量与金额
                '<div class="form-section-title">数量信息</div>' +
                '<div class="form-row">' +
                '<div class="form-group flex-1"><label>学用数量 *</label><input type="number" id="orderStudentQty" name="studentQty" required placeholder="学生用量" min="1" value="1"></div>' +
                '<div class="form-group flex-1"><label>教师学用数量</label><input type="number" id="orderTeacherQty" name="teacherQty" placeholder="教师用量" min="0" value="0"></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group flex-1"><label>合计数量</label><input type="text" id="orderTotalQty" name="totalQty" readonly placeholder="= 学用 + 教师学用"></div>' +
                '<div class="form-group flex-1"><label>教用数量</label><input type="number" id="orderTeachingQty" name="teachingQty" placeholder="教师用书数量" min="0" value="0"></div>' +
                '</div>' +
                '<div class="form-group"><label>金额（自动计算）</label><input type="text" id="orderAmount" name="amount" readonly placeholder="= 定价 × 合计数量"></div>' +
                // 发货信息
                '<div class="form-section-title">发货信息</div>' +
                '<div class="form-row form-row-end">' +
                '<div class="form-group flex-1"><label>发货渠道 *</label><div class="select-add-row"><select id="orderChannel" name="channel" required><option value="">请选择发货渠道</option>' + chOpts + '</select><button type="button" class="btn btn-sm btn-outline add-opt-btn" data-target="orderChannel" data-type="channel">+ 新增</button></div></div>' +
                '<div class="form-group flex-1"><label>发货地址</label><input type="text" id="orderAddress" name="address" placeholder="完整地址+联系人+电话"></div>' +
                '</div>' +
                '<div class="form-row">' +
                '<div class="form-group flex-1"><label>发货状态</label><select id="orderStatus" name="status"><option value="已报">已报</option><option value="待发货" selected>待发货</option><option value="已发货">已发货</option><option value="等通知发货">等通知发货</option></select></div>' +
                '</div>' +
                '<div id="dupWarning" class="dup-warning" style="display:none;"></div>' +
                '</form>';

            openModal('添加报单', formHTML);

            // 填充客户建议列表（按角色过滤）
            var customerSugg = document.getElementById('customerSuggestions');
            if (customerSugg) {
                customerSugg.innerHTML = '';
                if (!isPromotionManager()) {
                    var allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                    var custSet = {};
                    allOrders.forEach(function(o) { if (o.customer) custSet[o.customer] = true; });
                    Object.keys(custSet).sort().forEach(function(c) {
                        var opt = document.createElement('option');
                        opt.value = c; customerSugg.appendChild(opt);
                    });
                } else {
                    getMyCustomers().forEach(function(c) {
                        var opt = document.createElement('option');
                        opt.value = c.name; customerSugg.appendChild(opt);
                    });
                }
            }

            // 初始化级联第一级
            var inv = getInventoryData();
            if (inv.length > 0) {
                populateSelect('orderSeries', getDistinctValues('series'), '请选择系列');
            } else {
                populateSelect('orderSeries', [], '请先导入库存数据');
            }

            // 绑定级联事件
            var orderSeries = document.getElementById('orderSeries');
            var orderProduct = document.getElementById('orderProduct');
            var orderGrade = document.getElementById('orderGrade');
            var orderSubject = document.getElementById('orderSubject');
            var orderVolume = document.getElementById('orderVolume');
            var orderVersion = document.getElementById('orderVersion');
            var orderStudentQty = document.getElementById('orderStudentQty');
            var orderTeacherQty = document.getElementById('orderTeacherQty');
            var orderPrice = document.getElementById('orderPrice');

            if (orderSeries) orderSeries.onchange = onSeriesChange;
            if (orderProduct) orderProduct.onchange = onProductChange;
            if (orderGrade) orderGrade.onchange = onGradeChange;
            if (orderSubject) orderSubject.onchange = onSubjectChange;
            if (orderVolume) orderVolume.onchange = onVolumeChange;
            if (orderVersion) orderVersion.onchange = onVersionChange;
            if (orderStudentQty) orderStudentQty.oninput = updateOrderTotals;
            if (orderTeacherQty) orderTeacherQty.oninput = updateOrderTotals;
            if (orderPrice) orderPrice.oninput = updateOrderTotals;

            // "新增"按钮事件 — 公司和渠道
            var addBtns = modal.querySelectorAll('.add-opt-btn');
            addBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var targetId = this.getAttribute('data-target');
                    var type = this.getAttribute('data-type');
                    var newName = prompt('请输入新' + (type === 'company' ? '公司' : '发货渠道') + '名称：');
                    if (!newName || !newName.trim()) return;
                    newName = newName.trim();
                    var target = document.getElementById(targetId);
                    if (type === 'company') {
                        var list = getCompanies();
                        if (list.indexOf(newName) === -1) { list.push(newName); saveCompanies(list); }
                    } else {
                        var list = getChannels();
                        if (list.indexOf(newName) === -1) { list.push(newName); saveChannels(list); }
                    }
                    var opt = document.createElement('option');
                    opt.value = newName; opt.textContent = newName; opt.selected = true;
                    target.appendChild(opt);
                });
            });

            // 确认按钮
            var confirmBtn = modal.querySelector('.modal-confirm');
            confirmBtn.onclick = null;
            confirmBtn.onclick = function() {
                var orderTimeEl2 = document.getElementById('orderTime');
                var companyEl = document.getElementById('orderCompany');
                var customerEl = document.getElementById('orderCustomer');
                var schoolEl = document.getElementById('orderSchool');
                var seriesEl = document.getElementById('orderSeries');
                var productEl = document.getElementById('orderProduct');
                var gradeEl = document.getElementById('orderGrade');
                var subjectEl = document.getElementById('orderSubject');
                var volumeEl = document.getElementById('orderVolume');
                var versionEl = document.getElementById('orderVersion');
                var priceEl2 = document.getElementById('orderPrice');
                var studentQtyEl = document.getElementById('orderStudentQty');
                var teacherQtyEl = document.getElementById('orderTeacherQty');
                var teachingEl = document.getElementById('orderTeachingQty');
                var channelEl = document.getElementById('orderChannel');
                var addressEl = document.getElementById('orderAddress');
                var statusEl = document.getElementById('orderStatus');

                if (!companyEl || !companyEl.value) { alert('请选择公司'); return; }
                if (!customerEl || !customerEl.value.trim()) { alert('请输入客户名称'); return; }
                if (!schoolEl || !schoolEl.value.trim()) { alert('请输入学校名称'); return; }
                if (!studentQtyEl || !studentQtyEl.value || parseInt(studentQtyEl.value) <= 0) { alert('请输入有效学用数量'); return; }
                if (!channelEl || !channelEl.value) { alert('请选择发货渠道'); return; }

                var sQty = parseInt(studentQtyEl.value) || 0;
                var tQty = teacherQtyEl ? (parseInt(teacherQtyEl.value) || 0) : 0;
                var totQty = sQty + tQty;

                var orderData = {
                    company: companyEl.value,
                    customer: customerEl.value.trim(),
                    school: schoolEl.value.trim(),
                    series: seriesEl ? seriesEl.value : '',
                    name: productEl ? productEl.value : '',
                    grade: gradeEl ? gradeEl.value : '',
                    subject: subjectEl ? subjectEl.value : '',
                    volume: volumeEl ? volumeEl.value : '',
                    version: versionEl ? versionEl.value : '',
                    price: parseFloat(priceEl2 ? priceEl2.value : 0) || 0,
                    studentQty: sQty,
                    teacherQty: tQty,
                    totalQty: totQty,
                    teachingQty: teachingEl ? (parseInt(teachingEl.value) || 0) : 0,
                    amount: 0,
                    channel: channelEl.value,
                    address: addressEl ? addressEl.value.trim() : '',
                    status: statusEl ? statusEl.value : '待发货',
                    orderTime: orderTimeEl2 ? orderTimeEl2.value : getTodayDate()
                };
                orderData.amount = (orderData.price * totQty).toFixed(2);

                // 重复检查
                var dups = checkDuplicate(orderData);
                if (dups.length > 0) {
                    var dupInfo = '⚠️ 发现 ' + dups.length + ' 条相似报单：\n\n';
                    dups.slice(0, 5).forEach(function(d) {
                        dupInfo += '• ' + d.company + ' / ' + d.customer + ' / ' + d.school + ' / ' + d.name + ' (' + d.subject + ' ' + d.volume + ') — ¥' + d.amount + '\n';
                    });
                    if (dups.length > 5) dupInfo += '...还有 ' + (dups.length - 5) + ' 条\n';
                    dupInfo += '\n是否仍要保存此报单？';
                    if (!confirm(dupInfo)) return;
                }

                var orders = JSON.parse(localStorage.getItem('orders') || '[]');
                orderData.id = Date.now() + Math.random();
                orderData.orderTime = getTodayDate();
                orders.push(orderData);
                localStorage.setItem('orders', JSON.stringify(orders));
                // 自动同步客户：报单人默认为该客户的负责人
                var custs = JSON.parse(localStorage.getItem('customers') || '[]');
                var cn = orderData.customer;
                var existCust = custs.find(function(c) { return c.name === cn; });
                if (!existCust) {
                    var cu = getCurrentUser();
                    custs.push({
                        id: String(Date.now()) + String(Math.random()).slice(2, 8),
                        name: cn,
                        region: '',
                        phone: '',
                        note: '',
                        assignedTo: cu ? cu.username : ''
                    });
                    localStorage.setItem('customers', JSON.stringify(custs));
                }
                alert('报单添加成功！\n学用: ' + sQty + ' + 教师学用: ' + tQty + ' = 合计: ' + totQty + '\n金额: ¥' + orderData.amount);
                closeModal();
                renderOrdersTable();
                renderDashboard();
            };
        });
    }

    // ==================== Excel 导入 ====================
    // 库存导入
    var importInventoryBtnEl = document.getElementById('importInventoryBtn');
    if (importInventoryBtnEl) {
        importInventoryBtnEl.addEventListener('click', function() {
            var input = document.createElement('input');
            input.type = 'file'; input.accept = '.xlsx,.xls';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var data = new Uint8Array(event.target.result);
                        var wb = XLSX.read(data, { type: 'array' });
                        var ws = wb.Sheets[wb.SheetNames[0]];
                        var jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        var headers = jsonData[0];
                        var rows = jsonData.slice(1).map(function(row) {
                            var obj = {};
                            headers.forEach(function(h, i) { obj[h] = row[i]; });
                            return obj;
                        });
                        var inventory = getInventoryData();
                        var newItems = rows.map(function(row) {
                            return {
                                id: Date.now() + Math.random(),
                                series: row['产品系列'] || '',
                                name: row['产品名称'] || '',
                                grade: row['年级'] || '',
                                subject: row['科目'] || '',
                                volume: row['册次'] || '',
                                version: row['版本'] || '',
                                price: parseFloat(row['定价']) || 0,
                                quantity: parseInt(row['库存数量']) || 0,
                                theoryQty: parseInt(row['理论库存']) || 0,
                                actualQty: parseInt(row['实际库存']) || 0,
                                status: '正常',
                                updateTime: new Date().toLocaleString()
                            };
                        });
                        inventory = inventory.concat(newItems);
                        localStorage.setItem('inventory', JSON.stringify(inventory));
                        alert('成功导入 ' + newItems.length + ' 条库存数据！');
                        renderInventoryTable();
                    } catch (err) { console.error(err); alert('Excel 文件解析失败！'); }
                };
                reader.readAsArrayBuffer(file);
            };
            input.click();
        });
    }

    // 报单导入
    var importOrderBtnEl = document.getElementById('importOrderBtn');
    if (importOrderBtnEl) {
        importOrderBtnEl.addEventListener('click', function() {
            var input = document.createElement('input');
            input.type = 'file'; input.accept = '.xlsx,.xls';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var data = new Uint8Array(event.target.result);
                        var wb = XLSX.read(data, { type: 'array' });
                        var ws = wb.Sheets[wb.SheetNames[0]];
                        var jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        var headers = jsonData[0];
                        var rows = jsonData.slice(1).map(function(row) {
                            var obj = {};
                            headers.forEach(function(h, i) { obj[h] = row[i]; });
                            return obj;
                        });
                        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
                        var newOrders = rows.map(function(row) {
                            var sQty = parseInt(row['学用数量']) || 0;
                            var tQty = parseInt(row['教师学用数量']) || 0;
                            var totQty = sQty + tQty;
                            var price = parseFloat(row['定价']) || 0;
                            return {
                                id: Date.now() + Math.random(),
                                company: row['公司名称'] || row['公司'] || '',
                                customer: row['客户名称'] || '',
                                school: row['学校名称'] || '',
                                series: row['产品系列'] || '',
                                name: row['产品名称'] || '',
                                grade: row['年级'] || '',
                                subject: row['科目'] || '',
                                volume: row['册次'] || '',
                                version: row['版本'] || '',
                                price: price,
                                studentQty: sQty,
                                teacherQty: tQty,
                                totalQty: totQty,
                                teachingQty: parseInt(row['教用数量']) || 0,
                                amount: (price * totQty).toFixed(2),
                                channel: row['发货渠道'] || '',
                                address: row['发货地址'] || '',
                                status: row['发货状态'] || '待发货',
                                orderTime: new Date().toISOString().split('T')[0]
                            };
                        });
                        orders = orders.concat(newOrders);
                        localStorage.setItem('orders', JSON.stringify(orders));
                        alert('成功导入 ' + newOrders.length + ' 条报单数据！');
                        renderOrdersTable();
                        renderDashboard();
                    } catch (err) { console.error(err); alert('Excel 文件解析失败！'); }
                };
                reader.readAsArrayBuffer(file);
            };
            input.click();
        });
    }

    // ==================== 客户管理按钮 ====================
    var addCustomerBtnEl = document.getElementById('addCustomerBtn');
    if (addCustomerBtnEl) {
        addCustomerBtnEl.addEventListener('click', function() {
            var pms = getUsers().filter(function(u) { return u.role === '推广经理'; });
            var body = '<div class="form-group"><label>客户名称 *</label><input type="text" id="newCustName" placeholder="请输入客户名称"></div>';
            body += '<div class="form-group"><label>区域</label><input type="text" id="newCustRegion" placeholder="如：华东、华南"></div>';
            body += '<div class="form-group"><label>联系电话</label><input type="text" id="newCustPhone" placeholder="请输入联系电话"></div>';
            body += '<div class="form-group"><label>备注</label><input type="text" id="newCustNote" placeholder="备注信息"></div>';
            if (isRegionalManager() && pms.length > 0) {
                body += '<div class="form-group"><label>分配经理</label><select id="newCustAssigned">';
                body += '<option value="">暂不分配</option>';
                pms.forEach(function(p) { body += '<option value="' + p.username + '">' + p.displayName + '</option>'; });
                body += '</select></div>';
            }
            window.openModal('添加客户', body);
            document.querySelector('.modal-confirm').onclick = function() {
                var nameEl = document.getElementById('newCustName');
                if (!nameEl || !nameEl.value.trim()) { alert('请输入客户名称'); return; }
                var customers = getCustomers();
                var newCust = {
                    id: 'cust_' + Date.now(),
                    name: nameEl.value.trim(),
                    region: document.getElementById('newCustRegion')?.value.trim() || '',
                    phone: document.getElementById('newCustPhone')?.value.trim() || '',
                    note: document.getElementById('newCustNote')?.value.trim() || '',
                    assignedTo: document.getElementById('newCustAssigned')?.value || ''
                };
                customers.push(newCust);
                saveCustomers(customers);
                window.closeModal();
                renderCustomersTable();
            };
        });
    }

    // 客户搜索事件
    var customerSearchEl = document.getElementById('customerSearch');
    if (customerSearchEl) customerSearchEl.addEventListener('input', function() { renderCustomersTable(); });

    // ==================== OCR 图片识别 ====================
    var ocrOrderBtnEl = document.getElementById('ocrOrderBtn');
    if (ocrOrderBtnEl) {
        ocrOrderBtnEl.addEventListener('click', function() {
            var input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                alert('正在识别图片，请稍候...');
                var reader = new FileReader();
                reader.onload = function(event) {
                    var img = new Image();
                    img.onload = function() {
                        Tesseract.recognize(img.src, 'chi_sim+eng', { logger: function(m) { console.log(m); } })
                            .then(function(res) {
                                console.log('OCR:', res.data.text);
                                var parsed = parseOCRText(res.data.text);
                                openOCRResultForm(parsed);
                            })
                            .catch(function(err) { console.error(err); alert('图片识别失败！'); });
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            };
            input.click();
        });
    }

    function parseOCRText(text) {
        var data = { company: '', customer: '', school: '', series: '', name: '', subject: '', volume: '', version: '', price: 0, quantity: 0, teachingQty: 0, channel: '', address: '' };
        var lines = text.split('\n');
        lines.forEach(function(line) {
            var l = line.trim();
            if (!l) return;
            if (l.includes('公司')) data.company = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
            else if (l.includes('客户')) data.customer = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
            else if (l.includes('学校')) data.school = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 30);
            else if (l.includes('产品') || l.includes('书名')) data.name = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 50);
            else if (l.includes('系列')) data.series = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
            else if (l.match(/\d+\.?\d*/) && l.includes('元')) { var pm = l.match(/(\d+\.?\d*)/); if (pm) data.price = parseFloat(pm[1]); }
            else if (l.match(/\d+/) && (l.includes('册') || l.includes('本'))) { var qm = l.match(/(\d+)/); if (qm) data.quantity = parseInt(qm[1]); }
        });
        return data;
    }

    function openOCRResultForm(data) {
        var companies = getCompanies();
        var channels = getChannels();
        var coOpts = companies.map(function(c) {
            var sel = c === data.company ? ' selected' : '';
            return '<option value="' + c + '"' + sel + '>' + c + '</option>';
        }).join('');
        var chOpts = channels.map(function(c) {
            var sel = c === data.channel ? ' selected' : '';
            return '<option value="' + c + '"' + sel + '>' + c + '</option>';
        }).join('');

        var formHTML =
            '<form id="ocrOrderForm">' +
            '<p class="ocr-hint">图片识别结果可能不准确，请仔细核对后提交！</p>' +
            '<div class="form-row"><div class="form-group"><label>公司</label><select name="company" required><option value="">请选择</option>' + coOpts + '</select></div><div class="form-group"><label>客户名称</label><input type="text" name="customer" value="' + (data.customer || '') + '" required></div></div>' +
            '<div class="form-group"><label>学校名称</label><input type="text" name="school" value="' + (data.school || '') + '" required></div>' +
            '<div class="form-row"><div class="form-group"><label>产品系列</label><input type="text" name="series" value="' + (data.series || '') + '"></div><div class="form-group"><label>产品名称</label><input type="text" name="name" value="' + (data.name || '') + '"></div></div>' +
            '<div class="form-row"><div class="form-group"><label>科目</label><input type="text" name="subject" value="' + (data.subject || '') + '"></div><div class="form-group"><label>册次</label><input type="text" name="volume" value="' + (data.volume || '') + '"></div></div>' +
            '<div class="form-row"><div class="form-group"><label>版本</label><input type="text" name="version" value="' + (data.version || '') + '"></div><div class="form-group"><label>定价</label><input type="number" step="0.01" name="price" value="' + (data.price || '') + '"></div></div>' +
            '<div class="form-row"><div class="form-group"><label>数量</label><input type="number" name="quantity" value="' + (data.quantity || '') + '"></div><div class="form-group"><label>教用数量</label><input type="number" name="teachingQty" value="' + (data.teachingQty || 0) + '"></div></div>' +
            '<div class="form-row"><div class="form-group"><label>发货渠道</label><select name="channel">' + chOpts + '</select></div><div class="form-group"><label>发货地址</label><input type="text" name="address" value="' + (data.address || '') + '"></div></div>' +
            '</form>';

        openModal('OCR 识别结果 - 请核对', formHTML);

        var confirmBtn = modal.querySelector('.modal-confirm');
        confirmBtn.onclick = null;
        confirmBtn.onclick = function() {
            var form = document.getElementById('ocrOrderForm');
            var fd = new FormData(form);
            var dat = Object.fromEntries(fd);
            dat.price = parseFloat(dat.price) || 0;
            dat.quantity = parseInt(dat.quantity) || 0;
            dat.teachingQty = parseInt(dat.teachingQty) || 0;
            dat.amount = (dat.price * dat.quantity).toFixed(2);
            dat.status = '待发货';

            var orders = JSON.parse(localStorage.getItem('orders') || '[]');
            dat.id = Date.now() + Math.random();
            dat.orderTime = getTodayDate();
            orders.push(dat);
            localStorage.setItem('orders', JSON.stringify(orders));
            alert('报单添加成功！');
            closeModal();
            renderOrdersTable();
            renderDashboard();
        };
    }

    // ==================== 表格渲染 ====================
    function renderInventoryTable(data) {
        if (!data) data = getInventoryData();
        var tbody = document.getElementById('inventoryTableBody');
        if (!tbody) return;
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;color:#999;">暂无数据，请导入或添加库存</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(function(item) {
            var diff = (item.actualQty || 0) - (item.theoryQty || 0);
            var diffStr = diff > 0 ? '+' + diff : String(diff);
            var statusCls = item.status === '正常' ? 'success' : 'warning';
            return '<tr>' +
                '<td>' + (item.series || '-') + '</td>' +
                '<td>' + (item.name || '-') + '</td>' +
                '<td>' + (item.grade || '-') + '</td>' +
                '<td>' + (item.subject || '-') + '</td>' +
                '<td>' + (item.volume || '-') + '</td>' +
                '<td>' + (item.version || '-') + '</td>' +
                '<td>¥' + (item.price || 0).toFixed(2) + '</td>' +
                '<td>' + (item.quantity || 0) + '</td>' +
                '<td>' + (item.theoryQty || 0) + '</td>' +
                '<td>' + (item.actualQty || 0) + '</td>' +
                '<td>' + diffStr + '</td>' +
                '<td><span class="status-badge status-' + statusCls + '">' + item.status + '</span></td>' +
                '<td>' + (item.updateTime || '-') + '</td>' +
                '<td><button class="btn-icon" onclick="deleteInventory(\'' + item.id + '\')">🗑️</button></td>' +
                '</tr>';
        }).join('');
    }

    function renderOrdersTable(data) {
        if (!data) data = JSON.parse(localStorage.getItem('orders') || '[]');
        var tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;color:#999;">暂无报单数据</td></tr>';
            return;
        }


        // 搜索与筛选
        var searchText = (document.getElementById('orderSearch') && document.getElementById('orderSearch').value || '').toLowerCase();
        var filterStatus = document.getElementById('orderFilterStatus') && document.getElementById('orderFilterStatus').value || 'all';

        var filtered = data;
        // 角色过滤：推广经理只看分配客户的报单
        if (isPromotionManager()) {
            var myNames = getAssignedCustomerNames();
            filtered = filtered.filter(function(o) { return myNames.indexOf(o.customer) >= 0; });
        }
        if (searchText) {
            filtered = filtered.filter(function(o) {
                return (o.company || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (o.customer || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (o.school || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (o.name || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (o.series || '').toLowerCase().indexOf(searchText) >= 0;
            });
        }
        if (filterStatus && filterStatus !== 'all') {
            filtered = filtered.filter(function(o) { return o.status === filterStatus; });
        }
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;color:#999;">无匹配报单数据</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(item) {
            var sQty = item.studentQty || 0;
            var tQty = item.teacherQty || 0;
            var tot = sQty + tQty;
            var amt = item.amount || 0;
            return '<tr>' +
                '<td>' + (item.orderTime || '-') + '</td>' +
                '<td>' + (item.company || '-') + '</td>' +
                '<td>' + (item.customer || '-') + '</td>' +
                '<td>' + (item.school || '-') + '</td>' +
                '<td>' + (item.series || '-') + '</td>' +
                '<td>' + (item.name || '-') + '</td>' +
                '<td>' + (item.grade || '-') + '</td>' +
                '<td>' + (item.subject || '-') + '</td>' +
                '<td>' + (item.volume || '-') + '</td>' +
                '<td>' + (item.version || '-') + '</td>' +
                '<td>¥' + (item.price || 0).toFixed(2) + '</td>' +
                '<td>' + sQty + '</td>' +
                '<td>' + tQty + '</td>' +
                '<td>' + tot + '</td>' +
                '<td>' + (item.teachingQty || 0) + '</td>' +
                '<td>¥' + parseFloat(amt).toFixed(2) + '</td>' +
                '<td>' + (item.channel || '-') + '</td>' +
                '<td class="addr-cell">' + (item.address || '-') + '</td>' +
                '<td>' + (item.status || '-') + '</td>' +
                '<td><button class="btn-icon" onclick="deleteOrder(\'' + item.id + '\')">🗑️</button></td>' +
                '</tr>';
        }).join('');
    }

    // 搜索与筛选绑定
    var orderSearchEl = document.getElementById('orderSearch');
    var orderFilterEl = document.getElementById('orderFilterStatus');
    if (orderSearchEl) orderSearchEl.addEventListener('input', function() { renderOrdersTable(); });
    if (orderFilterEl) orderFilterEl.addEventListener('change', function() { renderOrdersTable(); });

    // ==================== 仪表盘渲染 ====================
    function renderDashboard() {
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        // 推广经理只看分配客户的报单
        if (isPromotionManager()) {
            var myNames = getAssignedCustomerNames();
            orders = orders.filter(function(o) { return myNames.indexOf(o.customer) >= 0; });
        }
        var today = new Date().toLocaleDateString();
        var todayOrders = orders.filter(function(o) { return o.orderTime && o.orderTime.indexOf(today) >= 0; });
        var pending = orders.filter(function(o) { return o.status === '待发货' || o.status === '等通知发货'; });
        var revenue = orders.reduce(function(s, o) { return s + parseFloat(o.amount || 0); }, 0);

        var elToday = document.getElementById('dashTodayOrders');
        var elPending = document.getElementById('dashPendingOrders');
        var elRevenue = document.getElementById('dashRevenue');
        if (elToday) elToday.textContent = todayOrders.length;
        if (elPending) elPending.textContent = pending.length;
        if (elRevenue) elRevenue.textContent = '¥' + revenue.toFixed(2);

        // 最近报单
        var recentTable = document.getElementById('recentOrdersTable');
        if (recentTable) {
            var recent = orders.slice(-10).reverse();
            var tbody = recentTable.querySelector('tbody');
            if (tbody) {
                if (recent.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;">暂无报单数据</td></tr>';
                } else {
                    tbody.innerHTML = recent.map(function(o) {
                        return '<tr>' +
                            '<td>' + (o.company || '-') + '</td>' +
                            '<td>' + (o.customer || '-') + '</td>' +
                            '<td>' + (o.school || '-') + '</td>' +
                            '<td>' + (o.name || '-') + '</td>' +
                            '<td>' + ((o.studentQty || 0) + (o.teacherQty || 0)) + '</td>' +
                            '<td>¥' + parseFloat(o.amount || 0).toFixed(2) + '</td>' +
                            '<td>' + (o.channel || '-') + '</td>' +
                            '</tr>';
                    }).join('');
                }
            }
        }
    }

    // ==================== 删除函数 ====================
    window.deleteInventory = function(id) {
        if (!confirm('确定要删除这条库存记录吗？')) return;
        var inventory = getInventoryData().filter(function(item) { return item.id != id; });
        localStorage.setItem('inventory', JSON.stringify(inventory));
        renderInventoryTable();
    };

    window.deleteOrder = function(id) {
        if (!confirm('确定要删除这条报单记录吗？')) return;
        var orders = JSON.parse(localStorage.getItem('orders') || '[]').filter(function(item) { return item.id != id; });
        localStorage.setItem('orders', JSON.stringify(orders));
        renderOrdersTable();
        renderDashboard();
    };

    // ==================== 数据分析 ====================
    // ==================== 数据分析 ====================

    // 从报单数据获取不重复值（客户和学校在报单中而非库存中）
    function getOrderDistinctValues(field) {
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        var vals = orders.map(function(o) { return o[field]; }).filter(Boolean);
        var seen = {};
        return vals.filter(function(v) { return seen.hasOwnProperty(v) ? false : (seen[v] = true); }).sort(function(a, b) {
            return a.localeCompare(b, 'zh-CN');
        });
    }

    // 初始化分析页6个筛选下拉
    function initAnalyticsFilters() {
        // 报单时间 & 客户 & 学校（从报单数据）
        populateSelect('analyticsTime', getOrderDistinctValues('orderTime'), '全部时间');
        populateSelect('analyticsCustomer', getOrderDistinctValues('customer'), '全部客户');
        populateSelect('analyticsSchool', getOrderDistinctValues('school'), '全部学校');
        // 产品系列（从库存数据）
        populateSelect('analyticsSeries', getDistinctValues('series'), '全部系列');
        populateSelect('analyticsProduct', [], '全部产品');
        populateSelect('analyticsSubject', [], '全部科目');
        populateSelect('analyticsVolume', [], '全部册次');
    }

    // 分析页级联：系列变更
    function onAnalyticsSeriesChange() {
        var val = this.value;
        var select = casc['analyticsProduct'];
        var subjSel = casc['analyticsSubject'];
        var volSel = casc['analyticsVolume'];
        if (select) select.innerHTML = '<option value="">全部产品</option>';
        if (subjSel) subjSel.innerHTML = '<option value="">全部科目</option>';
        if (volSel) volSel.innerHTML = '<option value="">全部册次</option>';
        if (val) {
            var opts = buildCascadeOptions('name', { series: val });
            opts.forEach(function(opt) {
                var o = document.createElement('option');
                o.value = opt; o.textContent = opt;
                if (select) select.appendChild(o);
            });
        }
        renderAnalytics();
    }

    // 分析页级联：产品变更
    function onAnalyticsProductChange() {
        var val = this.value;
        var serVal = casc['analyticsSeries'] ? casc['analyticsSeries'].value : '';
        var subjSel = casc['analyticsSubject'];
        var volSel = casc['analyticsVolume'];
        if (subjSel) subjSel.innerHTML = '<option value="">全部科目</option>';
        if (volSel) volSel.innerHTML = '<option value="">全部册次</option>';
        if (val) {
            var opts = buildCascadeOptions('subject', { series: serVal, name: val });
            opts.forEach(function(opt) {
                var o = document.createElement('option');
                o.value = opt; o.textContent = opt;
                if (subjSel) subjSel.appendChild(o);
            });
        }
        renderAnalytics();
    }

    // 分析页级联：科目变更
    function onAnalyticsSubjectChange() {
        var val = this.value;
        var serVal = casc['analyticsSeries'] ? casc['analyticsSeries'].value : '';
        var prodVal = casc['analyticsProduct'] ? casc['analyticsProduct'].value : '';
        var volSel = casc['analyticsVolume'];
        if (volSel) volSel.innerHTML = '<option value="">全部册次</option>';
        if (val) {
            var opts = buildCascadeOptions('volume', { series: serVal, name: prodVal, subject: val });
            opts.forEach(function(opt) {
                var o = document.createElement('option');
                o.value = opt; o.textContent = opt;
                if (volSel) volSel.appendChild(o);
            });
        }
        renderAnalytics();
    }

    function onAnalyticsVolumeChange() {
        renderAnalytics();
    }

    // 绑定分析页筛选事件
    ['analyticsTime', 'analyticsCustomer', 'analyticsSchool'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', renderAnalytics);
    });

    // 级联 select 用 casc 对象统一管理
    var casc = {};
    var cascadeIds = ['analyticsSeries', 'analyticsProduct', 'analyticsSubject', 'analyticsVolume'];
    cascadeIds.forEach(function(id) { casc[id] = document.getElementById(id); });

    if (casc['analyticsSeries']) casc['analyticsSeries'].addEventListener('change', onAnalyticsSeriesChange);
    if (casc['analyticsProduct']) casc['analyticsProduct'].addEventListener('change', onAnalyticsProductChange);
    if (casc['analyticsSubject']) casc['analyticsSubject'].addEventListener('change', onAnalyticsSubjectChange);
    if (casc['analyticsVolume']) casc['analyticsVolume'].addEventListener('change', onAnalyticsVolumeChange);

    // 重置按钮
    var resetBtn = document.getElementById('resetAnalyticsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            initAnalyticsFilters();
            renderAnalytics();
        });
    }

    window.renderAnalytics = function() {
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        // 推广经理只看分配客户的报单
        if (isPromotionManager()) {
            var anNames = getAssignedCustomerNames();
            orders = orders.filter(function(o) { return anNames.indexOf(o.customer) >= 0; });
        }

        // 六维筛选
        var filters = {
            orderTime: casc['analyticsTime'] ? casc['analyticsTime'].value : '',
            customer: casc['analyticsCustomer'] ? casc['analyticsCustomer'].value : '',
            school: casc['analyticsSchool'] ? casc['analyticsSchool'].value : '',
            series: casc['analyticsSeries'] ? casc['analyticsSeries'].value : '',
            name: casc['analyticsProduct'] ? casc['analyticsProduct'].value : '',
            subject: casc['analyticsSubject'] ? casc['analyticsSubject'].value : '',
            volume: casc['analyticsVolume'] ? casc['analyticsVolume'].value : ''
        };

        var filtered = orders.filter(function(o) {
            for (var key in filters) {
                if (!filters[key]) continue;
                if (o[key] !== filters[key]) return false;
            }
            return true;
        });

        // 汇总统计
        var totalQty = filtered.reduce(function(s, o) { return s + (parseInt(o.studentQty || 0) + parseInt(o.teacherQty || 0)); }, 0);
        var totalAmt = filtered.reduce(function(s, o) { return s + parseFloat(o.amount || 0); }, 0);
        var el1 = document.getElementById('statTotalOrders');
        var el2 = document.getElementById('statTotalAmount');
        var el3 = document.getElementById('statAvgAmount');
        var el4 = document.getElementById('statCustomerCount');
        if (el1) el1.textContent = filtered.length;
        if (el2) el2.textContent = '¥' + totalAmt.toFixed(2);
        if (el3) el3.textContent = filtered.length > 0 ? '¥' + (totalAmt / filtered.length).toFixed(2) : '¥0';
        // 客户数统计也受筛选影响
        var custSet = {};
        filtered.forEach(function(o) { if (o.customer) custSet[o.customer] = true; });
        if (el4) el4.textContent = Object.keys(custSet).length;

        // 分析表格（按维度分组）
        var dim = casc['analyticsProduct'] && casc['analyticsProduct'].value ? 'name' : 
                  (casc['analyticsSeries'] && casc['analyticsSeries'].value ? 'series' :
                  (casc['analyticsSubject'] && casc['analyticsSubject'].value ? 'subject' :
                  (casc['analyticsCustomer'] && casc['analyticsCustomer'].value ? 'customer' : 'name')));

        var groups = {};
        filtered.forEach(function(o) {
            var key;
            if (dim === 'name') key = o.name || '未知产品';
            else if (dim === 'series') key = o.series || '未知系列';
            else if (dim === 'subject') key = o.subject || '未知科目';
            else if (dim === 'customer') key = o.customer || '未知客户';
            else key = o.name || '未知产品';
            if (!groups[key]) groups[key] = { count: 0, amount: 0, qty: 0 };
            groups[key].count++;
            groups[key].amount += parseFloat(o.amount || 0);
            groups[key].qty += (parseInt(o.studentQty || 0) + parseInt(o.teacherQty || 0));
        });

        var tbody = document.getElementById('analyticsTableBody');
        if (tbody) {
            if (Object.keys(groups).length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">暂无分析数据</td></tr>';
            } else {
                var totalCnt = filtered.length;
                tbody.innerHTML = Object.keys(groups).map(function(k) {
                    var g = groups[k];
                    var pct = totalCnt > 0 ? (g.count / totalCnt * 100).toFixed(1) + '%' : '0%';
                    return '<tr><td>' + k + '</td><td>' + g.count + '</td><td>¥' + g.amount.toFixed(2) + '</td><td>¥' + (g.count > 0 ? (g.amount / g.count).toFixed(2) : '0.00') + '</td><td>' + pct + '</td></tr>';
                }).join('');
            }
        }

        // 导出按钮
        var exportBtn = document.getElementById('exportAnalyticsBtn');
        if (exportBtn) {
            exportBtn.onclick = function() {
                var csvContent = '\uFEFF维度,报单数量,总金额,平均金额,占比\n';
                Object.keys(groups).forEach(function(k) {
                    var g = groups[k];
                    var pct = totalCnt > 0 ? (g.count / totalCnt * 100).toFixed(1) + '%' : '0%';
                    csvContent += k + ',' + g.count + ',¥' + g.amount.toFixed(2) + ',¥' + (g.count > 0 ? (g.amount / g.count).toFixed(2) : '0.00') + ',' + pct + '\n';
                });
                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url; a.download = 'analytics-export.csv';
                a.click(); URL.revokeObjectURL(url);
            };
        }

        // 图表
        renderAnalyticsCharts(filtered, dim);
    };

    function renderAnalyticsCharts(data, dim) {
        var groups = {};
        data.forEach(function(o) {
            var key = '未知';
            if (dim === 'product') key = o.name || '未知产品';
            else if (dim === 'customer') key = o.customer || '未知客户';
            else if (dim === 'channel') key = o.channel || '未知渠道';
            else key = o.orderTime ? o.orderTime.substring(0, 10) : '未知日期';
            if (!groups[key]) groups[key] = { count: 0, amount: 0 };
            groups[key].count++;
            groups[key].amount += parseFloat(o.amount || 0);
        });

        var keys = Object.keys(groups);
        var counts = keys.map(function(k) { return groups[k].count; });
        var amounts = keys.map(function(k) { return groups[k].amount; });

        try {
            var ctx1 = document.getElementById('orderChart');
            if (ctx1) {
                if (ctx1._chart) ctx1._chart.destroy();
                ctx1._chart = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: keys,
                        datasets: [{ label: '报单数量', data: counts, borderColor: '#667eea', tension: 0.3, fill: false }]
                    },
                    options: { responsive: true, maintainAspectRatio: true }
                });
            }
            var ctx2 = document.getElementById('productChart');
            if (ctx2) {
                if (ctx2._chart) ctx2._chart.destroy();
                ctx2._chart = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: keys,
                        datasets: [{ label: '销售额 (¥)', data: amounts, backgroundColor: '#667eea' }]
                    },
                    options: { responsive: true, maintainAspectRatio: true }
                });
            }
        } catch (e) { console.warn('图表渲染失败:', e); }
    }

    // 系统设置
    var saveFeishuBtn = document.getElementById('saveFeishuConfig');
    // ==================== 系统设置 ====================
    var saveFeishuBtn = document.getElementById('saveFeishuConfig');
    if (saveFeishuBtn) {
        saveFeishuBtn.addEventListener('click', function() {
            var config = {
                appId: document.getElementById('feishuAppId').value,
                appSecret: document.getElementById('feishuAppSecret').value,
                appToken: document.getElementById('feishuAppToken').value,
                inventoryTable: document.getElementById('feishuInventoryTable').value,
                ordersTable: document.getElementById('feishuOrdersTable').value,
                customersTable: document.getElementById('feishuCustomersTable').value
            };
            localStorage.setItem('feishuConfig', JSON.stringify(config));
            alert('飞书配置已保存！');
        });
    }

    var clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('确定要清空所有本地数据吗？此操作不可恢复！')) {
                localStorage.removeItem('inventory');
                localStorage.removeItem('orders');
                localStorage.removeItem('customers');
                alert('数据已清空！');
                renderInventoryTable();
                renderOrdersTable();
                renderDashboard();
            }
        });
    }

    var exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            var data = {
                inventory: getInventoryData(),
                orders: JSON.parse(localStorage.getItem('orders') || '[]'),
                companies: getCompanies(),
                channels: getChannels(),
                exportTime: new Date().toISOString()
            };
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'jiaofu-backup-' + new Date().toISOString().substring(0, 10) + '.json';
            a.click(); URL.revokeObjectURL(url);
        });
    }

    var importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', function() {
            var input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    try {
                        var data = JSON.parse(ev.target.result);
                        if (data.inventory) localStorage.setItem('inventory', JSON.stringify(data.inventory));
                        if (data.orders) localStorage.setItem('orders', JSON.stringify(data.orders));
                        if (data.companies) localStorage.setItem('companies', JSON.stringify(data.companies));
                        if (data.channels) localStorage.setItem('channels', JSON.stringify(data.channels));
                        alert('数据导入成功！');
                        renderInventoryTable();
                        renderOrdersTable();
                        renderDashboard();
                    } catch (err) { alert('文件格式错误！'); }
                };
                reader.readAsText(file);
            };
            input.click();
        });
    }

    // 加载飞书配置
    var feishuCfg = JSON.parse(localStorage.getItem('feishuConfig') || '{}');
    if (feishuCfg.appId) document.getElementById('feishuAppId').value = feishuCfg.appId || '';
    if (feishuCfg.appSecret) document.getElementById('feishuAppSecret').value = feishuCfg.appSecret || '';
    if (feishuCfg.appToken) document.getElementById('feishuAppToken').value = feishuCfg.appToken || '';
    if (feishuCfg.inventoryTable) document.getElementById('feishuInventoryTable').value = feishuCfg.inventoryTable || '';
    if (feishuCfg.ordersTable) document.getElementById('feishuOrdersTable').value = feishuCfg.ordersTable || '';
    if (feishuCfg.customersTable) document.getElementById('feishuCustomersTable').value = feishuCfg.customersTable || '';

    console.log('系统初始化完成！');
});
