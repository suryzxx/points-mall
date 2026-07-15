export type DeveloperNote = {
  id: string;
  title: string;
  category: "页面规则" | "字段规则" | "动作规则" | "状态规则" | "报表规则";
  summary: string;
  checks?: string[];
  effects?: string[];
  blockedWhen?: string[];
  notes?: string[];
};

export const developerNotes: DeveloperNote[] = [
  {
    id: "view-switch",
    title: "演示视角切换",
    category: "页面规则",
    summary: "原型不做登录和权限，通过视角切换直接进入学生端或后台端。",
    effects: ["只改变当前演示视角", "不改变商品、订单、积分、流水等业务数据"],
    notes: ["真实系统后续需要接入账号、角色和权限控制。"],
  },
  {
    id: "student-points",
    title: "学生可用积分",
    category: "字段规则",
    summary: "当前只维护一个演示学生的可用积分，用于验证兑换和取消返还闭环。",
    effects: ["兑换成功时扣减积分", "取消待领取实物订单时返还积分"],
    notes: ["MVP 没有做积分冻结态，实物商品提交后也直接扣减积分。"],
  },
  {
    id: "reset-demo",
    title: "重置演示数据",
    category: "动作规则",
    summary: "清空 localStorage 中的演示状态，并恢复初始商品、订单和积分流水。",
    effects: ["学生积分恢复为初始值", "商品库存和上下架状态恢复", "订单和流水恢复到初始样例"],
  },
  {
    id: "student-mall-page",
    title: "学生端商城首页",
    category: "页面规则",
    summary: "学生只看到已上架商品，并按分类、库存和积分状态决定是否可兑换。",
    checks: ["商品必须是上架状态", "分类筛选匹配当前 tab"],
    blockedWhen: ["商品下架时不展示在学生端"],
  },
  {
    id: "product-category-filter",
    title: "商品分类筛选",
    category: "页面规则",
    summary: "分类只影响学生端当前列表展示，不改变商品数据本身。",
    effects: ["全部：展示所有上架商品", "虚拟商品：只展示 type=virtual", "实物商品：只展示 type=physical"],
  },
  {
    id: "product-card",
    title: "商品卡片展示规则",
    category: "字段规则",
    summary: "卡片集中展示商品名称、标签、类型、交付说明、兑换积分和库存状态。",
    checks: ["库存为 0 时显示已售罄", "学生积分不足时显示积分不足", "满足库存和积分时显示可兑换"],
  },
  {
    id: "product-stock",
    title: "库存规则",
    category: "字段规则",
    summary: "MVP 中虚拟商品和实物商品都使用库存字段，兑换成功后都会扣减 1。",
    checks: ["库存必须大于 0 才允许兑换"],
    effects: ["兑换成功：库存 -1", "取消待领取实物订单：库存 +1"],
    notes: ["真实系统后续可以让虚拟商品改为不限制库存或单独配置兑换总量。"],
  },
  {
    id: "exchange-button",
    title: "立即兑换",
    category: "动作规则",
    summary: "点击后先打开确认弹窗，确认后再执行兑换规则。",
    checks: ["商品已上架", "库存充足", "学生积分充足"],
    blockedWhen: ["库存为 0", "学生积分不足", "商品下架"],
  },
  {
    id: "product-detail",
    title: "商品详情",
    category: "页面规则",
    summary: "详情页承接兑换决策，展示商品说明、交付说明和当前兑换条件。",
    checks: ["商品是否上架", "库存是否充足", "学生积分是否足够"],
  },
  {
    id: "exchange-confirm",
    title: "兑换确认",
    category: "动作规则",
    summary: "确认弹窗区分虚拟商品和实物商品的取消规则。",
    effects: ["虚拟商品：扣积分、扣库存、生成已完成订单、写入兑换扣减和虚拟发放流水", "实物商品：扣积分、扣库存、生成待领取订单、写入兑换扣减流水"],
    notes: ["原型统一表现为提交后扣减积分；真实系统可再拆分冻结积分和正式扣减。"],
  },
  {
    id: "student-orders-page",
    title: "我的兑换",
    category: "页面规则",
    summary: "学生查看自己的兑换记录，并且只能取消待领取的实物订单。",
    blockedWhen: ["虚拟商品兑换后不可取消", "已完成订单不可取消", "已取消订单不可重复操作"],
  },
  {
    id: "student-order-filter",
    title: "订单筛选",
    category: "页面规则",
    summary: "筛选仅改变当前订单列表展示，不改变订单状态。",
  },
  {
    id: "cancel-order",
    title: "取消兑换 / 取消订单",
    category: "动作规则",
    summary: "只允许取消待领取的实物商品订单。",
    checks: ["订单状态必须是待领取", "商品类型必须是实物商品"],
    effects: ["订单状态变为已取消", "学生积分返还", "商品库存释放", "新增一条取消返还积分流水"],
    blockedWhen: ["虚拟商品订单", "已完成订单", "已取消订单"],
  },
  {
    id: "admin-products-page",
    title: "后台商品管理",
    category: "页面规则",
    summary: "后台维护商品基础信息、上下架状态、库存和交付方式。",
    notes: ["MVP 不做多规格、限购、指定学员可见、快递配送和多校区核销配置。"],
  },
  {
    id: "add-product",
    title: "新增商品",
    category: "动作规则",
    summary: "打开商品编辑弹窗，使用默认商品模板创建新商品。",
    effects: ["默认类型：实物商品", "默认库存：10", "默认积分：100", "默认状态：上架", "默认标签：新品"],
  },
  {
    id: "edit-product",
    title: "编辑商品",
    category: "动作规则",
    summary: "编辑当前商品基础字段，保存后直接更新 mock 状态。",
    effects: ["根据商品类型自动写入交付方式", "不回溯修改已生成订单中的商品快照"],
  },
  {
    id: "product-status",
    title: "商品上下架",
    category: "状态规则",
    summary: "上下架只影响学生端是否展示和是否允许兑换。",
    effects: ["上架：学生端可见", "下架：学生端不展示"],
    notes: ["后台商品列表仍展示所有商品，便于运营恢复上架。"],
  },
  {
    id: "admin-orders-page",
    title: "后台订单管理",
    category: "页面规则",
    summary: "后台处理实物商品线下领取；虚拟商品兑换后已自动完成。",
  },
  {
    id: "complete-order",
    title: "确认领取",
    category: "动作规则",
    summary: "后台确认学生已领取实物商品。",
    checks: ["订单状态必须是待领取"],
    effects: ["订单状态从待领取变为已完成"],
    notes: ["确认领取不会再变更积分或库存，因为兑换时已扣减。"],
  },
  {
    id: "order-status",
    title: "订单状态",
    category: "状态规则",
    summary: "MVP 只保留待领取、已完成、已取消三个状态。",
    effects: ["虚拟商品：已兑换后直接已完成", "实物商品：兑换后待领取，后台确认后已完成，取消后已取消"],
  },
  {
    id: "ledger-page",
    title: "积分流水",
    category: "页面规则",
    summary: "积分流水用于证明积分变动可信，记录兑换扣减、取消返还和虚拟发放。",
    notes: ["MVP 暂不提供后台手动调整入口，只展示流水。"],
  },
  {
    id: "ledger-change",
    title: "积分变动",
    category: "字段规则",
    summary: "负数代表积分扣减，正数代表积分返还，0 代表虚拟权益发放记录。",
  },
  {
    id: "reports-page",
    title: "数据报表",
    category: "报表规则",
    summary: "报表用于表达上线后运营需要关注的基础数据，不做复杂 BI。",
    effects: ["商品类型占比来自商品列表", "本月积分消耗来自负向积分流水", "待领取订单来自订单状态", "库存预警来自实物商品库存"],
  },
  {
    id: "product-editor",
    title: "商品编辑弹窗",
    category: "动作规则",
    summary: "保存前做最小字段校验，避免创建不可展示的空商品。",
    checks: ["商品名称不能为空", "积分必须大于 0", "库存不能小于 0", "兑换说明不能为空"],
    effects: ["新商品生成本地 id", "保存后写入商品列表", "交付方式由商品类型自动决定"],
  },
];

export function getDeveloperNote(id: string) {
  return developerNotes.find((note) => note.id === id);
}
