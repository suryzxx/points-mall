"use client";

import { useEffect, useMemo, useState } from "react";

type ProductType = "virtual" | "physical";
type ProductTag = "新品" | "热门" | "限时";
type ProductStatus = "active" | "inactive";
type OrderStatus = "pending_pickup" | "completed" | "cancelled";
type LedgerType = "兑换扣减" | "取消返还" | "后台调整" | "虚拟发放";

type Product = {
  id: string;
  name: string;
  image: string;
  type: ProductType;
  points: number;
  stock: number;
  status: ProductStatus;
  tag: ProductTag;
  description: string;
  delivery: string;
};

type Order = {
  id: string;
  studentName: string;
  phone: string;
  productId: string;
  productName: string;
  productType: ProductType;
  points: number;
  createdAt: string;
  status: OrderStatus;
};

type Ledger = {
  id: string;
  studentName: string;
  type: LedgerType;
  change: number;
  orderId: string;
  createdAt: string;
  note: string;
};

type Store = {
  student: {
    name: string;
    phone: string;
    points: number;
  };
  products: Product[];
  orders: Order[];
  ledgers: Ledger[];
};

type ViewMode = "student" | "admin";
type StudentPage = "mall" | "orders";
type AdminPage = "dashboard" | "products" | "orders" | "ledger" | "reports";

const STORAGE_KEY = "points-mall-mvp-state";

const initialStore: Store = {
  student: {
    name: "王小明",
    phone: "13800000001",
    points: 860,
  },
  products: [
    {
      id: "p-virtual-1",
      name: "FCE 写作批改券",
      image: "券",
      type: "virtual",
      points: 120,
      stock: 999,
      status: "active",
      tag: "热门",
      description: "兑换后获得一次 FCE 写作批改权益，老师会在课后统一安排使用。",
      delivery: "兑换后自动发放到学生权益记录。",
    },
    {
      id: "p-physical-1",
      name: "思越定制笔记本",
      image: "本",
      type: "physical",
      points: 180,
      stock: 8,
      status: "active",
      tag: "新品",
      description: "适合课堂笔记和错题整理，到校后可在前台领取。",
      delivery: "线下领取，请到校区前台出示兑换记录。",
    },
    {
      id: "p-physical-2",
      name: "英语阅读训练书",
      image: "书",
      type: "physical",
      points: 320,
      stock: 2,
      status: "active",
      tag: "限时",
      description: "分级阅读训练材料，适合每周阅读打卡使用。",
      delivery: "线下领取，请到校区前台出示兑换记录。",
    },
    {
      id: "p-virtual-2",
      name: "口语陪练 20 分钟",
      image: "练",
      type: "virtual",
      points: 260,
      stock: 20,
      status: "active",
      tag: "热门",
      description: "兑换后获得一次 20 分钟口语陪练权益。",
      delivery: "兑换后自动发放，课程顾问后续安排使用时间。",
    },
    {
      id: "p-physical-3",
      name: "帆布袋",
      image: "袋",
      type: "physical",
      points: 90,
      stock: 0,
      status: "active",
      tag: "新品",
      description: "校区活动周边，库存为 0 时学生端显示已售罄。",
      delivery: "线下领取，请到校区前台出示兑换记录。",
    },
  ],
  orders: [
    {
      id: "MALL20260714001",
      studentName: "王小明",
      phone: "13800000001",
      productId: "p-physical-1",
      productName: "思越定制笔记本",
      productType: "physical",
      points: 180,
      createdAt: "2026-07-14 09:30",
      status: "pending_pickup",
    },
    {
      id: "MALL20260713002",
      studentName: "王小明",
      phone: "13800000001",
      productId: "p-virtual-1",
      productName: "FCE 写作批改券",
      productType: "virtual",
      points: 120,
      createdAt: "2026-07-13 18:20",
      status: "completed",
    },
  ],
  ledgers: [
    {
      id: "l-1",
      studentName: "王小明",
      type: "兑换扣减",
      change: -180,
      orderId: "MALL20260714001",
      createdAt: "2026-07-14 09:30",
      note: "兑换实物商品，生成待领取订单。",
    },
    {
      id: "l-2",
      studentName: "王小明",
      type: "兑换扣减",
      change: -120,
      orderId: "MALL20260713002",
      createdAt: "2026-07-13 18:20",
      note: "兑换虚拟商品，立即完成。",
    },
    {
      id: "l-3",
      studentName: "王小明",
      type: "虚拟发放",
      change: 0,
      orderId: "MALL20260713002",
      createdAt: "2026-07-13 18:20",
      note: "虚拟权益已自动发放。",
    },
  ],
};

const emptyProduct: Product = {
  id: "",
  name: "",
  image: "品",
  type: "physical",
  points: 100,
  stock: 10,
  status: "active",
  tag: "新品",
  description: "",
  delivery: "线下领取，请到校区前台出示兑换记录。",
};

const statusText: Record<OrderStatus, string> = {
  pending_pickup: "待领取",
  completed: "已完成",
  cancelled: "已取消",
};

const typeText: Record<ProductType, string> = {
  virtual: "虚拟商品",
  physical: "实物商品",
};

function nowText() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function newOrderId(orderCount: number) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MALL${day}${String(orderCount + 1).padStart(3, "0")}`;
}

function readStore(): Store {
  if (typeof window === "undefined") return initialStore;
  const cached = window.localStorage.getItem(STORAGE_KEY);
  if (!cached) return initialStore;
  try {
    return JSON.parse(cached) as Store;
  } catch {
    return initialStore;
  }
}

export default function PointsMallMvp() {
  const [store, setStore] = useState<Store>(initialStore);
  const [hydrated, setHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("student");
  const [studentPage, setStudentPage] = useState<StudentPage>("mall");
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [category, setCategory] = useState<"all" | ProductType>("all");
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [confirmProductId, setConfirmProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    setStore(readStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  }, [hydrated, store]);

  const activeProducts = useMemo(
    () =>
      store.products.filter(
        (product) =>
          product.status === "active" &&
          (category === "all" || product.type === category),
      ),
    [category, store.products],
  );

  const selectedProduct = store.products.find((item) => item.id === selectedProductId);
  const confirmProduct = store.products.find((item) => item.id === confirmProductId);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);
    const todayOrders = store.orders.filter((order) => order.createdAt.startsWith(today));
    const monthLedgers = store.ledgers.filter(
      (ledger) => ledger.createdAt.startsWith(month) && ledger.change < 0,
    );
    const soldMap = new Map<string, { name: string; count: number; points: number }>();
    store.orders.forEach((order) => {
      if (order.status === "cancelled") return;
      const current = soldMap.get(order.productId) ?? {
        name: order.productName,
        count: 0,
        points: 0,
      };
      soldMap.set(order.productId, {
        ...current,
        count: current.count + 1,
        points: current.points + order.points,
      });
    });

    return {
      todayOrderCount: todayOrders.length,
      monthPoints: Math.abs(monthLedgers.reduce((sum, item) => sum + item.change, 0)),
      pendingCount: store.orders.filter((order) => order.status === "pending_pickup").length,
      stockWarningCount: store.products.filter(
        (product) => product.type === "physical" && product.status === "active" && product.stock <= 3,
      ).length,
      topProducts: [...soldMap.values()].sort((a, b) => b.count - a.count).slice(0, 5),
      productTypes: {
        virtual: store.products.filter((product) => product.type === "virtual").length,
        physical: store.products.filter((product) => product.type === "physical").length,
      },
      orderStatus: {
        pending_pickup: store.orders.filter((order) => order.status === "pending_pickup").length,
        completed: store.orders.filter((order) => order.status === "completed").length,
        cancelled: store.orders.filter((order) => order.status === "cancelled").length,
      },
    };
  }, [store]);

  function addLedger(entry: Omit<Ledger, "id" | "createdAt">): Ledger {
    return {
      ...entry,
      id: `l-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: nowText(),
    };
  }

  function exchangeProduct(product: Product) {
    if (product.status !== "active") return;
    if (product.stock <= 0) return;
    if (store.student.points < product.points) return;

    const order: Order = {
      id: newOrderId(store.orders.length),
      studentName: store.student.name,
      phone: store.student.phone,
      productId: product.id,
      productName: product.name,
      productType: product.type,
      points: product.points,
      createdAt: nowText(),
      status: product.type === "virtual" ? "completed" : "pending_pickup",
    };

    setStore((current) => ({
      ...current,
      student: {
        ...current.student,
        points: current.student.points - product.points,
      },
      products: current.products.map((item) =>
        item.id === product.id ? { ...item, stock: Math.max(0, item.stock - 1) } : item,
      ),
      orders: [order, ...current.orders],
      ledgers: [
        addLedger({
          studentName: current.student.name,
          type: "兑换扣减",
          change: -product.points,
          orderId: order.id,
          note:
            product.type === "virtual"
              ? "兑换虚拟商品，立即完成。"
              : "兑换实物商品，生成待领取订单。",
        }),
        ...(product.type === "virtual"
          ? [
              addLedger({
                studentName: current.student.name,
                type: "虚拟发放",
                change: 0,
                orderId: order.id,
                note: "虚拟权益已自动发放。",
              }),
            ]
          : []),
        ...current.ledgers,
      ],
    }));
    setConfirmProductId(null);
    setSelectedProductId(null);
    setStudentPage("orders");
  }

  function cancelOrder(orderId: string) {
    setStore((current) => {
      const order = current.orders.find((item) => item.id === orderId);
      if (!order || order.status !== "pending_pickup" || order.productType !== "physical") {
        return current;
      }
      return {
        ...current,
        student: {
          ...current.student,
          points: current.student.points + order.points,
        },
        products: current.products.map((product) =>
          product.id === order.productId ? { ...product, stock: product.stock + 1 } : product,
        ),
        orders: current.orders.map((item) =>
          item.id === orderId ? { ...item, status: "cancelled" } : item,
        ),
        ledgers: [
          addLedger({
            studentName: current.student.name,
            type: "取消返还",
            change: order.points,
            orderId: order.id,
            note: "实物商品未领取前取消，积分返还，库存释放。",
          }),
          ...current.ledgers,
        ],
      };
    });
  }

  function completeOrder(orderId: string) {
    setStore((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId && order.status === "pending_pickup"
          ? { ...order, status: "completed" }
          : order,
      ),
    }));
  }

  function saveProduct(product: Product) {
    setStore((current) => {
      const nextProduct = {
        ...product,
        id: product.id || `p-${Date.now()}`,
        delivery:
          product.type === "virtual"
            ? "兑换后自动发放到学生权益记录。"
            : "线下领取，请到校区前台出示兑换记录。",
      };
      const exists = current.products.some((item) => item.id === nextProduct.id);
      return {
        ...current,
        products: exists
          ? current.products.map((item) => (item.id === nextProduct.id ? nextProduct : item))
          : [nextProduct, ...current.products],
      };
    });
    setEditingProduct(null);
  }

  function toggleProductStatus(productId: string) {
    setStore((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId
          ? { ...product, status: product.status === "active" ? "inactive" : "active" }
          : product,
      ),
    }));
  }

  function resetDemo() {
    window.localStorage.removeItem(STORAGE_KEY);
    setStore(initialStore);
    setSelectedProductId(null);
    setConfirmProductId(null);
    setEditingProduct(null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">本地最小 MVP</p>
          <h1>积分商城原型</h1>
        </div>
        <div className="topbar-actions">
          <div className="segmented">
            <button
              className={viewMode === "student" ? "active" : ""}
              onClick={() => setViewMode("student")}
            >
              学生视角
            </button>
            <button
              className={viewMode === "admin" ? "active" : ""}
              onClick={() => setViewMode("admin")}
            >
              后台视角
            </button>
          </div>
          <div className="student-points">
            {store.student.name}：<strong>{store.student.points}</strong> 积分
          </div>
          <button className="ghost-button" onClick={resetDemo}>
            重置演示数据
          </button>
        </div>
      </header>

      <section className="workspace">
        {viewMode === "student" ? (
          <>
            <nav className="side-nav" aria-label="学生端菜单">
              <button className={studentPage === "mall" ? "active" : ""} onClick={() => setStudentPage("mall")}>
                商城首页
              </button>
              <button className={studentPage === "orders" ? "active" : ""} onClick={() => setStudentPage("orders")}>
                我的兑换
              </button>
            </nav>
            <section className="panel-area">
              {studentPage === "mall" ? (
                <StudentMall
                  products={activeProducts}
                  category={category}
                  studentPoints={store.student.points}
                  onCategoryChange={setCategory}
                  onShowDetail={setSelectedProductId}
                  onConfirm={setConfirmProductId}
                />
              ) : (
                <StudentOrders
                  orders={store.orders}
                  filter={orderFilter}
                  onFilterChange={setOrderFilter}
                  onCancel={cancelOrder}
                />
              )}
            </section>
          </>
        ) : (
          <>
            <nav className="side-nav" aria-label="后台菜单">
              {[
                ["dashboard", "后台首页"],
                ["products", "商品管理"],
                ["orders", "订单管理"],
                ["ledger", "积分流水"],
                ["reports", "数据报表"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={adminPage === key ? "active" : ""}
                  onClick={() => setAdminPage(key as AdminPage)}
                >
                  {label}
                </button>
              ))}
            </nav>
            <section className="panel-area">
              {adminPage === "dashboard" && <Dashboard stats={stats} />}
              {adminPage === "products" && (
                <ProductAdmin
                  products={store.products}
                  onAdd={() => setEditingProduct(emptyProduct)}
                  onEdit={(product) => setEditingProduct(product)}
                  onToggle={toggleProductStatus}
                />
              )}
              {adminPage === "orders" && (
                <AdminOrders orders={store.orders} onComplete={completeOrder} onCancel={cancelOrder} />
              )}
              {adminPage === "ledger" && <LedgerTable ledgers={store.ledgers} />}
              {adminPage === "reports" && <Reports stats={stats} />}
            </section>
          </>
        )}
      </section>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          studentPoints={store.student.points}
          onClose={() => setSelectedProductId(null)}
          onConfirm={() => setConfirmProductId(selectedProduct.id)}
        />
      )}

      {confirmProduct && (
        <ConfirmExchange
          product={confirmProduct}
          onCancel={() => setConfirmProductId(null)}
          onSubmit={() => exchangeProduct(confirmProduct)}
        />
      )}

      {editingProduct && (
        <ProductEditor product={editingProduct} onCancel={() => setEditingProduct(null)} onSave={saveProduct} />
      )}
    </main>
  );
}

function StudentMall({
  products,
  category,
  studentPoints,
  onCategoryChange,
  onShowDetail,
  onConfirm,
}: {
  products: Product[];
  category: "all" | ProductType;
  studentPoints: number;
  onCategoryChange: (value: "all" | ProductType) => void;
  onShowDetail: (id: string) => void;
  onConfirm: (id: string) => void;
}) {
  return (
    <div>
      <PanelHeader
        title="学生端商城首页"
        desc="学生浏览上架商品，按积分和库存状态发起兑换。"
      />
      <div className="toolbar">
        <div className="segmented compact">
          {[
            ["all", "全部"],
            ["virtual", "虚拟商品"],
            ["physical", "实物商品"],
          ].map(([key, label]) => (
            <button key={key} className={category === key ? "active" : ""} onClick={() => onCategoryChange(key as "all" | ProductType)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="product-grid">
        {products.map((product) => {
          const soldOut = product.stock <= 0;
          const notEnough = studentPoints < product.points;
          return (
            <article className="product-card" key={product.id}>
              <div className="product-image">{product.image}</div>
              <div className="card-head">
                <h3>{product.name}</h3>
                <span className="tag">{product.tag}</span>
              </div>
              <p>{typeText[product.type]} · {product.delivery}</p>
              <div className="meta-row">
                <strong>{product.points} 积分</strong>
                <span>库存 {product.stock}</span>
              </div>
              <div className="status-line">
                {soldOut ? "已售罄" : notEnough ? "积分不足" : "可兑换"}
              </div>
              <div className="card-actions">
                <button className="ghost-button" onClick={() => onShowDetail(product.id)}>
                  详情
                </button>
                <button className="primary-button" disabled={soldOut || notEnough} onClick={() => onConfirm(product.id)}>
                  立即兑换
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function StudentOrders({
  orders,
  filter,
  onFilterChange,
  onCancel,
}: {
  orders: Order[];
  filter: "all" | OrderStatus;
  onFilterChange: (value: "all" | OrderStatus) => void;
  onCancel: (id: string) => void;
}) {
  const filteredOrders = orders.filter((order) => filter === "all" || order.status === filter);
  return (
    <div>
      <PanelHeader title="我的兑换 / 订单页" desc="学生查看兑换记录，待领取实物商品可在领取前取消。" />
      <div className="toolbar">
        <div className="segmented compact">
          {[
            ["all", "全部"],
            ["pending_pickup", "待领取"],
            ["completed", "已完成"],
            ["cancelled", "已取消"],
          ].map(([key, label]) => (
            <button key={key} className={filter === key ? "active" : ""} onClick={() => onFilterChange(key as "all" | OrderStatus)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        headers={["订单号", "商品", "类型", "积分", "时间", "状态", "操作"]}
        rows={filteredOrders.map((order) => [
          order.id,
          order.productName,
          typeText[order.productType],
          `${order.points}`,
          order.createdAt,
          statusText[order.status],
          order.status === "pending_pickup" && order.productType === "physical" ? (
            <button className="danger-button" onClick={() => onCancel(order.id)}>
              取消兑换
            </button>
          ) : order.productType === "virtual" ? (
            "查看兑换结果"
          ) : (
            "只读"
          ),
        ])}
      />
    </div>
  );
}

function Dashboard({ stats }: { stats: ReturnType<typeof useDashboardStats> }) {
  return (
    <div>
      <PanelHeader title="后台首页 / 数据看板" desc="运营查看订单、积分消耗、库存预警和商品兑换表现。" />
      <MetricGrid
        metrics={[
          ["今日兑换订单数", stats.todayOrderCount],
          ["本月消耗积分", stats.monthPoints],
          ["待处理订单数", stats.pendingCount],
          ["库存预警商品数", stats.stockWarningCount],
        ]}
      />
      <div className="two-column">
        <BarList
          title="热门兑换商品 TOP 5"
          items={stats.topProducts.map((item) => ({ label: item.name, value: item.count }))}
        />
        <StatusBlocks
          title="订单状态分布"
          items={[
            ["待领取", stats.orderStatus.pending_pickup],
            ["已完成", stats.orderStatus.completed],
            ["已取消", stats.orderStatus.cancelled],
          ]}
        />
      </div>
    </div>
  );
}

function ProductAdmin({
  products,
  onAdd,
  onEdit,
  onToggle,
}: {
  products: Product[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <PanelHeader title="后台商品管理页" desc="配置商品、上下架、查看类型和库存状态。" action={<button className="primary-button" onClick={onAdd}>新增商品</button>} />
      <DataTable
        headers={["商品", "类型", "积分", "库存", "标签", "状态", "交付方式", "操作"]}
        rows={products.map((product) => [
          product.name,
          typeText[product.type],
          `${product.points}`,
          product.stock <= 3 && product.type === "physical" ? `预警：${product.stock}` : `${product.stock}`,
          product.tag,
          product.status === "active" ? "上架" : "下架",
          product.delivery,
          <div className="inline-actions" key={product.id}>
            <button className="ghost-button" onClick={() => onEdit(product)}>编辑</button>
            <button className="ghost-button" onClick={() => onToggle(product.id)}>
              {product.status === "active" ? "下架" : "上架"}
            </button>
          </div>,
        ])}
      />
    </div>
  );
}

function AdminOrders({
  orders,
  onComplete,
  onCancel,
}: {
  orders: Order[];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div>
      <PanelHeader title="后台订单管理页" desc="虚拟商品兑换后立即完成；实物商品待领取，可确认领取或取消。" />
      <DataTable
        headers={["订单号", "学生 / 手机号", "商品", "类型", "积分", "下单时间", "状态", "操作"]}
        rows={orders.map((order) => [
          order.id,
          `${order.studentName} / ${order.phone}`,
          order.productName,
          typeText[order.productType],
          `${order.points}`,
          order.createdAt,
          statusText[order.status],
          order.status === "pending_pickup" ? (
            <div className="inline-actions" key={order.id}>
              <button className="primary-button" onClick={() => onComplete(order.id)}>确认领取</button>
              <button className="danger-button" onClick={() => onCancel(order.id)}>取消订单</button>
            </div>
          ) : (
            "只读"
          ),
        ])}
      />
    </div>
  );
}

function LedgerTable({ ledgers }: { ledgers: Ledger[] }) {
  return (
    <div>
      <PanelHeader title="后台积分流水页" desc="展示兑换扣减、取消返还、后台调整和虚拟发放记录。" />
      <DataTable
        headers={["学生", "类型", "积分变动", "关联订单", "时间", "备注"]}
        rows={ledgers.map((ledger) => [
          ledger.studentName,
          ledger.type,
          ledger.change > 0 ? `+${ledger.change}` : `${ledger.change}`,
          ledger.orderId,
          ledger.createdAt,
          ledger.note,
        ])}
      />
    </div>
  );
}

function Reports({ stats }: { stats: ReturnType<typeof useDashboardStats> }) {
  return (
    <div>
      <PanelHeader title="数据报表" desc="MVP 先用简单图表表达报表方向，不做复杂 BI。" />
      <div className="two-column">
        <StatusBlocks
          title="商品类型占比"
          items={[
            ["虚拟商品", stats.productTypes.virtual],
            ["实物商品", stats.productTypes.physical],
          ]}
        />
        <BarList
          title="积分消耗趋势"
          items={[
            { label: "本月积分消耗", value: stats.monthPoints },
            { label: "待领取订单", value: stats.pendingCount },
            { label: "库存预警", value: stats.stockWarningCount },
          ]}
        />
      </div>
      <div className="mvp-note">
        本期不做：权限分级、积分有效期、快递配送、支付通道、多规格、复杂限购、指定学员可见、风控冻结、售后补发、Excel 导出、多校区复杂核销。
      </div>
    </div>
  );
}

function ProductDetail({
  product,
  studentPoints,
  onClose,
  onConfirm,
}: {
  product: Product;
  studentPoints: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const disabled = product.status !== "active" || product.stock <= 0 || studentPoints < product.points;
  return (
    <Modal title="学生端商品详情页" onClose={onClose}>
      <div className="detail-layout">
        <div className="product-image large">{product.image}</div>
        <div>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <dl className="detail-list">
            <div><dt>所需积分</dt><dd>{product.points}</dd></div>
            <div><dt>当前库存</dt><dd>{product.stock}</dd></div>
            <div><dt>商品类型</dt><dd>{typeText[product.type]}</dd></div>
            <div><dt>兑换说明</dt><dd>{product.delivery}</dd></div>
          </dl>
          <button className="primary-button" disabled={disabled} onClick={onConfirm}>
            立即兑换
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmExchange({
  product,
  onCancel,
  onSubmit,
}: {
  product: Product;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal title="兑换确认" onClose={onCancel}>
      <div className="confirm-copy">
        <h2>{product.name}</h2>
        <p>本次将扣除 {product.points} 积分。</p>
        {product.type === "virtual" ? (
          <ul>
            <li>虚拟权益即时发放。</li>
            <li>兑换后不支持取消。</li>
          </ul>
        ) : (
          <ul>
            <li>请到校区前台领取。</li>
            <li>未领取前可取消并返还积分。</li>
          </ul>
        )}
      </div>
      <div className="modal-actions">
        <button className="ghost-button" onClick={onCancel}>再想想</button>
        <button className="primary-button" onClick={onSubmit}>确认兑换</button>
      </div>
    </Modal>
  );
}

function ProductEditor({
  product,
  onCancel,
  onSave,
}: {
  product: Product;
  onCancel: () => void;
  onSave: (product: Product) => void;
}) {
  const [draft, setDraft] = useState(product);
  const canSave = draft.name.trim() && draft.points > 0 && draft.stock >= 0 && draft.description.trim();
  return (
    <Modal title={product.id ? "编辑商品" : "新增商品"} onClose={onCancel}>
      <div className="form-grid">
        <label>
          商品名称
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label>
          图片占位字
          <input maxLength={2} value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value || "品" })} />
        </label>
        <label>
          商品类型
          <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as ProductType })}>
            <option value="physical">实物商品</option>
            <option value="virtual">虚拟商品</option>
          </select>
        </label>
        <label>
          兑换积分
          <input type="number" value={draft.points} onChange={(event) => setDraft({ ...draft, points: Number(event.target.value) })} />
        </label>
        <label>
          库存数量
          <input type="number" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} />
        </label>
        <label>
          上架状态
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProductStatus })}>
            <option value="active">上架</option>
            <option value="inactive">下架</option>
          </select>
        </label>
        <label>
          商品标签
          <select value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value as ProductTag })}>
            <option value="新品">新品</option>
            <option value="热门">热门</option>
            <option value="限时">限时</option>
          </select>
        </label>
        <label className="full">
          兑换说明
          <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
      </div>
      <div className="modal-actions">
        <button className="ghost-button" onClick={onCancel}>取消</button>
        <button className="primary-button" disabled={!canSave} onClick={() => onSave(draft)}>保存商品</button>
      </div>
    </Modal>
  );
}

function PanelHeader({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      {action}
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: [string, number][] }) {
  return (
    <div className="metric-grid">
      {metrics.map(([label, value]) => (
        <div className="metric-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function BarList({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <section className="chart-box">
      <h3>{title}</h3>
      {items.length ? (
        items.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))
      ) : (
        <p className="empty">暂无数据</p>
      )}
    </section>
  );
}

function StatusBlocks({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <section className="chart-box">
      <h3>{title}</h3>
      <div className="status-grid">
        {items.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty">暂无记录</div>}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="ghost-button" onClick={onClose} aria-label="关闭">关闭</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function useDashboardStats() {
  return {
    todayOrderCount: 0,
    monthPoints: 0,
    pendingCount: 0,
    stockWarningCount: 0,
    topProducts: [] as { name: string; count: number; points: number }[],
    productTypes: { virtual: 0, physical: 0 },
    orderStatus: { pending_pickup: 0, completed: 0, cancelled: 0 },
  };
}
