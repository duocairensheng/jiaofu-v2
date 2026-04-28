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
            if (custOrders.length > 0 && (!c.region || c.region === '')) {
                var schools = [];
                custOrders.forEach(function(o) { if (o.school && schools.indexOf(o.school) < 0) schools.push(o.school); });
                if (schools.length > 0) c.region = schools.join('\u3001');
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
                '<td><a href="#" style="color:#1890ff;" onclick="window.showCustomerOrders(''" + (c.name || '').replace(/'/g, "\\'") + "''); return false;">" + custOrders.length + '</a></td>' +
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
                if (window.BitableAPI) { window.BitableAPI.createInventory(inventory[inventory.length-1]).catch(function(e){ console.error(e); }); }
                alert('产品添加成功！');
                closeModal();
                renderInventoryTable();
                renderDashboard();
            };
        });
    }

    // ==================== 报单管理 — 新增报单（级联表单） ====================
    var addOrderBtnEl = document.getElementById('addOrderBtn');
    if (addOrderBtnEl) {
        addOrderBtnEl.onclick = null;
        addOrderBtnEl.addEventListener('click', function() {
            window.openMultiOrderForm();
            return;
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
                if (window.BitableAPI) { window.BitableAPI.createOrder(orderData).catch(function(e){ console.error(e); }); }
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
                        if (window.BitableAPI) { newItems.forEach(function(it){ window.BitableAPI.createInventory(it).catch(function(){}); }); }
                        alert('成功导入 ' + newItems.length + ' 条库存数据！');
                        renderInventoryTable();
                        renderDashboard();
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
                        if (window.BitableAPI) { newOrders.forEach(function(it){ window.BitableAPI.createOrder(it).catch(function(){}); }); }
                        alert('成功导入 ' + newOrders.length + ' 条报单数据！');
                        renderOrdersTable();
                        renderDashboard();
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
                if (window.BitableAPI) { window.BitableAPI.createCustomer(newCust).catch(function(e){ console.error(e); }); }
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

    // Levenshtein distance for fuzzy matching
    function levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        var matrix = [];
        for (var i = 0; i <= b.length; i++) matrix[i] = [i];
        for (var j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (var i = 1; i <= b.length; i++) {
            for (var j = 1; j <= a.length; j++) {
                if (b.charAt(i-1) === a.charAt(j-1)) matrix[i][j] = matrix[i-1][j-1];
                else matrix[i][j] = Math.min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1);
            }
        }
        return matrix[b.length][a.length];
    }
    function fuzzySimilarity(s1, s2) {
        if (!s1 || !s2) return 0;
        var dist = levenshtein(s1, s2);
        var maxLen = Math.max(s1.length, s2.length);
        return maxLen === 0 ? 1 : 1 - dist / maxLen;
    }
    function fuzzyMatchInventory(text) {
        var inventory = getInventoryData();
        if (inventory.length === 0) return null;
        var best = null;
        var bestScore = 0;
        inventory.forEach(function(item) {
            var name = (item.name || '');
            if (text.indexOf(name) >= 0) { best = item; bestScore = 1.0; return; }
            var score = fuzzySimilarity(text, name);
            var parts = name.replace(/[\(\)\(\)]/g, ' ').split(/\s+/).filter(function(p){return p.length>1;});
            parts.forEach(function(part) {
                var ps = fuzzySimilarity(text, part);
                score = Math.max(score, ps);
            });
            if (score > bestScore && score > 0.4) { best = item; bestScore = score; }
        });
        return best ? { item: best, confidence: bestScore } : null;
    }
    function parseOCRText(text) {
        var data = { company: '', customer: '', school: '', series: '', name: '', subject: '', volume: '', version: '', price: 0, quantity: 0, teachingQty: 0, channel: '', address: '' };
        var lines = text.split('\n');
        var rawProductName = '';
        lines.forEach(function(line) {
            var l = line.trim();
            if (!l) return;
            if (l.includes('\u516c\u53f8')) data.company = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
            else if (l.includes('\u5ba2\u6237')) data.customer = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
            else if (l.includes('\u5b66\u6821')) data.school = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 30);
            else if (l.includes('\u4ea7\u54c1') || l.includes('\u4e66\u540d')) { rawProductName = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\(\)\\(\\)\(\)]/g, '').substring(0, 50); data.name = rawProductName; }
            else if (l.includes('\u7cfb\u5217')) data.series = l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
            else if (l.match(/\d+\.?\d*/) && l.includes('\u5143')) { var pm = l.match(/(\d+\.?\d*)/); if (pm) data.price = parseFloat(pm[1]); }
            else if (l.match(/\d+/) && (l.includes('\u518c') || l.includes('\u672c'))) { var qm = l.match(/(\d+)/); if (qm) data.quantity = parseInt(qm[1]); }
        });
        if (rawProductName) {
            var match = fuzzyMatchInventory(rawProductName);
            if (match) {
                data._fuzzyMatch = match;
                if (!data.series) data.series = match.item.series || '';
                if (!data.name || data.name !== match.item.name) data.name = match.item.name || '';
                if (!data.price) data.price = match.item.price || 0;
                data._source = match.item;
            }
        }
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

        // Build fuzzy match hint
        var fuzzyHint = '';
        if (data._fuzzyMatch) {
            var conf = Math.round(data._fuzzyMatch.confidence * 100);
            var confColor = conf >= 80 ? '#28a745' : (conf >= 60 ? '#fd7e14' : '#dc3545');
            var invItem = data._fuzzyMatch.item;
            fuzzyHint = '<div class="ocr-hint" style="background:#e6f7ed;border:1px solid #28a745;">' +
                '自动匹配到库存产品：<b>' + (invItem.name || '') + '</b> ' +
                '(' + (invItem.grade || '') + ' | ' + (invItem.subject || '') + ' | ' + (invItem.volume || '') + ' | ' + (invItem.version || '') + ') ' +
                '定价: ¥' + (invItem.price || 0).toFixed(2) + ' | 匹配置信度: <b style="color:' + confColor + ';">' + conf + '%</b>' +
                '</div>';
        } else {
            fuzzyHint = '<div class="ocr-hint" style="background:#fff3cd;border:1px solid #ffc107;">' +
                '未匹配到库存产品，请手动选择或输入</div>';
        }
        // Build inventory product options for dropdown
        var inventory = getInventoryData();
        var invOpts = '<option value="">手动输入</option>';
        var seenProducts = {};
        inventory.forEach(function(item) {
            var key = item.name + '|' + (item.grade||'') + '|' + (item.subject||'');
            if (!seenProducts[key]) {
                seenProducts[key] = true;
                var sel = (data._source && data._source.name === item.name && data._source.grade === item.grade) ? ' selected' : '';
                invOpts += '<option value="' + key + '"' + sel + '>' + item.name + ' (' + (item.grade||'') + ' ' + (item.subject||'') + ' ' + (item.volume||'') + ')</option>';
            }
        });

        // Build subject/volume/version options if matched
        var srcItem = data._source;
        var subjectOpts = '<option value="">选择</option>';
        var volumeOpts = '<option value="">选择</option>';
        var versionOpts = '<option value="">选择</option>';
        if (srcItem) {
            var sameProducts = inventory.filter(function(it){ return it.name === srcItem.name && it.grade === srcItem.grade; });
            var seenS = {}, seenV = {}, seenVer = {};
            sameProducts.forEach(function(it) {
                if (it.subject && !seenS[it.subject]) { seenS[it.subject]=true; subjectOpts += '<option value="'+it.subject+'"'+(it.subject===srcItem.subject?' selected':'')+'>'+it.subject+'</option>'; }
                if (it.volume && !seenV[it.volume]) { seenV[it.volume]=true; volumeOpts += '<option value="'+it.volume+'"'+(it.volume===srcItem.volume?' selected':'')+'>'+it.volume+'</option>'; }
                if (it.version && !seenVer[it.version]) { seenVer[it.version]=true; versionOpts += '<option value="'+it.version+'"'+(it.version===srcItem.version?' selected':'')+'>'+it.version+'</option>'; }
            });
        }

        var formHTML =
            '<form id="ocrOrderForm">' +
            fuzzyHint +
            '<div class="form-row"><div class="form-group"><label>公司</label><select name="company" required><option value="">请选择</option>' + coOpts + '</select></div><div class="form-group"><label>客户名称</label><input type="text" name="customer" value="' + (data.customer || '') + '" required></div></div>' +
            '<div class="form-group"><label>学校名称</label><input type="text" name="school" value="' + (data.school || '') + '" required></div>' +
            '<div class="form-section-title">产品信息 <span class="hint">（从库存匹配或手动选择）</span></div>' +
            '<div class="form-group"><label>产品名称</label><select name="productKey" id="ocrProductSelect" onchange="window.ocrOnProductChange()">' + invOpts + '</select></div>' +
            '<div class="form-row"><div class="form-group"><label>产品系列</label><input type="text" name="series" id="ocrSeries" value="' + (data.series || '') + '" placeholder="自动填充"></div><div class="form-group"><label>科目</label><select name="subject" id="ocrSubject">' + subjectOpts + '</select></div></div>' +
            '<div class="form-row"><div class="form-group"><label>册次</label><select name="volume" id="ocrVolume">' + volumeOpts + '</select></div><div class="form-group"><label>版本</label><select name="version" id="ocrVersion">' + versionOpts + '</select></div>' +
            '<div class="form-group"><label>定价</label><input type="number" step="0.01" name="price" id="ocrPrice" value="' + (data.price || '') + '"></div></div>' +
            '<div class="form-section-title">数量与发货信息</div>' +
            '<div class="form-row"><div class="form-group"><label>学用数量</label><input type="number" name="studentQty" id="ocrStudentQty" value="' + (data.quantity || 1) + '" min="0"></div><div class="form-group"><label>教师学用</label><input type="number" name="teacherQty" id="ocrTeacherQty" value="0" min="0"></div></div>' +
            '<div class="form-row"><div class="form-group"><label>教用数量</label><input type="number" name="teachingQty" value="' + (data.teachingQty || 0) + '"></div><div class="form-group"><label>发货状态</label><select name="status"><option value="待发货" selected>待发货</option><option value="已报">已报</option><option value="等通知发货">等通知发货</option></select></div></div>' +
            '<div class="form-row"><div class="form-group"><label>发货渠道</label><select name="channel">' + chOpts + '</select></div><div class="form-group"><label>发货地址</label><input type="text" name="address" value="' + (data.address || '') + '"></div></div>' +
            '<div class="form-group"><label>备注</label><input type="text" name="remark" placeholder="备注">' +
            '</form>';

        openModal('OCR 识别结果 - 请核对', formHTML);

        // OCR product select change handler
        window.ocrOnProductChange = function() {
            var sel = document.getElementById('ocrProductSelect');
            if (!sel || !sel.value) return;
            var parts = sel.value.split('|');
            var inv = getInventoryData();
            var match = inv.find(function(it){ return it.name === parts[0] && it.grade === parts[1] && it.subject === parts[2]; });
            if (!match) return;
            // Auto-fill fields
            var seriesEl = document.getElementById('ocrSeries');
            var subjectEl = document.getElementById('ocrSubject');
            var volumeEl = document.getElementById('ocrVolume');
            var versionEl = document.getElementById('ocrVersion');
            var priceEl = document.getElementById('ocrPrice');
            if (seriesEl) seriesEl.value = match.series || '';
            if (subjectEl) { subjectEl.innerHTML = '<option value="'+match.subject+'">'+match.subject+'</option>'; subjectEl.value = match.subject; }
            if (volumeEl) { volumeEl.innerHTML = '<option value="'+match.volume+'">'+match.volume+'</option>'; volumeEl.value = match.volume; }
            if (versionEl) { 
                // Show all versions for this product
                var sameProducts = inv.filter(function(it){ return it.name === match.name && it.grade === match.grade && it.subject === match.subject; });
                versionEl.innerHTML = '';
                var seenVer = {};
                sameProducts.forEach(function(it) {
                    if (it.version && !seenVer[it.version]) { seenVer[it.version]=true; var o=document.createElement('option');o.value=it.version;o.textContent=it.version;versionEl.appendChild(o); }
                });
                versionEl.value = match.version;
            }
            if (priceEl) priceEl.value = match.price || 0;
        };

        var confirmBtn = modal.querySelector('.modal-confirm');
        confirmBtn.onclick = null;
        confirmBtn.onclick = function() {
            var form = document.getElementById('ocrOrderForm');
            var fd = new FormData(form);
            var dat = Object.fromEntries(fd);
            // Handle product select → extract name/grade/subject
            if (dat.productKey) {
                var parts = dat.productKey.split('|');
                dat.name = parts[0] || '';
                dat.grade = parts[1] || '';
            }
            delete dat.productKey;
            dat.studentQty = parseInt(dat.studentQty || 0);
            dat.teacherQty = parseInt(dat.teacherQty || 0);
            dat.totalQty = dat.studentQty + dat.teacherQty;
            dat.price = parseFloat(dat.price) || 0;
            dat.teachingQty = parseInt(dat.teachingQty) || 0;
            dat.amount = (dat.price * dat.totalQty).toFixed(2);
            dat.id = Date.now() + Math.random();
            dat.orderTime = getTodayDate();
            dat.shippingStatus = (dat.status === '已发货') ? '已发货' : '未发货';

            if (!dat.company) { alert('请选择公司'); return; }
            if (!dat.customer) { alert('请输入客户名称'); return; }
            if (!dat.school) { alert('请输入学校名称'); return; }
            if (!dat.name) { alert('请选择或输入产品'); return; }
            if (dat.totalQty <= 0) { alert('请输入有效数量'); return; }

            var orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(dat);
            localStorage.setItem('orders', JSON.stringify(orders));
            if (window.BitableAPI) { window.BitableAPI.createOrder(dat).catch(function(e){ console.error(e); }); }
            alert('报单添加成功！');
            closeModal();
            updateInventoryFromOrders();
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
            tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;color:#999;">暂无数据，请导入或添加库存</td></tr>';
            return;
        }
        var searchText = (document.getElementById('inventorySearch') && document.getElementById('inventorySearch').value || '').toLowerCase();
        var filtered = data;
        if (searchText) {
            filtered = data.filter(function(item) {
                return (item.name || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (item.series || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (item.subject || '').toLowerCase().indexOf(searchText) >= 0;
            });
        }
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;color:#999;">无匹配库存数据</td></tr>';
            return;
        }
        var expandedSet = {};
        var html = '';
        filtered.forEach(function(item) {
            var diff = (item.actualQty || 0) - (item.theoryQty || 0);
            var diffStr = diff > 0 ? '+' + diff : String(diff);
            var statusCls = item.status === '正常' ? 'success' : (item.status === '预警' ? 'warning' : 'danger');
            var subcats = item.subcategories || [];
            var totalAdded = subcats.reduce(function(s, sc) { return s + (sc.qty || 0); }, 0);
            var itemId = item.id;
            // Main row
            html += '<tr class="inventory-row" data-item-id="' + itemId + '">' +
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
                '<td><span class="status-badge status-' + statusCls + '">' + (item.status || '正常') + '</span></td>' +
                '<td>' + (item.updateTime || '-') + '</td>' +
                '<td>' +
                '<button class="btn btn-sm btn-success" onclick="window.addInventoryStock(\'' + itemId + '\')">+增加库存</button>' +
                '<button class="btn btn-sm btn-info" onclick="window.addInventorySubcategory(\'' + itemId + '\')">子分类</button>' +
                '<button class="btn-icon" onclick="window.deleteInventory(\'' + itemId + '\')" title="删除">🗑️</button>' +
                '<button class="btn btn-sm btn-info" onclick="window.showStockLog(\'' + itemId + '\')">记录</button>' +
                '</td>' +
                '</tr>';
            // Subcategory expand toggle row
            if (subcats.length > 0) {
                html += '<tr class="subcat-toggle-row" data-item-id="' + itemId + '" onclick="window.toggleSubcategoryView(\'' + itemId + '\')" style="cursor:pointer;background:#f8f9fa;">' +
                    '<td colspan="15" style="padding:4px 12px;font-size:12px;color:#666;">' +
                    '📋 累计新增 <b>' + totalAdded + '</b> 次，共 <b>' + subcats.length + '</b> 笔记录 <span class="expand-arrow" id="arrow_' + itemId + '">▶</span>' +
                    '</td></tr>';
                // Subcategory detail rows (hidden by default)
                subcats.slice().reverse().forEach(function(sc, idx) {
                    html += '<tr class="subcat-detail-row subcat-' + itemId + '" style="display:none;background:#f0f4ff;">' +
                        '<td colspan="15" style="padding:2px 20px;font-size:11px;">' +
                        '&nbsp;&nbsp;├ ' + (idx + 1) + '. ' + sc.time + ' | +' + sc.qty +
                        ' | ' + (sc.note || '无备注') + ' | 操作人: ' + (sc.operator || '-') +
                        (sc.qty > 0 ? '<button class="btn-icon" onclick="event.stopPropagation();window.deleteSubcategoryEntry(\'' + itemId + '\',\'' + sc.id + '\')" title="删除此记录" style="margin-left:8px;font-size:10px;">❌</button>' : '') +
                        '</td></tr>';
                });
            }
        });
        tbody.innerHTML = html;
    }
    window.toggleSubcategoryView = function(itemId) {
        var rows = document.querySelectorAll('.subcat-' + itemId);
        var arrow = document.getElementById('arrow_' + itemId);
        var visible = rows.length > 0 && rows[0].style.display !== 'none';
        rows.forEach(function(r) { r.style.display = visible ? 'none' : 'table-row'; });
        if (arrow) arrow.textContent = visible ? '▶' : '▼';
    };
    window.deleteSubcategoryEntry = function(itemId, entryId) {
        if (!confirm('确定要删除这条子分类记录吗？')) return;
        var inventory = getInventoryData();
        var item = inventory.find(function(x) { return x.id === itemId; });
        if (!item) return;
        var subcats = item.subcategories || [];
        var entry = subcats.find(function(s) { return s.id === entryId; });
        item.subcategories = subcats.filter(function(s) { return s.id !== entryId; });
        // Recalculate cumulative
        var totalAdded = (item.subcategories || []).reduce(function(s, sc) { return s + (sc.qty || 0); }, 0);
        item.quantity = (item._baseQty || 0) + totalAdded;
        item.originalQty = item.quantity;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        if (window.BitableAPI) { window.BitableAPI.updateInventory(itemId, item).catch(function(){}); }
        renderInventoryTable();
        renderDashboard();
    };

    // ========== 库存增加与日志 ==========
    function getStockLogs() { return JSON.parse(localStorage.getItem('stockLogs') || '[]'); }
    function saveStockLogs(list) { localStorage.setItem('stockLogs', JSON.stringify(list)); }

    window.addInventoryStock = function(id) {
        var inventory = getInventoryData();
        var item = inventory.find(function(x) { return x.id === id; });
        if (!item) { alert('产品不存在'); return; }
        var currentUser = getCurrentUser();
        var operator = currentUser ? (currentUser.displayName || currentUser.username) : '系统';
        var body = '<div class="form-group"><label>当前产品</label><p style="font-weight:bold;margin:4px 0;">' + (item.name || '-') + '</p></div>';
        body += '<div class="form-group"><label>当前库存</label><p style="margin:4px 0;">' + (item.quantity || 0) + '</p></div>';
        body += '<div class="form-group"><label>增加数量 <span style="color:red;">*</span></label><input type="number" id="addStockQty" min="1" value="1" style="width:100%;padding:8px;"></div>';
        body += '<div class="form-group"><label>备注</label><input type="text" id="addStockNote" placeholder="采购批次、供应商等" style="width:100%;padding:8px;"></div>';
        body += '<div class="form-group"><label>增加后库存</label><p style="margin:4px 0;font-weight:bold;color:#28a745;" id="previewQty">' + (item.quantity || 0) + '</p></div>';
        window.openModal('增加库存 - ' + (item.name || ''), body);
        // Live preview
        var qtyInput = document.getElementById('addStockQty');
        if (qtyInput) {
            qtyInput.addEventListener('input', function() {
                var preview = document.getElementById('previewQty');
                if (preview) preview.textContent = (item.quantity || 0) + (parseInt(qtyInput.value) || 0);
            });
        }
        var confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = function() {
                var qty = parseInt(document.getElementById('addStockQty').value) || 0;
                var note = document.getElementById('addStockNote').value || '';
                if (qty <= 0) { alert('请输入有效数量'); return; }
                // Initialize base tracking
                if (item._baseQty === undefined) item._baseQty = item.quantity || 0;
                // Add to subcategories
                if (!item.subcategories) item.subcategories = [];
                item.subcategories.push({
                    id: 'sc_' + Date.now(),
                    qty: qty,
                    note: note,
                    operator: operator,
                    time: new Date().toLocaleString()
                });
                // Update total quantity
                var totalAdded = item.subcategories.reduce(function(s, sc) { return s + (sc.qty || 0); }, 0);
                item.quantity = item._baseQty + totalAdded;
                if (!item.originalQty) item.originalQty = item.quantity;
                item.updateTime = new Date().toISOString().slice(0, 10);
                // Also save to stockLogs for backwards compat
                var logs = getStockLogs();
                logs.push({ id: 'log_' + Date.now(), inventoryId: id, productName: item.name, change: qty, note: note, time: new Date().toLocaleString() });
                saveStockLogs(logs);
                localStorage.setItem('inventory', JSON.stringify(inventory));
                if (window.BitableAPI) { window.BitableAPI.updateInventory(id, item).catch(function(){}); }
                window.closeModal();
                renderInventoryTable();
                renderDashboard();
            };
        }
    };

    // Dedicated subcategory add button (same as addInventoryStock but with explicit UI label)
    window.addInventorySubcategory = function(id) {
        window.addInventoryStock(id);
    };

    window.showStockLog = function(id) {
        var inventory = getInventoryData();
        var item = inventory.find(function(x) { return x.id === id; });
        if (!item) { alert('产品不存在'); return; }
        var logs = getStockLogs().filter(function(l) { return l.inventoryId === id; });
        var body = '<h4>' + item.name + ' - 库存变动记录</h4>';
        if (logs.length === 0) {
            body += '<p style="color:#999;">暂无变动记录</p>';
        } else {
            body += '<table style="width:100%;"><thead><tr><th>时间</th><th>变动数量</th><th>备注</th></tr></thead><tbody>';
            logs.slice(-50).reverse().forEach(function(l) {
                body += '<tr><td>' + l.time + '</td><td style="color:' + (l.change > 0 ? '#28a745' : '#dc3545') + ';">' + (l.change > 0 ? '+' : '') + l.change + '</td><td>' + (l.note || '-') + '</td></tr>';
            });
            body += '</tbody></table>';
        }
        window.openModal('库存变动记录', body);
        var confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) confirmBtn.style.display = 'none';
        var cancelBtn = document.querySelector('.modal-cancel');
        if (cancelBtn) cancelBtn.textContent = '关闭';
    };

    // ========== 报单导出 ==========
    window.exportOrders = function() {
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        var filterStatus = document.getElementById('orderFilterStatus') && document.getElementById('orderFilterStatus').value || 'all';
        var searchText = (document.getElementById('orderSearch') && document.getElementById('orderSearch').value || '').toLowerCase();
        var filtered = orders;
        if (isPromotionManager()) {
            var myNames = getAssignedCustomerNames();
            filtered = filtered.filter(function(o) { return myNames.indexOf(o.customer) >= 0; });
        }
        if (searchText) {
            filtered = filtered.filter(function(o) {
                return (o.company || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (o.customer || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (o.school || '').toLowerCase().indexOf(searchText) >= 0 ||
                    (o.name || '').toLowerCase().indexOf(searchText) >= 0;
            });
        }
        if (filterStatus !== 'all') {
            filtered = filtered.filter(function(o) { return o.status === filterStatus; });
        }
        if (filtered.length === 0) { alert('没有匹配的报单数据'); return; }
        var csv = '\uFEFF报单时间,公司名称,客户名称,学校名称,产品系列,产品名称,年级,科目,册次,版本,定价,学用数量,教师学用数量,合计数量,教用数量,金额,发货渠道,发货地址,发货状态\n';
        filtered.forEach(function(o) {
            var tot = o.totalQty || (o.studentQty||0)+(o.teacherQty||0);
            csv += [o.orderTime||'', o.company||'', o.customer||'', o.school||'', o.series||'', o.name||'',
                    o.grade||'', o.subject||'', o.volume||'', o.version||'', o.price||0, o.studentQty||0,
                    o.teacherQty||0, tot, o.teachingQty||0, o.amount||0, o.channel||'',
                    o.address||'', o.status||''].join(',') + '\n';
        });
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '报单导出_' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // ========== 库存联动计算 ==========
    function updateInventoryFromOrders() {
        var inventory = getInventoryData();
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        var changed = false;
        inventory.forEach(function(item) {
            var key = (item.series||'') + '|' + (item.name||'') + '|' + (item.subject||'') + '|' + (item.volume||'');
            var productOrders = orders.filter(function(o) {
                return ((o.series||'') + '|' + (o.name||'') + '|' + (o.subject||'') + '|' + (o.volume||'')) === key;
            });
            var original = item.originalQty || item.quantity || 0;
            var orderedQty = productOrders.reduce(function(s, o) { return s + (o.totalQty || (o.studentQty||0)+(o.teacherQty||0)); }, 0);
            var shippedQty = productOrders.filter(function(o) { return o.status === '已发货'; }).reduce(function(s, o) { return s + (o.totalQty || (o.studentQty||0)+(o.teacherQty||0)); }, 0);
            var newTheory = Math.max(0, original - orderedQty);
            var newActual = Math.max(0, original - shippedQty);
            if (item.theoryQty !== newTheory || item.actualQty !== newActual) {
                item.theoryQty = newTheory;
                item.actualQty = newActual;
                changed = true;
            }
        });
        if (changed) localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    // ========== 客户报单明细 ==========
    window.showCustomerOrders = function(customerName) {
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        var custOrders = orders.filter(function(o) { return o.customer === customerName; });
        custOrders.sort(function(a, b) { return (a.orderTime || '') < (b.orderTime || '') ? 1 : -1; });
        var body = '<h4>' + customerName + ' - 报单明细 (' + custOrders.length + '条)</h4>';
        if (custOrders.length === 0) {
            body += '<p style="color:#999;">暂无报单记录</p>';
        } else {
            body += '<table style="width:100%;font-size:12px;"><thead><tr><th>时间</th><th>学校</th><th>产品</th><th>科目</th><th>数量</th><th>金额</th><th>状态</th></tr></thead><tbody>';
            custOrders.forEach(function(o) {
                var tot = o.totalQty || (o.studentQty||0)+(o.teacherQty||0);
                body += '<tr><td>' + (o.orderTime || '-') + '</td><td>' + (o.school || '-') + '</td><td>' + (o.name || '-') + '</td><td>' + (o.subject || '-') + '</td><td>' + tot + '</td><td>A' + parseFloat(o.amount||0).toFixed(2) + '</td><td>' + (o.status || '-') + '</td></tr>';
            });
            body += '</tbody></table>';
        }
        window.openModal('客户报单明细', body);
        var confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) confirmBtn.style.display = 'none';
        var cancelBtn = document.querySelector('.modal-cancel');
        if (cancelBtn) cancelBtn.textContent = '关闭';
    };


    function renderOrdersTable(data) {
        if (!data) data = JSON.parse(localStorage.getItem('orders') || '[]');
        var tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="21" style="text-align:center;color:#999;">暂无报单数据</td></tr>';
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
            tbody.innerHTML = '<tr><td colspan="21" style="text-align:center;color:#999;">无匹配报单数据</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(item) {
            var sQty = item.studentQty || 0;
            var tQty = item.teacherQty || 0;
            var tot = sQty + tQty;
            var amt = item.amount || 0;
            return '<tr>' +
                '<td class="sticky-col col-time">' + (item.orderTime || '-') + '</td>' +
                '<td class="sticky-col col-company">' + (item.company || '-') + '</td>' +
                '<td class="sticky-col col-customer">' + (item.customer || '-') + '</td>' +
                '<td class="sticky-col col-school">' + (item.school || '-') + '</td>' +
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
                '<td class="' + (item.status === '已发货' ? 'status-shipped' : '') + '">' + (item.status || '-') + '</td>' +
                '<td class="addr-cell">' + (item.remark || '-') + '</td>' +
                '<td><button class="btn-icon btn-ship" onclick="shipOrder(\'' + item.id + '\')" title="发货">📦</button><button class="btn-icon" onclick="deleteOrder(\'' + item.id + '\')">🗑️</button></td>' +
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
        updateInventoryFromOrders();
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
        if (window.BitableAPI) { window.BitableAPI.deleteInventory(id).catch(function(){}); }
        renderInventoryTable();
        renderDashboard();
    };

    window.openShipmentModal = function(id) {
        var orders = JSON.parse(localStorage.getItem('orders') || '[]');
        var order = orders.find(function(o) { return o.id == id; });
        if (!order) { alert('报单不存在'); return; }
        if (order.status === '已发货') { alert('该报单已发货'); return; }
        var body = '<div style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:12px;">';
        body += '<p><b>公司:</b> ' + (order.company || '-') + ' | <b>客户:</b> ' + (order.customer || '-') + ' | <b>学校:</b> ' + (order.school || '-') + '</p>';
        body += '<p><b>产品:</b> ' + (order.name || '-') + ' | <b>科目:</b> ' + (order.subject || '-') + ' | <b>册次:</b> ' + (order.volume || '-') + '</p>';
        body += '<p><b>数量:</b> ' + (order.totalQty || ((order.studentQty||0)+(order.teacherQty||0))) + '册 | <b>金额:</b> ¥' + parseFloat(order.amount || 0).toFixed(2) + '</p>';
        body += '<p><b>渠道:</b> ' + (order.channel || '-') + ' | <b>地址:</b> ' + (order.address || '-') + '</p>';
        body += '<p><b>当前状态:</b> <span style="color:orange;">' + (order.status || '未发货') + '</span></p>';
        body += '</div>';
        body += '<div class="form-group"><label>备注</label><input type="text" id="shipmentNote" placeholder="发货备注" style="width:100%;padding:8px;"></div>';
        body += '<p style="color:#666;font-size:13px;">确认后将状态改为 <b style="color:green;">已发货</b></p>';
        window.openModal('确认发货', body);
        var confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.style.background = '#28a745';
            confirmBtn.textContent = '确认发货';
            confirmBtn.onclick = function() {
                var note = document.getElementById('shipmentNote').value || '';
                orders.forEach(function(item) {
                    if (item.id == id) {
                        item.status = '已发货';
                        item.shippingStatus = '已发货';
                        item.shipTime = new Date().toISOString();
                        item.shipNote = note;
                    }
                });
                localStorage.setItem('orders', JSON.stringify(orders));
                if (window.BitableAPI) { window.BitableAPI.updateOrder(id, order).catch(function(){}); }
                window.closeModal();
                updateInventoryFromOrders();
                renderOrdersTable();
                renderDashboard();
            };
        }
    };

    window.shipOrder = function(id) {
        window.openShipmentModal(id);
    };

    window.deleteOrder = function(id) {
        if (!confirm('确定要删除这条报单记录吗？')) return;
        var orders = JSON.parse(localStorage.getItem('orders') || '[]').filter(function(item) { return item.id != id; });
        localStorage.setItem('orders', JSON.stringify(orders));
        if (window.BitableAPI) { window.BitableAPI.deleteOrder(id).catch(function(){}); }
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
        updateInventoryFromOrders();
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
            // 同步更新运行时配置
            if (window.FEISHU_BITABLE) {
                window.FEISHU_BITABLE.appId = config.appId;
                window.FEISHU_BITABLE.appSecret = config.appSecret;
                window.FEISHU_BITABLE.appToken = config.appToken;
                window.FEISHU_BITABLE.tables.inventory = config.inventoryTable;
                window.FEISHU_BITABLE.tables.orders = config.ordersTable;
                window.FEISHU_BITABLE.tables.customers = config.customersTable;
            }
            alert('飞书配置已保存！');
        });
    }

    // 测试飞书连接
    var testFeishuBtn = document.getElementById('testFeishuConnection');
    if (testFeishuBtn) {
        testFeishuBtn.addEventListener('click', function() {
            var cfg = window.FEISHU_BITABLE || JSON.parse(localStorage.getItem('feishuConfig') || '{}');
            if (!cfg.appId || !cfg.appSecret) {
                alert('请先填写 App ID 和 App Secret');
                return;
            }
            testFeishuBtn.disabled = true;
            testFeishuBtn.textContent = '连接中...';
            fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ app_id: cfg.appId, app_secret: cfg.appSecret })
            }).then(function(r) { return r.json(); }).then(function(data) {
                if (data.code === 0) {
                    var token = data.tenant_access_token;
                    // 进一步测试获取表列表
                    return fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/' + cfg.appToken + '/tables', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    }).then(function(r2) { return r2.json(); }).then(function(tdata) {
                        if (tdata.code === 0) {
                            var names = tdata.data.items.map(function(t) { return t.name; }).join(', ');
                            alert('连接成功！\nToken 获取: OK\n多维表格表: ' + names);
                        } else {
                            alert('连接成功！Token OK，但访问多维表格失败: ' + tdata.msg + ' (code=' + tdata.code + ')\n请检查 App Token 和权限');
                        }
                    });
                } else {
                    alert('连接失败！\n错误码: ' + data.code + '\n错误信息: ' + data.msg);
                }
            }).catch(function(err) {
                alert('网络请求失败: ' + err.message);
            }).finally(function() {
                testFeishuBtn.disabled = false;
                testFeishuBtn.textContent = '测试连接';
            });
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

    // 加载飞书配置（localStorage优先，然后fallback到默认配置）
    var feishuCfg = JSON.parse(localStorage.getItem('feishuConfig') || '{}');
    var defaultCfg = (window.FEISHU_BITABLE || {});
    var defaultTables = defaultCfg.tables || {};
    document.getElementById('feishuAppId').value = feishuCfg.appId || defaultCfg.appId || '';
    document.getElementById('feishuAppSecret').value = feishuCfg.appSecret || defaultCfg.appSecret || '';
    document.getElementById('feishuAppToken').value = feishuCfg.appToken || defaultCfg.appToken || '';
    document.getElementById('feishuInventoryTable').value = feishuCfg.inventoryTable || defaultTables.inventory || '';
    document.getElementById('feishuOrdersTable').value = feishuCfg.ordersTable || defaultTables.orders || '';
    document.getElementById('feishuCustomersTable').value = feishuCfg.customersTable || defaultTables.customers || '';


    // ==================== 多产品报单表单 ====================
    window.openMultiOrderForm = function() {
        var companies = getCompanies();
        var channels = getChannels();
        var coOpts = companies.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
        var chOpts = channels.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');

        // Build datalist from existing customers
        var customers = getCustomers();
        var custNames = customers.map(function(c) { return c.name; }).sort(function(a,b){return a.localeCompare(b,'zh-CN');});

        var formHTML =
            '<form id="multiOrderForm">' +
            '<div class="form-row"><div class="form-group"><label>报单时间</label><input type="date" id="m_orderTime" value="' + getTodayDate() + '" style="width:200px"></div></div>' +
            '<div class="form-row">' +
            '<div class="form-group flex-1"><label>公司名称 <span style="color:red;">*</span></label><div class="select-add-row"><select id="m_orderCompany" required><option value="">请选择公司</option>' + coOpts + '</select><button type="button" class="btn btn-sm btn-outline" id="addNewCompany">+ 新增</button></div></div>' +
            '<div class="form-group flex-1"><label>客户名称 <span style="color:red;">*</span></label><input type="text" id="m_orderCustomer" required placeholder="输入客户名称" list="m_custList"><datalist id="m_custList">' + custNames.map(function(n){return '<option value="'+n+'">';}).join('') + '</datalist></div>' +
            '</div>' +
            '<div class="form-group"><label>学校名称 <span style="color:red;">*</span></label><input type="text" id="m_orderSchool" required placeholder="输入学校名称"></div>' +
            '<hr style="margin:12px 0;"><div style="display:flex;justify-content:space-between;align-items:center;"><h4 style="margin:0;">产品明细</h4><button type="button" class="btn btn-sm btn-success" id="m_addProductRow">+ 添加产品行</button></div>' +
            '<div id="m_productRows"><div class="product-multi-row" data-row="0" style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;background:#fafafa;">' +
            '<div class="form-row">' +
            '<div class="form-group"><label>产品系列</label><select class="m_series"><option value="">选择系列</option></select></div>' +
            '<div class="form-group"><label>产品名称</label><select class="m_product"><option value="">选择产品</option></select></div>' +
            '<div class="form-group"><label>年级</label><select class="m_grade"><option value="">选择</option></select></div>' +
            '<div class="form-group"><label>科目</label><select class="m_subject"><option value="">选择</option></select></div>' +
            '<div class="form-group"><label>册次</label><select class="m_volume"><option value="">选择</option></select></div>' +
            '<div class="form-group"><label>版本</label><select class="m_version"><option value="">选择</option></select></div>' +
            '<div class="form-group"><label>定价</label><input type="number" class="m_price" value="0" step="0.01" style="width:80px;"></div></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>学用数量</label><input type="number" class="m_studentQty" value="0" min="0" style="width:80px;"></div>' +
            '<div class="form-group"><label>教师学用</label><input type="number" class="m_teacherQty" value="0" min="0" style="width:90px;"></div>' +
            '<div class="form-group"><label>教用数量</label><input type="number" class="m_teachingQty" value="0" min="0" style="width:80px;"></div>' +
            '<div class="form-group"><label>合计</label><span class="m_rowTotal" style="font-weight:bold;">0</span></div>' +
            '<div class="form-group"><label>金额</label><span class="m_rowAmount" style="font-weight:bold;">¥0</span></div>' +
            '<div class="form-group"><button type="button" class="btn btn-sm btn-danger m_removeRow">✕</button></div></div></div></div>' +
            '<hr style="margin:12px 0;"><div style="font-size:16px;">总计: <b id="m_grandQty" style="color:#28a745;">0</b> 册 | 金额: <b id="m_grandAmt" style="color:#28a745;">¥0</b></div>' +
            '<div class="form-section-title">发货信息</div>' +
            '<div class="form-row">' +
            '<div class="form-group flex-1"><label>发货渠道</label><div class="select-add-row"><select id="m_orderChannel"><option value="">选择渠道</option>' + chOpts + '</select><button type="button" class="btn btn-sm btn-outline" id="addNewChannel">+ 新增</button></div></div>' +
            '<div class="form-group flex-1"><label>发货状态</label><select id="m_orderStatus"><option value="已报">已报</option><option value="待发货" selected>待发货</option><option value="等通知发货">等通知发货</option></select></div>' +
            '<div class="form-group flex-1"><label>发货地址</label><input type="text" id="m_orderAddress" placeholder="收货地址"></div></div>' +
            '<div class="form-group"><label>备注</label><input type="text" id="m_orderRemark" placeholder="备注信息"></div>' +
            '</form>';

        window.openModal('添加报单（多产品）', formHTML);

        // Populate cascades after DOM renders
        setTimeout(function() {
            var inventory = getInventoryData();
            // Build cascade hierarchy
            var hier = {};
            inventory.forEach(function(item) {
                if (!item.series) return;
                if (!hier[item.series]) hier[item.series] = {};
                if (!hier[item.series][item.name || '']) hier[item.series][item.name || ''] = {};
                var gkey = (item.grade || '');
                if (!hier[item.series][item.name || ''][gkey]) hier[item.series][item.name || ''][gkey] = {};
                var skey = (item.subject || '');
                if (!hier[item.series][item.name || ''][gkey][skey]) hier[item.series][item.name || ''][gkey][skey] = [];
                hier[item.series][item.name || ''][gkey][skey].push({
                    volume: item.volume || '',
                    version: item.version || '',
                    price: item.price || 0
                });
            });

            var sortedKeys = function(obj) {
                return Object.keys(obj).sort(function(a,b){return a.localeCompare(b,'zh-CN');});
            };

            function setupRowCascades(row) {
                var seriesSel = row.querySelector('.m_series');
                sortedKeys(hier).forEach(function(s) {
                    var o = document.createElement('option'); o.value = s; o.textContent = s; seriesSel.appendChild(o);
                });
                seriesSel.addEventListener('change', function() {
                    var prodSel = row.querySelector('.m_product');
                    prodSel.innerHTML = '<option value="">选择产品</option>';
                    var prods = hier[seriesSel.value] || {};
                    sortedKeys(prods).forEach(function(p) {
                        var o = document.createElement('option'); o.value = p; o.textContent = p; prodSel.appendChild(o);
                    });
                    clearFrom(row, '.m_grade');
                    updateRowCalc(row);
                });
                row.querySelector('.m_product').addEventListener('change', function() {
                    var prodData = (hier[seriesSel.value] || {})[row.querySelector('.m_product').value] || {};
                    var gradeSel = row.querySelector('.m_grade');
                    gradeSel.innerHTML = '<option value="">选择</option>';
                    sortedKeys(prodData).forEach(function(g) {
                        var o = document.createElement('option'); o.value = g; o.textContent = g; gradeSel.appendChild(o);
                    });
                    clearFrom(row, '.m_subject');
                    updateRowCalc(row);
                });
                row.querySelector('.m_grade').addEventListener('change', function() {
                    var prodData = (hier[seriesSel.value] || {})[row.querySelector('.m_product').value] || {};
                    var subjData = prodData[row.querySelector('.m_grade').value] || {};
                    var subjSel = row.querySelector('.m_subject');
                    subjSel.innerHTML = '<option value="">选择</option>';
                    sortedKeys(subjData).forEach(function(s) {
                        var o = document.createElement('option'); o.value = s; o.textContent = s; subjSel.appendChild(o);
                    });
                    clearFrom(row, '.m_volume');
                    updateRowCalc(row);
                });
                row.querySelector('.m_subject').addEventListener('change', function() {
                    var prodData = (hier[seriesSel.value] || {})[row.querySelector('.m_product').value] || {};
                    var gradeData = prodData[row.querySelector('.m_grade').value] || {};
                    var items = gradeData[row.querySelector('.m_subject').value] || [];
                    var volSel = row.querySelector('.m_volume');
                    volSel.innerHTML = '<option value="">选择</option>';
                    var seenV = {};
                    items.forEach(function(it) { if (!seenV[it.volume]) { seenV[it.volume]=true; var o=document.createElement('option');o.value=it.volume;o.textContent=it.volume;volSel.appendChild(o); } });
                    updateRowCalc(row);
                });
                row.querySelector('.m_volume').addEventListener('change', function() {
                    var prodData = (hier[seriesSel.value] || {})[row.querySelector('.m_product').value] || {};
                    var gradeData = prodData[row.querySelector('.m_grade').value] || {};
                    var items = gradeData[row.querySelector('.m_subject').value] || [];
                    var vol = row.querySelector('.m_volume').value;
                    var verSel = row.querySelector('.m_version');
                    verSel.innerHTML = '<option value="">选择</option>';
                    items.filter(function(it){return it.volume===vol;}).forEach(function(it){
                        var o = document.createElement('option'); o.value = it.version; o.textContent = it.version; verSel.appendChild(o);
                    });
                    updateRowCalc(row);
                });
                row.querySelector('.m_version').addEventListener('change', function() {
                    var prodData = (hier[seriesSel.value] || {})[row.querySelector('.m_product').value] || {};
                    var gradeData = prodData[row.querySelector('.m_grade').value] || {};
                    var items = gradeData[row.querySelector('.m_subject').value] || [];
                    var vol = row.querySelector('.m_volume').value;
                    var ver = row.querySelector('.m_version').value;
                    var match = items.find(function(it){return it.volume===vol && it.version===ver;});
                    if (match) row.querySelector('.m_price').value = match.price;
                    updateRowCalc(row);
                });
                ['m_studentQty','m_teacherQty','m_price'].forEach(function(cls){
                    row.querySelector('.'+cls).addEventListener('input', function(){ updateRowCalc(row); });
                });
            }

            function clearFrom(row, startCls) {
                var order = ['m_grade','m_subject','m_volume','m_version'];
                var found = false;
                order.forEach(function(cls) {
                    if (cls === startCls.replace('.','')) found = true;
                    if (found) {
                        var el = row.querySelector(startCls.charAt(0)==='.'?'.'+cls:'#'+cls);
                        if (el && el.tagName === 'SELECT') el.innerHTML = '<option value="">选择</option>';
                    }
                });
            }

            function updateRowCalc(row) {
                var sq = parseInt(row.querySelector('.m_studentQty').value) || 0;
                var tq = parseInt(row.querySelector('.m_teacherQty').value) || 0;
                var tot = sq + tq;
                var pr = parseFloat(row.querySelector('.m_price').value) || 0;
                row.querySelector('.m_rowTotal').textContent = tot;
                row.querySelector('.m_rowAmount').textContent = '¥' + (tot * pr).toFixed(2);
                updateGrandCalc();
            }

            function updateGrandCalc() {
                var rows = document.querySelectorAll('.product-multi-row');
                var gq = 0, ga = 0;
                rows.forEach(function(r) {
                    gq += parseInt(r.querySelector('.m_rowTotal').textContent) || 0;
                    var at = r.querySelector('.m_rowAmount').textContent.replace('¥','');
                    ga += parseFloat(at) || 0;
                });
                var ge = document.getElementById('m_grandQty');
                var ae = document.getElementById('m_grandAmt');
                if (ge) ge.textContent = gq;
                if (ae) ae.textContent = '¥' + ga.toFixed(2);
            }

            // Setup first row
            var firstRow = document.querySelector('.product-multi-row');
            if (firstRow) setupRowCascades(firstRow);

            // Add product row button
            var addRowBtn = document.getElementById('m_addProductRow');
            if (addRowBtn) {
                addRowBtn.addEventListener('click', function() {
                    var container = document.getElementById('m_productRows');
                    var newRow = document.createElement('div');
                    newRow.className = 'product-multi-row';
                    newRow.style.cssText = 'border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;background:#fafafa;';
                    newRow.innerHTML = '<div class="form-row">' +
                        '<div class="form-group"><label>产品系列</label><select class="m_series"><option value="">选择系列</option></select></div>' +
                        '<div class="form-group"><label>产品名称</label><select class="m_product"><option value="">选择产品</option></select></div>' +
                        '<div class="form-group"><label>年级</label><select class="m_grade"><option value="">选择</option></select></div>' +
                        '<div class="form-group"><label>科目</label><select class="m_subject"><option value="">选择</option></select></div>' +
                        '<div class="form-group"><label>册次</label><select class="m_volume"><option value="">选择</option></select></div>' +
                        '<div class="form-group"><label>版本</label><select class="m_version"><option value="">选择</option></select></div>' +
                        '<div class="form-group"><label>定价</label><input type="number" class="m_price" value="0" step="0.01" style="width:80px;"></div></div>' +
                        '<div class="form-row">' +
                        '<div class="form-group"><label>学用数量</label><input type="number" class="m_studentQty" value="0" min="0" style="width:80px;"></div>' +
                        '<div class="form-group"><label>教师学用</label><input type="number" class="m_teacherQty" value="0" min="0" style="width:90px;"></div>' +
                        '<div class="form-group"><label>教用数量</label><input type="number" class="m_teachingQty" value="0" min="0" style="width:80px;"></div>' +
                        '<div class="form-group"><label>合计</label><span class="m_rowTotal" style="font-weight:bold;">0</span></div>' +
                        '<div class="form-group"><label>金额</label><span class="m_rowAmount" style="font-weight:bold;">¥0</span></div>' +
                        '<div class="form-group"><button type="button" class="btn btn-sm btn-danger m_removeRow">✕</button></div></div>';
                    container.appendChild(newRow);
                    setupRowCascades(newRow);
                    newRow.querySelector('.m_removeRow').addEventListener('click', function() {
                        if (container.querySelectorAll('.product-multi-row').length <= 1) { alert('至少保留一个产品行'); return; }
                        newRow.remove();
                        updateGrandCalc();
                    });
                    updateGrandCalc();
                });
            }

            // Add company/channel buttons
            var addCompBtn = document.getElementById('addNewCompany');
            if (addCompBtn) addCompBtn.addEventListener('click', function() {
                var n = prompt('请输入新公司名称：'); if (!n||!n.trim()) return;
                var list = getCompanies(); if (list.indexOf(n.trim())===-1) { list.push(n.trim()); saveCompanies(list); }
                var sel = document.getElementById('m_orderCompany');
                var o = document.createElement('option'); o.value = n.trim(); o.textContent = n.trim(); o.selected = true; sel.appendChild(o);
            });
            var addChBtn = document.getElementById('addNewChannel');
            if (addChBtn) addChBtn.addEventListener('click', function() {
                var n = prompt('请输入新发货渠道：'); if (!n||!n.trim()) return;
                var list = getChannels(); if (list.indexOf(n.trim())===-1) { list.push(n.trim()); saveChannels(list); }
                var sel = document.getElementById('m_orderChannel');
                var o = document.createElement('option'); o.value = n.trim(); o.textContent = n.trim(); o.selected = true; sel.appendChild(o);
            });
        }, 100);

        // Confirm button
        var confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = function() {
                var orderTime = document.getElementById('m_orderTime').value || getTodayDate();
                var company = document.getElementById('m_orderCompany').value.trim();
                var customer = document.getElementById('m_orderCustomer').value.trim();
                var school = document.getElementById('m_orderSchool').value.trim();
                var channel = document.getElementById('m_orderChannel').value.trim();
                var address = document.getElementById('m_orderAddress').value.trim();
                var status = document.getElementById('m_orderStatus').value;
                var remark = document.getElementById('m_orderRemark').value.trim();

                if (!company) { alert('请选择公司'); return; }
                if (!customer) { alert('请输入客户名称'); return; }
                if (!school) { alert('请输入学校名称'); return; }

                var rows = document.querySelectorAll('.product-multi-row');
                var products = [];
                rows.forEach(function(row) {
                    var name = row.querySelector('.m_product').value;
                    if (!name) return;
                    var sq = parseInt(row.querySelector('.m_studentQty').value) || 0;
                    var tq = parseInt(row.querySelector('.m_teacherQty').value) || 0;
                    var tot = sq + tq;
                    if (tot <= 0) return;
                    products.push({
                        series: row.querySelector('.m_series').value,
                        name: name,
                        grade: row.querySelector('.m_grade').value,
                        subject: row.querySelector('.m_subject').value,
                        volume: row.querySelector('.m_volume').value,
                        version: row.querySelector('.m_version').value,
                        price: parseFloat(row.querySelector('.m_price').value) || 0,
                        studentQty: sq,
                        teacherQty: tq,
                        totalQty: tot,
                        teachingQty: parseInt(row.querySelector('.m_teachingQty').value) || 0,
                        amount: (tot * (parseFloat(row.querySelector('.m_price').value) || 0)).toFixed(2)
                    });
                });
                if (products.length === 0) { alert('请至少添加一个有效产品行'); return; }

                // Save company
                var comps = getCompanies();
                if (company && comps.indexOf(company) === -1) { comps.push(company); saveCompanies(comps); }
                // Save customer
                var custs = getCustomers();
                var cr = custs.find(function(c){return c.name===customer;});
                if (!cr) {
                    var cu = getCurrentUser();
                    cr = { id: 'cust_'+Date.now(), name: customer, schools: school?[school]:[], phone:'', assignedTo: (cu&&cu.role==='推广经理')?(cu.displayName||cu.username):'', orderCount: 0, lastOrderTime: orderTime };
                    custs.push(cr);
                } else {
                    if (school && (cr.schools||[]).indexOf(school)<0) { if(!cr.schools)cr.schools=[]; cr.schools.push(school); }
                    cr.lastOrderTime = orderTime;
                }
                saveCustomers(custs);

                // Create orders
                var allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                var added = 0;
                products.forEach(function(prod) {
                    var order = {
                        id: 'o_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
                        orderTime: orderTime,
                        company: company, customer: customer, school: school,
                        series: prod.series, name: prod.name, grade: prod.grade,
                        subject: prod.subject, volume: prod.volume, version: prod.version,
                        price: prod.price,
                        studentQty: prod.studentQty, teacherQty: prod.teacherQty,
                        totalQty: prod.totalQty, amount: prod.amount,
                        teachingQty: prod.teachingQty,
                        channel: channel, address: address,
                        status: status || '待发货',
                        shippingStatus: '未发货',
                        remark: remark,
                        createdBy: getCurrentUser() ? getCurrentUser().username : '',
                        createdAt: new Date().toISOString()
                    };
                    allOrders.push(order);
                    if (window.BitableAPI) { window.BitableAPI.createOrder(order).catch(function(){}); }
                    added++;
                });
                localStorage.setItem('orders', JSON.stringify(allOrders));
                alert('报单添加成功！共 ' + added + ' 个产品');
                window.closeModal();
                updateInventoryFromOrders();
                renderOrdersTable();
                renderCustomersTable();
                renderDashboard();
            };
        }
    };

    // ==================== 册次报订间隔设置 ====================
    function getVolumeIntervals() {
        return JSON.parse(localStorage.getItem('volumeIntervals') || '[]');
    }
    function saveVolumeIntervals(list) {
        localStorage.setItem('volumeIntervals', JSON.stringify(list));
    }

    function renderVolumeIntervals() {
        var tbody = document.getElementById('volumeIntervalTableBody');
        if (!tbody) return;
        var intervals = getVolumeIntervals();
        if (intervals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;">暂无间隔设置</td></tr>';
            return;
        }
        tbody.innerHTML = intervals.map(function(vi) {
            return '<tr>' +
                '<td>' + (vi.school || '全部学校') + '</td>' +
                '<td>' + (vi.series || '全部系列') + '</td>' +
                '<td>' + (vi.product || '全部产品') + '</td>' +
                '<td>' + (vi.subject || '全部科目') + '</td>' +
                '<td>' + vi.days + ' 天</td>' +
                '<td>' + (vi.isDefault ? '✅ 是' : '否') + '</td>' +
                '<td>' + (vi.note || '-') + '</td>' +
                '<td><button class="btn-icon" onclick="window.editVolumeInterval(\'' + vi.id + '\')">✏️</button><button class="btn-icon" onclick="window.deleteVolumeInterval(\'' + vi.id + '\')">🗑️</button></td></tr>';
        }).join('');
    }

    // Add volume interval button
    var addVIbtn = document.getElementById('addVolumeInterval');
    if (addVIbtn) {
        addVIbtn.addEventListener('click', function() {
            var customers = getCustomers();
            var schools = [];
            customers.forEach(function(c) { if (c.schools) c.schools.forEach(function(s) { if (schools.indexOf(s)<0) schools.push(s); }); });
            schools.sort(function(a,b){return a.localeCompare(b,'zh-CN');});
            var body = '<div class="form-group"><label>学校</label><select id="viSchool"><option value="">全部学校（默认规则）</option>' +
                schools.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('') + '</select></div>';
            body += '<div class="form-group"><label>产品系列</label><select id="viSeries"><option value="">全部系列</option></select></div>';
            body += '<div class="form-group"><label>产品名称</label><select id="viProduct"><option value="">全部产品</option></select></div>';
            body += '<div class="form-group"><label>科目</label><select id="viSubject"><option value="">全部科目</option></select></div>';
            body += '<div class="form-group"><label>间隔天数 <span style="color:red;">*</span></label><input type="number" id="viDays" value="45" min="1" style="width:100px;"></div>';
            body += '<div class="form-group"><label>设为默认规则</label><label style="margin-left:8px;"><input type="checkbox" id="viIsDefault"> 是（优先级最低）</label></div>';
            body += '<div class="form-group"><label>备注</label><input type="text" id="viNote" placeholder="可选">';
            window.openModal('添加册次间隔规则', body);
            var confirmBtn = document.querySelector('.modal-confirm');
            if (confirmBtn) {
                confirmBtn.onclick = function() {
                    var days = parseInt(document.getElementById('viDays').value) || 45;
                    var intervals = getVolumeIntervals();
                    intervals.push({
                        id: 'vi_'+Date.now(),
                        school: document.getElementById('viSchool').value,
                        series: document.getElementById('viSeries').value,
                        product: document.getElementById('viProduct').value,
                        subject: document.getElementById('viSubject').value,
                        days: days,
                        isDefault: document.getElementById('viIsDefault').checked,
                        note: document.getElementById('viNote').value
                    });
                    saveVolumeIntervals(intervals);
                    window.closeModal();
                    renderVolumeIntervals();
                };
            }
        });
    }

    window.editVolumeInterval = function(id) {
        var intervals = getVolumeIntervals();
        var vi = intervals.find(function(v){return v.id===id;});
        if (!vi) return;
        var body = '<div class="form-group"><label>学校</label><input type="text" id="viSchool" value="'+ (vi.school||'') +'"></div>';
        body += '<div class="form-group"><label>间隔天数</label><input type="number" id="viDays" value="'+ vi.days +'" min="1"></div>';
        body += '<div class="form-group"><label>备注</label><input type="text" id="viNote" value="'+ (vi.note||'') +'"></div>';
        window.openModal('编辑间隔规则', body);
        var confirmBtn = document.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = function() {
                vi.school = document.getElementById('viSchool').value;
                vi.days = parseInt(document.getElementById('viDays').value) || vi.days;
                vi.note = document.getElementById('viNote').value;
                saveVolumeIntervals(intervals);
                window.closeModal();
                renderVolumeIntervals();
            };
        }
    };

    window.deleteVolumeInterval = function(id) {
        if (!confirm('确定删除该间隔规则？')) return;
        var intervals = getVolumeIntervals().filter(function(v){return v.id!==id;});
        saveVolumeIntervals(intervals);
        renderVolumeIntervals();
    };

    // Initialize volume intervals on settings page load
    var settingsPage = document.getElementById('settingsPage');
    if (settingsPage) {
        var settingsObserver = new MutationObserver(function() {
            if (settingsPage.classList.contains('active')) {
                renderVolumeIntervals();
            }
        });
        settingsObserver.observe(settingsPage, { attributes: true, attributeFilter: ['class'] });
    }

    // ==================== 报订规律分析 ====================
    var analyzeBtn = document.getElementById('analyzePatternBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            var orders = JSON.parse(localStorage.getItem('orders') || '[]');
            if (orders.length === 0) { alert('暂无报单数据'); return; }
            
            var intervals = getVolumeIntervals();
            // Build lookup: school -> key -> days
            var intervalMap = {};
            intervals.forEach(function(vi) {
                var sch = vi.school || '';
                var key = (vi.series||'') + '|' + (vi.product||'') + '|' + (vi.subject||'');
                if (!intervalMap[sch]) intervalMap[sch] = {};
                intervalMap[sch][key] = vi.days;
            });

            // Group orders by school + series + product + subject + volume
            var patterns = {};
            orders.forEach(function(o) {
                var sch = o.school || '未知学校';
                var key = sch + '|' + (o.series||'') + '|' + (o.name||'') + '|' + (o.subject||'') + '|' + (o.volume||'');
                if (!patterns[key]) patterns[key] = { school: sch, series: o.series, product: o.name, subject: o.subject, volume: o.volume, dates: [], qty: 0 };
                patterns[key].dates.push(o.orderTime || '');
                patterns[key].qty += (o.totalQty || ((o.studentQty||0)+(o.teacherQty||0)));
            });

            // Calculate average intervals
            var results = [];
            Object.keys(patterns).forEach(function(key) {
                var p = patterns[key];
                p.dates.sort();
                var intervals_days = [];
                for (var i = 1; i < p.dates.length; i++) {
                    var d1 = new Date(p.dates[i-1]);
                    var d2 = new Date(p.dates[i]);
                    if (!isNaN(d1) && !isNaN(d2)) {
                        intervals_days.push(Math.round((d2 - d1) / 86400000));
                    }
                }
                var avgInterval = 0;
                if (intervals_days.length > 0) {
                    avgInterval = Math.round(intervals_days.reduce(function(a,b){return a+b;},0) / intervals_days.length);
                }
                // Find configured interval
                var intKey = (p.series||'') + '|' + (p.product||'') + '|' + (p.subject||'');
                var configDays = (intervalMap[p.school] && intervalMap[p.school][intKey]) || 
                                (intervalMap[''] && intervalMap[''][intKey]) || 45;
                // Predict next order
                var lastDate = p.dates.length > 0 ? new Date(p.dates[p.dates.length-1]) : new Date();
                var nextPred = new Date(lastDate.getTime() + avgInterval * 86400000);
                var daysUntil = Math.round((nextPred - new Date()) / 86400000);
                var status = daysUntil < 0 ? '已逾期' : (daysUntil <= 7 ? '即将到期' : (daysUntil <= 30 ? '预警' : '正常'));

                results.push({
                    school: p.school,
                    series: p.series,
                    product: p.product,
                    subject: p.subject,
                    volume: p.volume,
                    orderCount: p.dates.length,
                    totalQty: p.qty,
                    avgInterval: avgInterval,
                    configDays: configDays,
                    lastOrder: p.dates[p.dates.length-1],
                    nextPred: nextPred.toISOString().slice(0,10),
                    daysUntil: daysUntil,
                    status: status
                });
            });

            // Sort by urgency
            results.sort(function(a,b){ return a.daysUntil - b.daysUntil; });

            var resultDiv = document.getElementById('orderingPatternResult');
            if (!resultDiv) return;

            var html = '<div style="margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap;">' +
                '<div class="stat-card" style="flex:1;min-width:120px;"><h4>分析对象</h4><p style="font-size:20px;font-weight:bold;">' + results.length + '</p><small>报订规律条目</small></div>' +
                '<div class="stat-card" style="flex:1;min-width:120px;"><h4>已逾期</h4><p style="font-size:20px;font-weight:bold;color:#dc3545;">' + results.filter(function(r){return r.status==='已逾期';}).length + '</p><small>需立即跟进</small></div>' +
                '<div class="stat-card" style="flex:1;min-width:120px;"><h4>即将到期</h4><p style="font-size:20px;font-weight:bold;color:#ffc107;">' + results.filter(function(r){return r.status==='即将到期';}).length + '</p><small>7天内到期</small></div>' +
                '<div class="stat-card" style="flex:1;min-width:120px;"><h4>预警</h4><p style="font-size:20px;font-weight:bold;color:#fd7e14;">' + results.filter(function(r){return r.status==='预警';}).length + '</p><small>30天内到期</small></div></div>';

            html += '<table class="data-table" style="font-size:12px;"><thead><tr><th>学校</th><th>系列</th><th>产品</th><th>科目</th><th>册次</th><th>报单次数</th><th>平均间隔(天)</th><th>设定间隔</th><th>最近报单</th><th>预计下次</th><th>距今天数</th><th>状态</th></tr></thead><tbody>';
            results.forEach(function(r) {
                var statusCls = r.status === '已逾期' ? '#dc3545' : (r.status === '即将到期' ? '#ffc107' : (r.status === '预警' ? '#fd7e14' : '#28a745'));
                html += '<tr>' +
                    '<td>' + r.school + '</td><td>' + (r.series||'-') + '</td><td>' + (r.product||'-') + '</td>' +
                    '<td>' + (r.subject||'-') + '</td><td>' + (r.volume||'-') + '</td>' +
                    '<td>' + r.orderCount + '</td>' +
                    '<td>' + (r.avgInterval||'--') + '</td>' +
                    '<td>' + r.configDays + '</td>' +
                    '<td>' + (r.lastOrder||'-') + '</td>' +
                    '<td>' + r.nextPred + '</td>' +
                    '<td style="color:' + (r.daysUntil<0?'#dc3545':'') + ';">' + r.daysUntil + '</td>' +
                    '<td><span style="color:' + statusCls + ';font-weight:bold;">' + r.status + '</span></td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
            resultDiv.innerHTML = html;
        });
    }



    // ==================== 飞书企业架构同步 ====================
    window.syncFeishuOrg = function() {
        var cfg = window.FEISHU_BITABLE || JSON.parse(localStorage.getItem('feishuConfig') || '{}');
        if (!cfg.appId || !cfg.appSecret) { alert('请先在设置页配置飞书 App ID 和 App Secret'); return; }
        var proxyUrl = (cfg.proxyUrl || localStorage.getItem('proxyUrl') || '');
        if (!proxyUrl) { alert('请先在设置页配置 CORS 代理地址'); return; }

        // Role mapping rules
        var roleMapping = {
            'regional_manager': { keywords: ['区总', '区域', '区域经理', '大区'], deptLevel: 1 },
            'promotion_manager': { keywords: ['推广', '经理', '销售', '业务'], deptLevel: 2 },
            'customer_service': { keywords: ['客服', '售后', '服务', '支持'], deptLevel: 3 },
            'admin': { keywords: ['管理员', 'admin', '系统'], deptLevel: 0 }
        };

        function guessRole(deptName, userName, isDeptLeader) {
            var name = (deptName + ' ' + userName).toLowerCase();
            if (isDeptLeader) {
                // Department leaders get at least promotion_manager
                if (name.includes('区域') || name.includes('大区')) return 'regional_manager';
                if (name.includes('总') || name.includes('总监')) return 'regional_manager';
                return 'promotion_manager';
            }
            if (name.includes('管理员') || name.includes('admin')) return 'admin';
            if (name.includes('区域') || name.includes('大区')) return 'regional_manager';
            if (name.includes('推广') || name.includes('销售') || name.includes('业务')) return 'promotion_manager';
            if (name.includes('客服') || name.includes('售后') || name.includes('支持')) return 'customer_service';
            return 'promotion_manager'; // default
        }

        function getDeptAndUsers(token, pageToken) {
            return fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://open.feishu.cn/open-apis/contact/v3/departments' +
                        '?page_size=50' + (pageToken ? '&page_token=' + pageToken : ''),
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                })
            }).then(function(r) { return r.json(); });
        }

        function getDeptUsers(token, deptId, pageToken) {
            return fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://open.feishu.cn/open-apis/contact/v3/users/find_by_department' +
                        '?department_id=' + deptId + '&page_size=50' + (pageToken ? '&page_token=' + pageToken : ''),
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                })
            }).then(function(r) { return r.json(); });
        }

        // Simplified: just list all users (no pagination complexity for demo)
        function getAllUsers(token, pageToken) {
            return fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://open.feishu.cn/open-apis/contact/v3/users' +
                        '?page_size=50&user_id_type=open_id&department_id_type=open_department_id' +
                        (pageToken ? '&page_token=' + pageToken : ''),
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                })
            }).then(function(r) { return r.json(); });
        }

        // Show loading
        var body = '<div style="text-align:center;padding:20px;">' +
            '<p style="margin-bottom:12px;">正在从飞书获取企业组织架构...</p>' +
            '<div style="width:40px;height:40px;border:3px solid #e0e0e0;border-top-color:#667eea;border-radius:50%;margin:0 auto;animation:spin 0.8s linear infinite;"></div>' +
            '<style>@keyframes spin{to{transform:rotate(360deg);}}</style></div>';
        openModal('同步组织架构', body);

        // Get token
        fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ app_id: cfg.appId, app_secret: cfg.appSecret })
            })
        }).then(function(r) { return r.json(); }).then(function(tokenRes) {
            if (!tokenRes.tenant_access_token && !tokenRes.data) {
                throw new Error('获取Token失败: ' + JSON.stringify(tokenRes));
            }
            var token = tokenRes.tenant_access_token || (tokenRes.data && tokenRes.data.tenant_access_token);

            // Fetch users
            return getAllUsers(token);
        }).then(function(usersRes) {
            var users = [];
            if (usersRes.data && usersRes.data.items) users = usersRes.data.items;
            else if (usersRes.items) users = usersRes.items;

            if (users.length === 0) { throw new Error('未找到企业用户'); }

            var importedUsers = [];
            users.forEach(function(u) {
                var deptNames = (u.department_ids || []).map(function(id){ return id; }).join(', ');
                var role = guessRole(deptNames, u.name || '', u.is_leader || false);
                var existing = getUsers();
                var found = existing.find(function(eu){ return eu.username === (u.mobile || u.email || u.name); });
                if (found) {
                    found.role = role;
                    found.displayName = u.name || found.displayName;
                    found.feishuUserId = u.open_id;
                    found.department = deptNames;
                    importedUsers.push(found);
                } else {
                    importedUsers.push({
                        id: 'u_' + (u.open_id || Date.now()),
                        username: u.mobile || u.email || u.name || '',
                        password: 'jiaofu888',
                        role: role,
                        displayName: u.name || '',
                        department: deptNames,
                        feishuUserId: u.open_id
                    });
                }
            });

            localStorage.setItem('users', JSON.stringify(importedUsers));
            alert('同步完成！共导入 ' + importedUsers.length + ' 个用户。

默认密码: jiaofu888
请告知团队成员使用手机号/邮箱登录。');
            window.closeModal();
        }).catch(function(err) {
            alert('同步失败: ' + err.message);
            window.closeModal();
        });
    };

    // Settings page: add proxy URL config and sync button
    var settingsSyncInit = function() {
        var feishuSection = document.querySelector('#settingsPage');
        if (!feishuSection) return;
        // Add proxy URL input and sync button after the feishu config section
        var testBtn = document.getElementById('testFeishuConnection');
        if (!testBtn) return;
        var btnContainer = testBtn.parentElement;
        if (!btnContainer) return;

        // Check if already added
        if (document.getElementById('proxyUrl')) return;

        // Add proxy URL input
        var proxyDiv = document.createElement('div');
        proxyDiv.className = 'form-group';
        proxyDiv.style.marginTop = '12px';
        proxyDiv.innerHTML = '<label for="proxyUrl">CORS 代理地址</label><input type="text" id="proxyUrl" placeholder="https://your-project.vercel.app/api/proxy" style="width:100%;"><small>部署 Vercel 后获得的代理 URL</small>';
        btnContainer.parentElement.insertBefore(proxyDiv, btnContainer.nextSibling);

        // Add sync org button
        var syncDiv = document.createElement('div');
        syncDiv.style.marginTop = '12px';
        syncDiv.innerHTML = '<button class="btn btn-primary" id="syncFeishuOrgBtn">从企业架构同步用户</button>';
        proxyDiv.parentElement.appendChild(syncDiv);

        // Load saved proxy url
        var savedProxy = localStorage.getItem('proxyUrl') || '';
        document.getElementById('proxyUrl').value = savedProxy;

        // Save proxy url on change
        document.getElementById('proxyUrl').addEventListener('change', function() {
            localStorage.setItem('proxyUrl', this.value);
            // Update BitableAPI proxy
            if (window.BitableAPI && window.BitableAPI.setProxyUrl) {
                window.BitableAPI.setProxyUrl(this.value);
            }
        });

        // Sync button
        document.getElementById('syncFeishuOrgBtn').addEventListener('click', function() {
            window.syncFeishuOrg();
        });
    };

    // Run settings init on page load (for settings page)
    setTimeout(settingsSyncInit, 500);


    console.log('系统初始化完成！');
});
