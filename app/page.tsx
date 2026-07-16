"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { DeveloperMode } from "./DeveloperMode";
import {
  ArrowRightIcon,
  CloseIcon,
  CollapseRightIcon,
  ExpandLeftIcon,
  MallIcon,
  MinusCircleIcon,
  MyIcon,
  PlusCircleIcon,
} from "./icons";

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
  quantity: number;
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
type AdminPage = "products" | "orders" | "ledger" | "reports";

const STORAGE_KEY = "points-mall-mvp-state";
const PRODUCTS_PER_PAGE = 20;
const PUBLIC_ASSET_BASE = import.meta.env.BASE_URL;

function publicAssetPath(path: string) {
  const normalizedPath = path.replace(/^\/+/, "");
  if (PUBLIC_ASSET_BASE === "./" && typeof window !== "undefined") {
    const pagePath = window.location.pathname;
    const basePath = pagePath.endsWith("/")
      ? pagePath
      : pagePath.slice(0, pagePath.lastIndexOf("/") + 1);
    return `${window.location.origin}${basePath}${normalizedPath}`;
  }
  return `${PUBLIC_ASSET_BASE}${normalizedPath}`;
}

function physicalProduct(
  id: string,
  name: string,
  image: string,
  points: number,
  stock: number,
  tag: ProductTag,
  description: string,
): Product {
  return {
    id,
    name,
    image,
    type: "physical",
    points,
    stock,
    status: "active",
    tag,
    description,
    delivery: "线下领取，请到校区前台出示兑换记录。",
  };
}

const initialStore: Store = {
  student: {
    name: "王小明",
    phone: "13800000001",
    points: 860,
  },
  products: [
    physicalProduct("p-stationery-notebook-1", "思悦定制笔记本1", "/product-images/notebook.png", 288, 12, "新品", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-book-magic-tree-house", "神奇树屋", "/product-images/magic-tree-house.png", 988, 5, "热门", "经典章节书，适合课后阅读兑换。"),
    physicalProduct("p-sticker-meimei", "梅梅贴纸", "/product-images/meimei-sticker.png", 66, 30, "新品", "角色主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-pencil-1", "思悦定制铅笔1", "/product-images/pencil.png", 188, 20, "热门", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-eraser-1", "思悦定制橡皮1", "/product-images/eraser.png", 88, 24, "新品", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-book-magic-school-bus", "神奇校车", "/product-images/magic-school-bus.png", 988, 4, "热门", "科普阅读书，适合拓展知识面。"),
    physicalProduct("p-stationery-pencil-box-1", "思悦定制文具盒1", "/product-images/pencil-box.png", 388, 8, "限时", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-sticker-sixiaodou", "思小豆贴纸", "/product-images/sixiaodou-sticker.png", 66, 30, "热门", "思小豆主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-2", "思悦定制笔记本2", "/product-images/notebook.png", 288, 10, "热门", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-stationery-pencil-2", "思悦定制铅笔2", "/product-images/pencil.png", 188, 18, "新品", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-book-national-geographic", "国家探索", "/product-images/national-geographic.png", 988, 4, "限时", "探索主题读物，适合课外阅读兑换。"),
    physicalProduct("p-stationery-eraser-2", "思悦定制橡皮2", "/product-images/eraser.png", 88, 22, "热门", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-stationery-pencil-box-2", "思悦定制文具盒2", "/product-images/pencil-box.png", 388, 7, "新品", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-sticker-yueyue", "悦悦贴纸", "/product-images/yueyue-sticker.png", 66, 30, "新品", "悦悦主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-3", "思悦定制笔记本3", "/product-images/notebook.png", 288, 11, "限时", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-book-oxford-potato-pals", "牛津小土豆", "/product-images/oxford-potato-pals.png", 988, 6, "热门", "牛津分级阅读读物，适合英语阅读积累。"),
    physicalProduct("p-stationery-pencil-3", "思悦定制铅笔3", "/product-images/pencil.png", 188, 19, "限时", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-eraser-3", "思悦定制橡皮3", "/product-images/eraser.png", 88, 25, "新品", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-sticker-songsong", "松松贴纸", "/product-images/songsong-sticker.png", 66, 28, "热门", "松松主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-4", "思悦定制笔记本4", "/product-images/notebook.png", 288, 9, "新品", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-book-fly-guy", "苍蝇小子", "/product-images/fly-guy.png", 988, 5, "新品", "趣味桥梁书，适合轻松阅读兑换。"),
    physicalProduct("p-stationery-pencil-box-3", "思悦定制文具盒3", "/product-images/pencil-box.png", 388, 6, "热门", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-stationery-pencil-4", "思悦定制铅笔4", "/product-images/pencil.png", 188, 21, "新品", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-eraser-4", "思悦定制橡皮4", "/product-images/eraser.png", 88, 23, "限时", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-book-charlottes-web", "夏洛的网", "/product-images/charlottes-web.png", 988, 3, "热门", "经典文学读物，适合进阶阅读兑换。"),
    physicalProduct("p-sticker-meimei-2", "梅梅贴纸2", "/product-images/meimei-sticker.png", 66, 26, "限时", "梅梅主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-5", "思悦定制笔记本5", "/product-images/notebook.png", 288, 10, "热门", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-stationery-pencil-5", "思悦定制铅笔5", "/product-images/pencil.png", 188, 17, "热门", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-pencil-box-4", "思悦定制文具盒4", "/product-images/pencil-box.png", 388, 5, "限时", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-stationery-eraser-5", "思悦定制橡皮5", "/product-images/eraser.png", 88, 20, "热门", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-stationery-notebook-6", "思悦定制笔记本6", "/product-images/notebook.png", 288, 8, "限时", "思悦定制笔记本，适合课堂笔记和错题整理。"),
  ],
  orders: [],
  ledgers: [],
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
  const [viewSwitcherOpen, setViewSwitcherOpen] = useState(false);
  const [studentPage, setStudentPage] = useState<StudentPage>("mall");
  const [adminPage, setAdminPage] = useState<AdminPage>("products");
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
        (product) => product.status === "active",
      ),
    [store.products],
  );

  const selectedProduct = store.products.find((item) => item.id === selectedProductId);
  const confirmProduct = store.products.find((item) => item.id === confirmProductId);
  const currentPageLabel =
    viewMode === "student"
      ? studentPage === "mall"
        ? "商城首页"
        : "我的兑换"
      : {
          products: "商品管理",
          orders: "订单管理",
          ledger: "积分流水",
          reports: "数据报表",
        }[adminPage];

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
        count: current.count + (order.quantity ?? 1),
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

  function exchangeProduct(product: Product, quantity: number) {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const totalPoints = product.points * safeQuantity;
    if (product.status !== "active") return;
    if (product.stock < safeQuantity) return;
    if (store.student.points < totalPoints) return;

    const order: Order = {
      id: newOrderId(store.orders.length),
      studentName: store.student.name,
      phone: store.student.phone,
      productId: product.id,
      productName: product.name,
      productType: product.type,
      points: totalPoints,
      quantity: safeQuantity,
      createdAt: nowText(),
      status: product.type === "virtual" ? "completed" : "pending_pickup",
    };

    setStore((current) => ({
      ...current,
      student: {
        ...current.student,
        points: current.student.points - totalPoints,
      },
      products: current.products.map((item) =>
        item.id === product.id ? { ...item, stock: Math.max(0, item.stock - safeQuantity) } : item,
      ),
      orders: [order, ...current.orders],
      ledgers: [
        addLedger({
          studentName: current.student.name,
          type: "兑换扣减",
          change: -totalPoints,
          orderId: order.id,
          note:
            product.type === "virtual"
              ? `兑换虚拟商品 ${safeQuantity} 件，立即完成。`
              : `兑换实物商品 ${safeQuantity} 件，生成待领取订单。`,
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
          product.id === order.productId ? { ...product, stock: product.stock + (order.quantity ?? 1) } : product,
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
    <main className={`app-shell ${viewMode === "student" ? "student-theme" : "admin-theme"}`}>
      <header className={`topbar ${viewMode === "student" ? "student-topbar" : "admin-topbar"}`}>
        {viewMode === "admin" && (
          <div>
            <p className="eyebrow">本地最小 MVP</p>
            <h1>积分商城原型</h1>
          </div>
        )}
        {viewMode === "student" && (
          <nav className="student-page-tabs" aria-label="学生端菜单">
            <button className={studentPage === "mall" ? "active" : ""} onClick={() => setStudentPage("mall")}>
              <MallIcon aria-hidden />
              Mall
            </button>
            <button className={studentPage === "orders" ? "active" : ""} onClick={() => setStudentPage("orders")}>
              <MyIcon aria-hidden />
              My
            </button>
          </nav>
        )}
      </header>

      <ViewModeSwitcher
        open={viewSwitcherOpen}
        value={viewMode}
        onToggle={() => setViewSwitcherOpen((current) => !current)}
        onChange={setViewMode}
        onReset={resetDemo}
      />

      <section className={`workspace ${viewMode === "student" ? "student-workspace" : "admin-workspace"}`}>
        {viewMode === "student" ? (
          <section className="panel-area student-panel-area">
            {studentPage === "mall" ? (
                <StudentMall
                  products={activeProducts}
                  studentPoints={store.student.points}
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
        ) : (
          <>
            <nav className="side-nav" aria-label="后台菜单">
              {[
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
            <section className="panel-area admin-panel-area">
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
          studentPoints={store.student.points}
          onCancel={() => setConfirmProductId(null)}
          onSubmit={(quantity) => exchangeProduct(confirmProduct, quantity)}
        />
      )}

      {editingProduct && (
        <ProductEditor product={editingProduct} onCancel={() => setEditingProduct(null)} onSave={saveProduct} />
      )}

      <DeveloperMode
        context={{
          view: viewMode === "student" ? "学生端" : "后台端",
          page: currentPageLabel,
          studentPoints: store.student.points,
          productCount: store.products.length,
          activeProductCount: store.products.filter((product) => product.status === "active").length,
          pendingOrderCount: store.orders.filter((order) => order.status === "pending_pickup").length,
          completedOrderCount: store.orders.filter((order) => order.status === "completed").length,
          cancelledOrderCount: store.orders.filter((order) => order.status === "cancelled").length,
        }}
      />
    </main>
  );
}

function ViewModeSwitcher({
  open,
  value,
  onToggle,
  onChange,
  onReset,
}: {
  open: boolean;
  value: ViewMode;
  onToggle: () => void;
  onChange: (value: ViewMode) => void;
  onReset: () => void;
}) {
  return (
    <aside className={`view-switcher ${open ? "open" : "collapsed"}`} aria-label="视角切换">
      <button
        className="view-switcher-toggle"
        data-dev-note="view-switch"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "折叠视角切换" : "展开视角切换"}
      >
        {open ? <CollapseRightIcon aria-hidden /> : <ExpandLeftIcon aria-hidden />}
      </button>
      {open && (
        <div className="view-switcher-panel">
          <button
            type="button"
            className={value === "student" ? "active" : ""}
            data-dev-note="view-switch"
            onClick={() => onChange("student")}
          >
            学生视角
          </button>
          <button
            type="button"
            className={value === "admin" ? "active" : ""}
            data-dev-note="view-switch"
            onClick={() => onChange("admin")}
          >
            后台视角
          </button>
          <button
            type="button"
            className="view-switcher-reset"
            data-dev-note="reset-demo"
            onClick={onReset}
          >
            重置数据
          </button>
        </div>
      )}
    </aside>
  );
}

function StudentMall({
  products,
  studentPoints,
  onConfirm,
}: {
  products: Product[];
  studentPoints: number;
  onConfirm: (id: string) => void;
}) {
  const featuredProduct = products[0];
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const pageProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  return (
    <div className="student-mall-view" data-dev-note="student-mall-page">
      <section
        className="student-hero"
        style={{ "--student-hero-image": `url(${publicAssetPath("hero-bg.png")})` } as CSSProperties}
      >
        <div>
          <p className="student-kicker">SIYUE POINTS MALL</p>
          <h2>积分好礼兑换</h2>
          <p>用课堂积分兑换学习权益和校区周边，库存与积分状态实时校验。</p>
        </div>
        <div className="student-wallet" data-dev-note="student-points">
          <span>当前积分</span>
          <strong>{studentPoints}</strong>
          {featuredProduct && <small>可兑换 {featuredProduct.name}</small>}
        </div>
      </section>
      <div className="product-grid student-product-grid">
        {pageProducts.map((product) => {
          const soldOut = product.stock <= 0;
          const notEnough = studentPoints < product.points;
          return (
            <article className="product-card student-product-card" data-dev-note="product-card" key={product.id}>
              <div className="student-card-artwork">
                <ProductArtwork product={product} />
                <span className="tag">{product.tag}</span>
              </div>
              <div className="student-card-copy">
                <h3>{product.name}</h3>
              </div>
              <div className="student-card-footer">
                <strong>{product.points}<span>积分</span></strong>
              </div>
              <div className="card-actions">
                <button className="primary-button" data-dev-note="exchange-button" disabled={soldOut || notEnough} onClick={() => onConfirm(product.id)}>
                  立即兑换
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {products.length > 0 && (
        <nav className="student-pagination" aria-label="商品分页">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={currentPage === page ? "active" : ""}
              onClick={() => setCurrentPage(page)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ))}
          {totalPages > 1 && (
            <button
              type="button"
              aria-label="下一页"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <ArrowRightIcon aria-hidden />
            </button>
          )}
        </nav>
      )}
      {!products.length && <div className="empty">暂无可兑换商品</div>}
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
    <div className="student-orders-view" data-dev-note="student-orders-page">
      <PanelHeader title="我的兑换" desc="学生查看兑换记录，待领取实物商品可在领取前取消。" />
      <div className="toolbar">
        <div className="segmented compact" data-dev-note="student-order-filter">
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
        headers={["订单号", "商品", "数量", "积分", "时间", "状态", "操作"]}
        rows={filteredOrders.map((order) => [
          order.id,
          order.productName,
          `x${order.quantity ?? 1}`,
          `${order.points}`,
          order.createdAt,
          statusText[order.status],
          order.status === "pending_pickup" && order.productType === "physical" ? (
            <button className="danger-button" data-dev-note="cancel-order" onClick={() => onCancel(order.id)}>
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
    <div data-dev-note="admin-products-page">
      <PanelHeader title="后台商品管理页" desc="配置商品、上下架、查看类型和库存状态。" action={<button className="primary-button" data-dev-note="add-product" onClick={onAdd}>新增商品</button>} />
      <DataTable
        headers={["商品", "类型", "积分", "库存", "标签", "状态", "交付方式", "操作"]}
        rows={products.map((product) => [
          product.name,
          typeText[product.type],
          `${product.points}`,
          product.stock <= 3 && product.type === "physical" ? `预警：${product.stock}` : `${product.stock}`,
          product.tag,
          <span data-dev-note="product-status">{product.status === "active" ? "上架" : "下架"}</span>,
          product.delivery,
          <div className="inline-actions" key={product.id}>
            <button className="ghost-button" data-dev-note="edit-product" onClick={() => onEdit(product)}>编辑</button>
            <button className="ghost-button" data-dev-note="product-status" onClick={() => onToggle(product.id)}>
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
    <div data-dev-note="admin-orders-page">
      <PanelHeader title="后台订单管理页" desc="虚拟商品兑换后立即完成；实物商品待领取，可确认领取或取消。" />
      <DataTable
        headers={["订单号", "学生 / 手机号", "商品", "数量", "类型", "积分", "下单时间", "状态", "操作"]}
        rows={orders.map((order) => [
          order.id,
          `${order.studentName} / ${order.phone}`,
          order.productName,
          `x${order.quantity ?? 1}`,
          typeText[order.productType],
          `${order.points}`,
          order.createdAt,
          <span data-dev-note="order-status">{statusText[order.status]}</span>,
          order.status === "pending_pickup" ? (
            <div className="inline-actions" key={order.id}>
              <button className="primary-button" data-dev-note="complete-order" onClick={() => onComplete(order.id)}>确认领取</button>
              <button className="danger-button" data-dev-note="cancel-order" onClick={() => onCancel(order.id)}>取消订单</button>
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
    <div data-dev-note="ledger-page">
      <PanelHeader title="后台积分流水页" desc="展示兑换扣减、取消返还、后台调整和虚拟发放记录。" />
      <DataTable
        headers={["学生", "类型", "积分变动", "关联订单", "时间", "备注"]}
        rows={ledgers.map((ledger) => [
          ledger.studentName,
          ledger.type,
          <span data-dev-note="ledger-change">{ledger.change > 0 ? `+${ledger.change}` : `${ledger.change}`}</span>,
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
    <div data-dev-note="reports-page">
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
      <div className="detail-layout" data-dev-note="product-detail">
        <ProductArtwork product={product} large />
        <div>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <dl className="detail-list">
            <div><dt>所需积分</dt><dd>{product.points}</dd></div>
            <div><dt>当前库存</dt><dd data-dev-note="product-stock">{product.stock}</dd></div>
            <div><dt>兑换说明</dt><dd>{product.delivery}</dd></div>
          </dl>
          <button className="primary-button" data-dev-note="exchange-button" disabled={disabled} onClick={onConfirm}>
            立即兑换
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ProductArtwork({ product, large = false }: { product: Product; large?: boolean }) {
  const imageSrc = product.image.trim();
  const normalizedImageSrc = imageSrc.replace(/^\/+/, "");
  const hasImage = normalizedImageSrc.startsWith("product-images/");
  const imageUrl = publicAssetPath(normalizedImageSrc);
  return (
    <div className={`product-image ${large ? "large" : ""}`} aria-label={`${product.name} 商品图`}>
      {hasImage ? <img src={imageUrl} alt={product.name} /> : <span>商品图占位</span>}
    </div>
  );
}

function ConfirmExchange({
  product,
  studentPoints,
  onCancel,
  onSubmit,
}: {
  product: Product;
  studentPoints: number;
  onCancel: () => void;
  onSubmit: (quantity: number) => void;
}) {
  const maxByPoints = Math.floor(studentPoints / product.points);
  const maxQuantity = Math.max(0, Math.min(product.stock, maxByPoints));
  const [quantity, setQuantity] = useState(maxQuantity > 0 ? 1 : 0);
  const totalPoints = product.points * quantity;
  const disabled = quantity < 1 || quantity > maxQuantity;

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.max(1, Math.min(maxQuantity, Math.floor(nextQuantity) || 1)));
  }

  return (
    <Modal title="兑换确认" className="exchange-modal" onClose={onCancel}>
      <div className="confirm-exchange-layout" data-dev-note="exchange-confirm">
        <ProductArtwork product={product} large />
        <div className="confirm-copy">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <dl className="detail-list compact">
            <div><dt>单件积分</dt><dd>{product.points}</dd></div>
          </dl>
          <div className="confirm-purchase-row">
            <div className="quantity-picker" aria-label="选择商品数量">
              <span>兑换数量</span>
              <div>
                <button type="button" disabled={quantity <= 1} onClick={() => updateQuantity(quantity - 1)}>
                  <MinusCircleIcon aria-hidden />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(event) => updateQuantity(Number(event.target.value))}
                />
                <button type="button" disabled={quantity >= maxQuantity} onClick={() => updateQuantity(quantity + 1)}>
                  <PlusCircleIcon aria-hidden />
                </button>
              </div>
            </div>
            <p className="confirm-total">本次将扣除 <strong>{totalPoints}</strong> 积分。</p>
          </div>
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
      </div>
      <div className="modal-actions">
        <button className="text-button" onClick={onCancel}>再想想</button>
        <button className="primary-button" data-dev-note="exchange-confirm" disabled={disabled} onClick={() => onSubmit(quantity)}>确认兑换</button>
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
      <div className="form-grid" data-dev-note="product-editor">
        <label>
          商品名称
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label>
          商品图路径
          <input
            placeholder="/product-images/example.png"
            value={draft.image}
            onChange={(event) => setDraft({ ...draft, image: event.target.value || "品" })}
          />
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
        <button className="primary-button" data-dev-note="product-editor" disabled={!canSave} onClick={() => onSave(draft)}>保存商品</button>
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

function Modal({
  title,
  children,
  className,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal ${className ?? ""}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="关闭">
            <CloseIcon aria-hidden />
          </button>
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
