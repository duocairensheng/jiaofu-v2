#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书多维表格同步脚本
从 localStorage JSON 文件同步到飞书 Bitable
用法: python sync_to_feishu.py
      python sync_to_feishu.py --full  (全量清空后重新导入)
      python sync_to_feishu.py _sync_data.json (指定数据文件)
"""

import json, urllib.request, time, sys, os
from pathlib import Path

# ===== 配置 =====
APP_ID = 'cli_a96603f3a838dbc8'
APP_SECRET = 'NMPHMSxczIgENCuPzmvU7gJSOwR8ioDy'
APP_TOKEN = 'NmZxb6Dt5awQaPsbNb6cnbsHn2f'
TABLES = {
    'inventory': 'tbl1lsF830AOcNvD',
    'orders':    'tblPjWkTlEjSOoaN',
    'customers': 'tblXgdu7rTJGS8we'
}

BASE = f'https://open.feishu.cn/open-apis/bitable/v1/apps/{APP_TOKEN}/tables/'
_token_cache = None
_token_expiry = 0

def get_token():
    global _token_cache, _token_expiry
    if _token_cache and time.time() < _token_expiry:
        return _token_cache
    data = json.dumps({'app_id': APP_ID, 'app_secret': APP_SECRET}).encode()
    req = urllib.request.Request(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        data=data,
        headers={'Content-Type': 'application/json; charset=utf-8'},
        method='POST'
    )
    resp = json.loads(urllib.request.urlopen(req).read().decode())
    if resp['code'] != 0:
        raise Exception(f'获取Token失败: {resp["msg"]}')
    _token_cache = resp['tenant_access_token']
    _token_expiry = time.time() + resp['expire'] - 300
    return _token_cache

def api(method, url, body=None):
    for attempt in range(3):
        try:
            token = get_token()
            headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': f'Bearer {token}'
            }
            data = json.dumps(body).encode() if body else None
            req = urllib.request.urlopen(
                urllib.request.Request(url, data=data, headers=headers, method=method),
                timeout=15
            )
            resp = json.loads(req.read().decode())
            if resp['code'] == 0:
                return resp
            if resp['code'] == 99991600:  # 频率限制
                wait = 1.0 * (attempt + 1)
                print(f'  频率限制，等待 {wait}s...')
                time.sleep(wait)
                continue
            return None
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
                continue
            print(f'  [{method}] 网络错误: {e}')
            return None

# ===== 清空所有记录 =====
def clear_table(table_name):
    table_id = TABLES[table_name]
    url = f'{BASE}{table_id}/records?page_size=500'
    all_items = []
    page_token = None
    while True:
        u = url
        if page_token:
            u += f'&page_token={page_token}'
        resp = api('GET', u)
        if not resp:
            return False
        items = resp.get('data', {}).get('items', [])
        all_items.extend(items)
        if not resp.get('data', {}).get('has_more'):
            break
        page_token = resp['data'].get('page_token')
        time.sleep(0.3)

    print(f'  清空 {table_name} 表 ({len(all_items)} 条)...')
    count = 0
    for item in all_items:
        rid = item['record_id']
        api('DELETE', f'{BASE}{table_id}/records/{rid}')
        count += 1
        if count % 15 == 0:
            time.sleep(0.6)
    time.sleep(0.5)
    print(f'  已删除 {count} 条')
    return True

# ===== 导入库存 =====
def sync_inventory(data):
    table_id = TABLES['inventory']
    print(f'同步库存 {len(data)} 条...')
    for i, item in enumerate(data):
        fields = {
            '产品系列': str(item.get('series', '')),
            '产品名称': str(item.get('name', '')),
            '年级': str(item.get('grade', '')),
            '科目': str(item.get('subject', '')),
            '册次': str(item.get('volume', '')),
            '版本': str(item.get('version', '')),
            '定价': float(item.get('price', 0) or 0),
            '理论库存': int(float(item.get('theoryQty', 0) or 0)),
            '实际库存': int(float(item.get('quantity', 0) or 0)),
            '差异': int(float(item.get('actualQty', 0) or 0)),
            '状态': str(item.get('status', '正常')),
            '更新时间': int(time.time() * 1000)
        }
        api('POST', f'{BASE}{table_id}/records', {'fields': fields})
        if (i + 1) % 10 == 0:
            print(f'  {i+1}/{len(data)}')
            time.sleep(0.5)
    print(f'  共导入 {len(data)} 条')

# ===== 导入报单 =====
def sync_orders(data):
    table_id = TABLES['orders']
    print(f'同步报单 {len(data)} 条...')
    for i, item in enumerate(data):
        order_time = item.get('orderTime', '')
        if order_time:
            try:
                t = int(time.mktime(time.strptime(str(order_time)[:10], '%Y-%m-%d'))) * 1000
            except:
                t = int(time.time() * 1000)
        else:
            t = int(time.time() * 1000)
        fields = {
            '报单时间': t,
            '公司名称': str(item.get('company', '')),
            '客户名称': str(item.get('customer', '')),
            '学校名称': str(item.get('school', '')),
            '产品系列': str(item.get('series', '')),
            '产品名称': str(item.get('name', '')),
            '年级': str(item.get('grade', '')),
            '科目': str(item.get('subject', '')),
            '册次': str(item.get('volume', '')),
            '版本': str(item.get('version', '')),
            '定价': float(item.get('price', 0) or 0),
            '学用数量': int(float(item.get('studentQty', 0) or 0)),
            '教师学用数量': int(float(item.get('teacherQty', 0) or 0)),
            '合计数量': int(float(item.get('totalQty', 0) or 0)),
            '教用数量': int(float(item.get('teachingQty', 0) or 0)),
            '金额': float(item.get('amount', 0) or 0),
            '发货渠道': str(item.get('channel', '')),
            '发货地址': str(item.get('address', '')),
            '发货状态': str(item.get('status', '待发货')),
            '报单人': str(item.get('assignedTo', '')),
            '创建时间': int(time.time() * 1000)
        }
        api('POST', f'{BASE}{table_id}/records', {'fields': fields})
        if (i + 1) % 10 == 0:
            print(f'  {i+1}/{len(data)}')
            time.sleep(0.5)
    print(f'  共导入 {len(data)} 条')

# ===== 导入客户 =====
def sync_customers(data):
    table_id = TABLES['customers']
    print(f'同步客户 {len(data)} 条...')
    for i, item in enumerate(data):
        fields = {
            '客户名称': str(item.get('name', '')),
            '区域': str(item.get('region', '')),
            '电话': str(item.get('phone', '')),
            '备注': str(item.get('note', '')),
            '分配经理': str(item.get('assignedTo', ''))
        }
        api('POST', f'{BASE}{table_id}/records', {'fields': fields})
        if (i + 1) % 10 == 0:
            print(f'  {i+1}/{len(data)}')
            time.sleep(0.5)
    print(f'  共导入 {len(data)} 条')

# ===== 浏览器导出 JS =====
EXPORT_CODE = """
(function() {
    var data = {
        inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
        orders: JSON.parse(localStorage.getItem("orders") || "[]"),
        customers: JSON.parse(localStorage.getItem("customers") || "[]")
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "_sync_data.json";
    a.click();
    console.log("已导出 _sync_data.json");
})()
"""

# ===== 主流程 =====
if __name__ == '__main__':
    full_mode = '--full' in sys.argv
    data_file = None
    for arg in sys.argv[1:]:
        if arg.endswith('.json'):
            data_file = arg
            break
    if not data_file:
        data_file = Path(__file__).parent / '_sync_data.json'

    if not os.path.exists(data_file):
        print(f'找不到数据文件: {data_file}')
        print()
        print('请先在网页端导出数据:')
        print('  1. 打开 https://duocairensheng.github.io/jiaofu-v2/')
        print('  2. F12 打开控制台，粘贴下面代码回车')
        print('  3. 将下载的 _sync_data.json 放到本脚本同级目录')
        print()
        print('=' * 50)
        print('复制以下代码到浏览器 Console:')
        print('=' * 50)
        print(EXPORT_CODE)
        sys.exit(1)

    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    inv_count = len(data.get('inventory', []))
    ord_count = len(data.get('orders', []))
    cust_count = len(data.get('customers', []))
    print(f'数据文件: {data_file}')
    print(f'数据: 库存 {inv_count} 条, 报单 {ord_count} 条, 客户 {cust_count} 条')
    print(f'模式: {"全量清空重建" if full_mode else "增量追加"}')
    print()

    if full_mode:
        for table in ['inventory', 'orders', 'customers']:
            if data.get(table):
                clear_table(table)
        print()

    if data.get('inventory'):
        sync_inventory(data['inventory'])
    if data.get('orders'):
        sync_orders(data['orders'])
    if data.get('customers'):
        sync_customers(data['customers'])

    print()
    print('=' * 50)
    print('同步完成!')
    print(f'飞书多维表格: https://gxjiaofu.feishu.cn/base/{APP_TOKEN}')
    print('=' * 50)
