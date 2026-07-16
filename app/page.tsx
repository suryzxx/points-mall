"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { DeveloperMode } from "./DeveloperMode";
import {
  ArrowRightIcon,
  BackToTopIcon,
  CloseIcon,
  CollapseRightIcon,
  DailyGoodsIcon,
  ExpandLeftIcon,
  LearningMaterialIcon,
  MallIcon,
  MinusCircleIcon,
  MyIcon,
  PlusCircleIcon,
  SearchIcon,
  StationeryIcon,
  ToyIcon,
} from "./icons";

type ProductType = "virtual" | "physical";
type ProductCategory = "daily" | "toy" | "stationery" | "learning";
type ProductCategoryFilter = "all" | ProductCategory;
type ProductTag = "新品" | "热门" | "限时";
type ProductStatus = "active" | "inactive";
type OrderStatus = "pending_pickup" | "completed" | "cancelled";
type LedgerType = "兑换扣减" | "取消返还" | "后台调整" | "虚拟发放" | "课后任务" | "考勤奖励" | "课堂奖励";
type CampusId = "binjiang" | "xihu" | "gongshu";

type Product = {
  id: string;
  name: string;
  image: string;
  type: ProductType;
  category: ProductCategory;
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
  campusId: CampusId;
  campusName: string;
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

type InventoryItem = {
  productId: string;
  campusId: CampusId;
  available: number;
  locked: number;
  used: number;
  warningThreshold: number;
  replenishTarget: number;
  storageLocation: string;
  updatedAt: string;
};

type Store = {
  student: {
    name: string;
    phone: string;
    points: number;
    campusId: CampusId;
    recentCampusIds: CampusId[];
  };
  products: Product[];
  inventory: InventoryItem[];
  orders: Order[];
  ledgers: Ledger[];
};

type ViewMode = "student" | "admin";
type StudentPage = "mall" | "orders";
type AdminPage = "products" | "inventory" | "verify" | "orders" | "ledger";

const STORAGE_KEY = "points-mall-mvp-state";
const ORDERS_PER_PAGE = 8;
const PUBLIC_ASSET_BASE = import.meta.env.BASE_URL;
const productCategoryText: Record<ProductCategory, string> = {
  daily: "生活用品",
  toy: "玩具",
  stationery: "文具",
  learning: "学习资料",
};
const productCategoryOptions = Object.entries(productCategoryText) as [ProductCategory, string][];
const productCategoryFilterOptions: [ProductCategoryFilter, string][] = [
  ["all", "全部"],
  ...productCategoryOptions,
];
const productCategoryIcons: Partial<Record<ProductCategoryFilter, typeof DailyGoodsIcon>> = {
  daily: DailyGoodsIcon,
  toy: ToyIcon,
  stationery: StationeryIcon,
  learning: LearningMaterialIcon,
};
const campuses: { id: CampusId; name: string }[] = [
  { id: "binjiang", name: "滨江校区" },
  { id: "xihu", name: "西湖校区" },
  { id: "gongshu", name: "拱墅校区" },
];
const defaultCampusId: CampusId = "binjiang";

function campusName(campusId: CampusId) {
  return campuses.find((campus) => campus.id === campusId)?.name ?? "滨江校区";
}

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
  category: ProductCategory,
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
    category,
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
    campusId: "binjiang",
    recentCampusIds: ["binjiang", "xihu"],
  },
  products: [
    physicalProduct("p-stationery-notebook-1", "思悦定制笔记本1", "/product-images/notebook.png", "stationery", 288, 12, "新品", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-book-magic-tree-house", "神奇树屋", "/product-images/magic-tree-house.png", "learning", 988, 5, "热门", "经典章节书，适合课后阅读兑换。"),
    physicalProduct("p-sticker-meimei", "梅梅贴纸", "/product-images/meimei-sticker.png", "toy", 66, 28, "新品", "角色主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-pencil-1", "思悦定制铅笔1", "/product-images/pencil.png", "stationery", 188, 20, "热门", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-eraser-1", "思悦定制橡皮1", "/product-images/eraser.png", "stationery", 88, 23, "新品", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-book-magic-school-bus", "神奇校车", "/product-images/magic-school-bus.png", "learning", 988, 4, "热门", "科普阅读书，适合拓展知识面。"),
    physicalProduct("p-stationery-pencil-box-1", "思悦定制文具盒1", "/product-images/pencil-box.png", "stationery", 388, 8, "限时", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-sticker-sixiaodou", "思小豆贴纸", "/product-images/sixiaodou-sticker.png", "toy", 66, 29, "热门", "思小豆主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-2", "思悦定制笔记本2", "/product-images/notebook.png", "stationery", 288, 10, "热门", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-stationery-pencil-2", "思悦定制铅笔2", "/product-images/pencil.png", "stationery", 188, 16, "新品", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-book-national-geographic", "国家探索", "/product-images/national-geographic.png", "learning", 988, 4, "限时", "探索主题读物，适合课外阅读兑换。"),
    physicalProduct("p-stationery-eraser-2", "思悦定制橡皮2", "/product-images/eraser.png", "stationery", 88, 22, "热门", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-stationery-pencil-box-2", "思悦定制文具盒2", "/product-images/pencil-box.png", "stationery", 388, 6, "新品", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-sticker-yueyue", "悦悦贴纸", "/product-images/yueyue-sticker.png", "toy", 66, 30, "新品", "悦悦主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-3", "思悦定制笔记本3", "/product-images/notebook.png", "stationery", 288, 11, "限时", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-book-oxford-potato-pals", "牛津小土豆", "/product-images/oxford-potato-pals.png", "learning", 988, 6, "热门", "牛津分级阅读读物，适合英语阅读积累。"),
    physicalProduct("p-stationery-pencil-3", "思悦定制铅笔3", "/product-images/pencil.png", "stationery", 188, 19, "限时", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-eraser-3", "思悦定制橡皮3", "/product-images/eraser.png", "stationery", 88, 25, "新品", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-sticker-songsong", "松松贴纸", "/product-images/songsong-sticker.png", "toy", 66, 28, "热门", "松松主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-4", "思悦定制笔记本4", "/product-images/notebook.png", "stationery", 288, 9, "新品", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-book-fly-guy", "苍蝇小子", "/product-images/fly-guy.png", "learning", 988, 5, "新品", "趣味桥梁书，适合轻松阅读兑换。"),
    physicalProduct("p-stationery-pencil-box-3", "思悦定制文具盒3", "/product-images/pencil-box.png", "stationery", 388, 6, "热门", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-stationery-pencil-4", "思悦定制铅笔4", "/product-images/pencil.png", "stationery", 188, 21, "新品", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-eraser-4", "思悦定制橡皮4", "/product-images/eraser.png", "stationery", 88, 23, "限时", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-book-charlottes-web", "夏洛的网", "/product-images/charlottes-web.png", "learning", 988, 3, "热门", "经典文学读物，适合进阶阅读兑换。"),
    physicalProduct("p-sticker-meimei-2", "梅梅贴纸2", "/product-images/meimei-sticker.png", "toy", 66, 26, "限时", "梅梅主题贴纸，可用于手账和作业奖励。"),
    physicalProduct("p-stationery-notebook-5", "思悦定制笔记本5", "/product-images/notebook.png", "stationery", 288, 10, "热门", "思悦定制笔记本，适合课堂笔记和错题整理。"),
    physicalProduct("p-stationery-pencil-5", "思悦定制铅笔5", "/product-images/pencil.png", "stationery", 188, 17, "热门", "思悦定制铅笔，适合日常书写练习。"),
    physicalProduct("p-stationery-pencil-box-4", "思悦定制文具盒4", "/product-images/pencil-box.png", "stationery", 388, 5, "限时", "思悦定制文具盒，可收纳常用学习用品。"),
    physicalProduct("p-stationery-eraser-5", "思悦定制橡皮5", "/product-images/eraser.png", "stationery", 88, 20, "热门", "思悦定制橡皮，适合课堂和作业订正。"),
    physicalProduct("p-stationery-notebook-6", "思悦定制笔记本6", "/product-images/notebook.png", "stationery", 288, 8, "限时", "思悦定制笔记本，适合课堂笔记和错题整理。"),
  ],
  inventory: [],
  orders: [
    {
      id: "MALL20260715001",
      studentName: "王小明",
      phone: "13800000001",
      campusId: "binjiang",
      campusName: "滨江校区",
      productId: "p-sticker-meimei",
      productName: "梅梅贴纸",
      productType: "physical",
      points: 132,
      quantity: 2,
      createdAt: "2026-07-15 10:12",
      status: "completed",
    },
    {
      id: "MALL20260714002",
      studentName: "王小明",
      phone: "13800000001",
      campusId: "xihu",
      campusName: "西湖校区",
      productId: "p-stationery-pencil-2",
      productName: "思悦定制铅笔2",
      productType: "physical",
      points: 376,
      quantity: 2,
      createdAt: "2026-07-14 17:45",
      status: "pending_pickup",
    },
    {
      id: "MALL20260713003",
      studentName: "王小明",
      phone: "13800000001",
      campusId: "binjiang",
      campusName: "滨江校区",
      productId: "p-stationery-eraser-1",
      productName: "思悦定制橡皮1",
      productType: "physical",
      points: 88,
      quantity: 1,
      createdAt: "2026-07-13 16:20",
      status: "completed",
    },
    {
      id: "MALL20260712004",
      studentName: "王小明",
      phone: "13800000001",
      campusId: "gongshu",
      campusName: "拱墅校区",
      productId: "p-stationery-pencil-box-2",
      productName: "思悦定制文具盒2",
      productType: "physical",
      points: 388,
      quantity: 1,
      createdAt: "2026-07-12 11:08",
      status: "pending_pickup",
    },
    {
      id: "MALL20260711005",
      studentName: "王小明",
      phone: "13800000001",
      campusId: "binjiang",
      campusName: "滨江校区",
      productId: "p-sticker-sixiaodou",
      productName: "思小豆贴纸",
      productType: "physical",
      points: 66,
      quantity: 1,
      createdAt: "2026-07-11 19:30",
      status: "cancelled",
    },
  ],
  ledgers: [
    {
      id: "l-demo-reward-1",
      studentName: "王小明",
      type: "课后任务",
      change: 20,
      orderId: "-",
      createdAt: "2026-07-16 18:20",
      note: "完成课后任务，奖励 20 积分。",
    },
    {
      id: "l-demo-reward-2",
      studentName: "王小明",
      type: "考勤奖励",
      change: 20,
      orderId: "-",
      createdAt: "2026-07-16 13:55",
      note: "按时到课，奖励 20 积分。",
    },
    {
      id: "l-demo-reward-3",
      studentName: "王小明",
      type: "课堂奖励",
      change: 35,
      orderId: "-",
      createdAt: "2026-07-15 19:05",
      note: "课堂表现优秀，奖励 35 积分。",
    },
    {
      id: "l-demo-reward-4",
      studentName: "王小明",
      type: "课堂奖励",
      change: 30,
      orderId: "-",
      createdAt: "2026-07-14 19:10",
      note: "课堂互动积极，奖励 30 积分。",
    },
    {
      id: "l-demo-1",
      studentName: "王小明",
      type: "兑换扣减",
      change: -132,
      orderId: "MALL20260715001",
      createdAt: "2026-07-15 10:12",
      note: "兑换实物商品 2 件，已领取完成。",
    },
    {
      id: "l-demo-2",
      studentName: "王小明",
      type: "兑换扣减",
      change: -376,
      orderId: "MALL20260714002",
      createdAt: "2026-07-14 17:45",
      note: "兑换实物商品 2 件，生成待领取订单。",
    },
    {
      id: "l-demo-3",
      studentName: "王小明",
      type: "兑换扣减",
      change: -88,
      orderId: "MALL20260713003",
      createdAt: "2026-07-13 16:20",
      note: "兑换实物商品 1 件，已领取完成。",
    },
    {
      id: "l-demo-4",
      studentName: "王小明",
      type: "兑换扣减",
      change: -388,
      orderId: "MALL20260712004",
      createdAt: "2026-07-12 11:08",
      note: "兑换实物商品 1 件，生成待领取订单。",
    },
    {
      id: "l-demo-5",
      studentName: "王小明",
      type: "兑换扣减",
      change: -66,
      orderId: "MALL20260711005",
      createdAt: "2026-07-11 19:30",
      note: "兑换实物商品 1 件，生成待领取订单。",
    },
    {
      id: "l-demo-6",
      studentName: "王小明",
      type: "取消返还",
      change: 66,
      orderId: "MALL20260711005",
      createdAt: "2026-07-11 19:45",
      note: "学生取消兑换，积分返还，库存释放。",
    },
  ],
};

const emptyProduct: Product = {
  id: "",
  name: "",
  image: "品",
  type: "physical",
  category: "stationery",
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

function nowText() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function newOrderId(orderCount: number) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MALL${day}${String(orderCount + 1).padStart(3, "0")}`;
}

function inferProductCategory(product: Pick<Product, "id" | "name">): ProductCategory {
  const value = `${product.id} ${product.name}`;
  if (/贴纸/.test(value)) return "toy";
  if (/书|树屋|校车|探索|小土豆|苍蝇|夏洛/.test(value)) return "learning";
  if (/本|铅笔|橡皮|文具盒/.test(value)) return "stationery";
  return "daily";
}

function splitStock(totalStock: number, campusIndex: number) {
  const base = Math.floor(totalStock / campuses.length);
  const remainder = totalStock % campuses.length;
  return base + (campusIndex < remainder ? 1 : 0);
}

function createInventoryItem(product: Product, campusId: CampusId, campusIndex: number): InventoryItem {
  const available = splitStock(Math.max(0, product.stock), campusIndex);
  return {
    productId: product.id,
    campusId,
    available,
    locked: 0,
    used: 0,
    warningThreshold: Math.max(2, Math.ceil(Math.max(1, product.stock) * 0.15)),
    replenishTarget: Math.max(10, product.stock),
    storageLocation: `${campusName(campusId)}前台柜`,
    updatedAt: "2026-07-16 10:00",
  };
}

function normalizeInventory(products: Product[], inventory?: InventoryItem[]) {
  const existing = new Map(
    (inventory ?? []).map((item) => [`${item.productId}:${item.campusId}`, item]),
  );
  return products.flatMap((product) =>
    campuses.map((campus, campusIndex) => {
      const current = existing.get(`${product.id}:${campus.id}`);
      if (current) {
        return {
          ...current,
          campusId: current.campusId ?? campus.id,
          available: current.available ?? 0,
          locked: current.locked ?? 0,
          used: current.used ?? 0,
          warningThreshold: current.warningThreshold ?? 2,
          replenishTarget: current.replenishTarget ?? Math.max(10, product.stock),
          storageLocation: current.storageLocation || `${campus.name}前台柜`,
          updatedAt: current.updatedAt || "2026-07-16 10:00",
        };
      }
      return createInventoryItem(product, campus.id, campusIndex);
    }),
  );
}

function availableStockForProduct(inventory: InventoryItem[], productId: string) {
  return inventory
    .filter((item) => item.productId === productId)
    .reduce((total, item) => total + item.available, 0);
}

function normalizeStore(store: Store): Store {
  const products = store.products.map((product) => ({
    ...product,
    type: "physical" as ProductType,
    category: product.category ?? inferProductCategory(product),
    delivery: product.delivery || "线下领取，请到校区前台出示兑换记录。",
  }));
  const inventory = normalizeInventory(products, store.inventory);
  return {
    ...store,
    student: {
      ...store.student,
      campusId: store.student.campusId ?? defaultCampusId,
      recentCampusIds: store.student.recentCampusIds ?? [store.student.campusId ?? defaultCampusId],
    },
    products: products.map((product) => ({
      ...product,
      stock: availableStockForProduct(inventory, product.id),
    })),
    inventory,
    orders: store.orders.map((order) => ({
      ...order,
      productType: "physical",
      quantity: order.quantity ?? 1,
      campusId: order.campusId ?? defaultCampusId,
      campusName: order.campusName || campusName(order.campusId ?? defaultCampusId),
    })),
  };
}

function readStore(): Store {
  if (typeof window === "undefined") return normalizeStore(initialStore);
  const cached = window.localStorage.getItem(STORAGE_KEY);
  if (!cached) return normalizeStore(initialStore);
  try {
    return normalizeStore(JSON.parse(cached) as Store);
  } catch {
    return normalizeStore(initialStore);
  }
}

export default function PointsMallMvp() {
  const [store, setStore] = useState<Store>(() => normalizeStore(initialStore));
  const [hydrated, setHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("student");
  const [viewSwitcherOpen, setViewSwitcherOpen] = useState(false);
  const [studentPage, setStudentPage] = useState<StudentPage>("mall");
  const [adminPage, setAdminPage] = useState<AdminPage>("products");
  const [productCategory, setProductCategory] = useState<ProductCategoryFilter>("all");
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [confirmProductId, setConfirmProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [inventoryProductId, setInventoryProductId] = useState<string | null>(null);

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
          (productCategory === "all" || product.category === productCategory),
      ),
    [productCategory, store.products],
  );

  const selectedProduct = store.products.find((item) => item.id === selectedProductId);
  const confirmProduct = store.products.find((item) => item.id === confirmProductId);
  const inventoryProduct = store.products.find((item) => item.id === inventoryProductId);

  function productsWithInventoryStock(products: Product[], inventory: InventoryItem[]) {
    return products.map((product) => ({
      ...product,
      stock: availableStockForProduct(inventory, product.id),
    }));
  }

  function addLedger(entry: Omit<Ledger, "id" | "createdAt">): Ledger {
    return {
      ...entry,
      id: `l-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: nowText(),
    };
  }

  function exchangeProduct(product: Product, quantity: number, campusId: CampusId) {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const totalPoints = product.points * safeQuantity;
    const campusInventory = store.inventory.find(
      (item) => item.productId === product.id && item.campusId === campusId,
    );
    if (product.status !== "active") return;
    if (!campusInventory || campusInventory.available < safeQuantity) return;
    if (store.student.points < totalPoints) return;

    const order: Order = {
      id: newOrderId(store.orders.length),
      studentName: store.student.name,
      phone: store.student.phone,
      campusId,
      campusName: campusName(campusId),
      productId: product.id,
      productName: product.name,
      productType: "physical",
      points: totalPoints,
      quantity: safeQuantity,
      createdAt: nowText(),
      status: "pending_pickup",
    };

    setStore((current) => {
      const nextInventory = current.inventory.map((item) =>
        item.productId === product.id && item.campusId === campusId
          ? {
              ...item,
              available: Math.max(0, item.available - safeQuantity),
              locked: item.locked + safeQuantity,
              updatedAt: nowText(),
            }
          : item,
      );
      return {
        ...current,
        student: {
          ...current.student,
          points: current.student.points - totalPoints,
        },
        products: productsWithInventoryStock(current.products, nextInventory),
        inventory: nextInventory,
        orders: [order, ...current.orders],
        ledgers: [
          addLedger({
            studentName: current.student.name,
            type: "兑换扣减",
            change: -totalPoints,
            orderId: order.id,
            note: `兑换商品 ${safeQuantity} 件，锁定${campusName(campusId)}库存。`,
          }),
          ...current.ledgers,
        ],
      };
    });
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
      const nextInventory = current.inventory.map((item) =>
        item.productId === order.productId && item.campusId === order.campusId
          ? {
              ...item,
              available: item.available + (order.quantity ?? 1),
              locked: Math.max(0, item.locked - (order.quantity ?? 1)),
              updatedAt: nowText(),
            }
          : item,
      );
      return {
        ...current,
        student: {
          ...current.student,
          points: current.student.points + order.points,
        },
        products: productsWithInventoryStock(current.products, nextInventory),
        inventory: nextInventory,
        orders: current.orders.map((item) =>
          item.id === orderId ? { ...item, status: "cancelled" } : item,
        ),
        ledgers: [
          addLedger({
            studentName: current.student.name,
            type: "取消返还",
            change: order.points,
            orderId: order.id,
            note: `${order.campusName}未领取前取消，积分返还，锁定库存释放。`,
          }),
          ...current.ledgers,
        ],
      };
    });
  }

  function completeOrder(orderId: string) {
    setStore((current) => {
      const order = current.orders.find((item) => item.id === orderId);
      if (!order || order.status !== "pending_pickup") return current;
      const nextInventory = current.inventory.map((item) =>
        item.productId === order.productId && item.campusId === order.campusId
          ? {
              ...item,
              locked: Math.max(0, item.locked - (order.quantity ?? 1)),
              used: item.used + (order.quantity ?? 1),
              updatedAt: nowText(),
            }
          : item,
      );
      return {
        ...current,
        products: productsWithInventoryStock(current.products, nextInventory),
        inventory: nextInventory,
        orders: current.orders.map((item) =>
          item.id === orderId ? { ...item, status: "completed" } : item,
        ),
      };
    });
  }

  function saveProduct(product: Product) {
    setStore((current) => {
      const nextProduct = {
        ...product,
        id: product.id || `p-${Date.now()}`,
        type: "physical" as ProductType,
        delivery: "线下领取，请到校区前台出示兑换记录。",
      };
      const exists = current.products.some((item) => item.id === nextProduct.id);
      const nextProducts = exists
        ? current.products.map((item) => (item.id === nextProduct.id ? nextProduct : item))
        : [nextProduct, ...current.products];
      const nextInventory = normalizeInventory(nextProducts, current.inventory);
      return {
        ...current,
        products: productsWithInventoryStock(nextProducts, nextInventory),
        inventory: nextInventory,
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
    setStore(normalizeStore(initialStore));
    setSelectedProductId(null);
    setConfirmProductId(null);
    setEditingProduct(null);
    setInventoryProductId(null);
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
          <>
            <div className="student-header-spacer" aria-hidden="true" />
            <nav className="student-page-tabs" aria-label="学生端菜单">
              <button className={studentPage === "mall" ? "active" : ""} onClick={() => setStudentPage("mall")}>
                <MallIcon aria-hidden />
                <span className="student-tab-label">Mall</span>
              </button>
              <button className={studentPage === "orders" ? "active" : ""} onClick={() => setStudentPage("orders")}>
                <MyIcon aria-hidden />
                <span className="student-tab-label">My</span>
              </button>
            </nav>
            <div className="student-header-points" data-dev-note="student-points">
              <img src={publicAssetPath("points-coin-p-icon.png")} alt="" aria-hidden="true" />
              <strong>{store.student.points}</strong>
            </div>
          </>
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
                  category={productCategory}
                  onCategoryChange={setProductCategory}
                  onConfirm={setConfirmProductId}
                />
            ) : (
                <StudentOrders
                orders={store.orders}
                products={store.products}
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
                ["inventory", "库存管理"],
                ["verify", "兑换核实"],
                ["orders", "订单管理"],
                ["ledger", "积分流水"],
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
                  inventory={store.inventory}
                  onAdd={() => setEditingProduct(emptyProduct)}
                  onEdit={(product) => setEditingProduct(product)}
                  onViewInventory={(productId) => setInventoryProductId(productId)}
                  onToggle={toggleProductStatus}
                />
              )}
              {adminPage === "inventory" && (
                <InventoryAdmin products={store.products} inventory={store.inventory} />
              )}
              {adminPage === "verify" && (
                <OrderVerification
                  orders={store.orders}
                  products={store.products}
                  onComplete={completeOrder}
                  onCancel={cancelOrder}
                />
              )}
              {adminPage === "orders" && (
                <AdminOrders orders={store.orders} onComplete={completeOrder} onCancel={cancelOrder} />
              )}
              {adminPage === "ledger" && <LedgerTable ledgers={store.ledgers} />}
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
          inventory={store.inventory}
          defaultCampusId={store.student.campusId}
          recentCampusIds={store.student.recentCampusIds}
          studentPoints={store.student.points}
          onCancel={() => setConfirmProductId(null)}
          onSubmit={(quantity, campusId) => exchangeProduct(confirmProduct, quantity, campusId)}
        />
      )}

      {inventoryProduct && (
        <InventoryDetail
          product={inventoryProduct}
          inventory={store.inventory}
          onClose={() => setInventoryProductId(null)}
        />
      )}

      {editingProduct && (
        <ProductEditor product={editingProduct} onCancel={() => setEditingProduct(null)} onSave={saveProduct} />
      )}

      <DeveloperMode />
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
            onClick={() => onChange("student")}
          >
            学生视角
          </button>
          <button
            type="button"
            className={value === "admin" ? "active" : ""}
            onClick={() => onChange("admin")}
          >
            后台视角
          </button>
          <button
            type="button"
            className="view-switcher-reset"
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
  category,
  onCategoryChange,
  onConfirm,
}: {
  products: Product[];
  category: ProductCategoryFilter;
  onCategoryChange: (value: ProductCategoryFilter) => void;
  onConfirm: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = normalizedSearchQuery
    ? products.filter((product) =>
        [product.name, product.description, product.tag, productCategoryText[product.category]]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchQuery),
      )
    : products;

  return (
    <div className="student-mall-view" data-dev-note="student-mall-page">
      <section
        className="student-hero"
        style={{ "--student-hero-image": `url(${publicAssetPath("hero-bg.png")})` } as CSSProperties}
      >
        <div>
          <p className="student-kicker">SIYUE POINTS MALL</p>
          <h2>积分好礼兑换</h2>
        </div>
      </section>
      <div className="student-filter-bar">
        <label className="student-product-search" aria-label="搜索商品">
          <SearchIcon aria-hidden />
          <input
            type="search"
            value={searchQuery}
            placeholder="搜索"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <div className="student-category-tabs" data-dev-note="product-category-filter">
          {productCategoryFilterOptions.map(([key, label]) => {
            const CategoryIcon = productCategoryIcons[key];

            return (
              <button
                key={key}
                type="button"
                className={[
                  category === key ? "active" : "",
                  key === "all" ? "student-category-tab-all" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => onCategoryChange(key)}
                aria-label={label}
              >
                <span className="student-category-tab-content">
                  {CategoryIcon ? <CategoryIcon className="student-category-tab-icon" aria-hidden /> : null}
                  <span className="student-category-tab-label">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="product-grid student-product-grid">
        {filteredProducts.map((product) => {
          function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onConfirm(product.id);
          }

          return (
            <article
              className="product-card student-product-card"
              data-dev-note="product-card"
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => onConfirm(product.id)}
              onKeyDown={handleCardKeyDown}
              aria-label={`兑换 ${product.name}`}
            >
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
            </article>
          );
        })}
      </div>
      {!filteredProducts.length && <div className="empty">暂无可兑换商品</div>}
      <button
        type="button"
        className="student-back-to-top"
        aria-label="回到顶部"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <BackToTopIcon aria-hidden />
      </button>
    </div>
  );
}

function StudentOrders({
  orders,
  products,
  filter,
  onFilterChange,
  onCancel,
}: {
  orders: Order[];
  products: Product[];
  filter: "all" | OrderStatus;
  onFilterChange: (value: "all" | OrderStatus) => void;
  onCancel: (id: string) => void;
}) {
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const filteredOrders = orders.filter((order) => filter === "all" || order.status === filter);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const pageOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, orders.length]);

  return (
    <div className="student-orders-view" data-dev-note="student-orders-page">
      <PanelHeader title="我的兑换" />
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
        headers={["订单号", "商品图", "商品", "领取校区", "数量", "积分", "时间", "状态", "操作"]}
        rows={pageOrders.map((order) => {
          const product = productMap.get(order.productId);
          return [
            order.id,
            product ? (
              <ProductArtwork product={product} className="order-product-image" />
            ) : (
              <div className="order-product-image product-image"><span>商品图</span></div>
            ),
            order.productName,
            order.campusName,
            `x${order.quantity ?? 1}`,
            `${order.points}`,
            order.createdAt,
            statusText[order.status],
            order.status === "pending_pickup" && order.productType === "physical" ? (
              <button className="danger-button" data-dev-note="cancel-order" onClick={() => onCancel(order.id)}>
                取消兑换
              </button>
            ) : (
              ""
            ),
          ];
        })}
      />
      {totalPages > 1 && (
        <nav className="student-pagination orders-pagination" aria-label="订单分页">
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
    </div>
  );
}

function ProductAdmin({
  products,
  inventory,
  onAdd,
  onEdit,
  onViewInventory,
  onToggle,
}: {
  products: Product[];
  inventory: InventoryItem[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onViewInventory: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategoryFilter>("all");
  const [tagFilter, setTagFilter] = useState<"all" | ProductTag>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery);
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesTag = tagFilter === "all" || product.tag === tagFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesQuery && matchesCategory && matchesTag && matchesStatus;
  });
  const inventoryByProduct = useMemo(() => {
    const result = new Map<string, InventoryItem[]>();
    inventory.forEach((item) => {
      result.set(item.productId, [...(result.get(item.productId) ?? []), item]);
    });
    return result;
  }, [inventory]);

  return (
    <div data-dev-note="admin-products-page">
      <PanelHeader title="后台商品管理页" action={<button className="primary-button" data-dev-note="add-product" onClick={onAdd}>新增商品</button>} />
      <div className="admin-filters" aria-label="商品筛选">
        <label>
          搜索商品
          <input value={query} placeholder="商品名" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          商品分类
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as ProductCategoryFilter)}>
            {productCategoryFilterOptions.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          商品标签
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value as "all" | ProductTag)}>
            <option value="all">全部</option>
            <option value="新品">新品</option>
            <option value="热门">热门</option>
            <option value="限时">限时</option>
          </select>
        </label>
        <label>
          上架状态
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | ProductStatus)}>
            <option value="all">全部</option>
            <option value="active">上架</option>
            <option value="inactive">下架</option>
          </select>
        </label>
      </div>
      <DataTable
        headers={["商品图", "商品", "分类", "积分", "库存", "标签", "状态", "交付方式", "操作"]}
        rows={filteredProducts.map((product) => {
          const productInventory = inventoryByProduct.get(product.id) ?? [];
          const totalAvailable = productInventory.reduce((total, item) => total + item.available, 0);
          const hasWarning = productInventory.some((item) => item.available <= item.warningThreshold);
          return [
            <ProductArtwork product={product} className="admin-product-image" />,
            product.name,
            productCategoryText[product.category],
            `${product.points}`,
            hasWarning ? `预警：${totalAvailable}` : `${totalAvailable}`,
            product.tag,
            <span data-dev-note="product-status">{product.status === "active" ? "上架" : "下架"}</span>,
            product.delivery,
            <div className="inline-actions" key={product.id}>
              <button className="ghost-button" data-dev-note="edit-product" onClick={() => onEdit(product)}>编辑</button>
              <button className="ghost-button" data-dev-note="inventory-detail" onClick={() => onViewInventory(product.id)}>库存详情</button>
              <button className="ghost-button" data-dev-note="product-status" onClick={() => onToggle(product.id)}>
                {product.status === "active" ? "下架" : "上架"}
              </button>
            </div>,
          ];
        })}
      />
    </div>
  );
}

function InventoryAdmin({
  products,
  inventory,
}: {
  products: Product[];
  inventory: InventoryItem[];
}) {
  const [query, setQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState<"all" | CampusId>("all");
  const [warningOnly, setWarningOnly] = useState(false);
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const rows = inventory
    .map((item) => ({ item, product: productMap.get(item.productId) }))
    .filter(({ item, product }) => {
      if (!product) return false;
      const matchesQuery =
        !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);
      const matchesCampus = campusFilter === "all" || item.campusId === campusFilter;
      const matchesWarning = !warningOnly || item.available <= item.warningThreshold;
      return matchesQuery && matchesCampus && matchesWarning;
    });

  return (
    <div data-dev-note="inventory-page">
      <PanelHeader title="库存管理页" />
      <div className="admin-filters" aria-label="库存筛选">
        <label>
          搜索商品
          <input value={query} placeholder="商品名" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          校区
          <select value={campusFilter} onChange={(event) => setCampusFilter(event.target.value as "all" | CampusId)}>
            <option value="all">全部</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>{campus.name}</option>
            ))}
          </select>
        </label>
        <label className="checkbox-filter">
          <input
            type="checkbox"
            checked={warningOnly}
            onChange={(event) => setWarningOnly(event.target.checked)}
          />
          只看预警
        </label>
      </div>
      <DataTable
        headers={["商品", "校区", "可用库存", "锁定库存", "已出库", "预警阈值", "补货目标", "存放位置", "更新时间", "状态"]}
        rows={rows.map(({ item, product }) => [
          product?.name ?? item.productId,
          campusName(item.campusId),
          `${item.available}`,
          `${item.locked}`,
          `${item.used}`,
          `${item.warningThreshold}`,
          `${item.replenishTarget}`,
          item.storageLocation,
          item.updatedAt,
          item.available <= 0 ? "缺货" : item.available <= item.warningThreshold ? "低库存" : "正常",
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [campusFilter, setCampusFilter] = useState<"all" | CampusId>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const orderDate = order.createdAt.slice(0, 10);
    const matchesQuery =
      !normalizedQuery ||
      [order.id, order.studentName, order.phone, order.productName, order.campusName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesCampus = campusFilter === "all" || order.campusId === campusFilter;
    const matchesStartDate = !startDate || orderDate >= startDate;
    const matchesEndDate = !endDate || orderDate <= endDate;
    return matchesQuery && matchesStatus && matchesCampus && matchesStartDate && matchesEndDate;
  });

  return (
    <div data-dev-note="admin-orders-page">
      <PanelHeader title="后台订单管理页" />
      <div className="admin-filters" aria-label="订单筛选">
        <label>
          搜索订单
          <input value={query} placeholder="订单号 / 学生 / 手机号 / 商品" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          订单状态
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}>
            <option value="all">全部</option>
            <option value="pending_pickup">待领取</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </label>
        <label>
          领取校区
          <select value={campusFilter} onChange={(event) => setCampusFilter(event.target.value as "all" | CampusId)}>
            <option value="all">全部</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>{campus.name}</option>
            ))}
          </select>
        </label>
        <label>
          开始时间
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          结束时间
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>
      <DataTable
        headers={["订单号", "学生", "手机号", "领取校区", "商品", "数量", "积分", "下单时间", "状态", "操作"]}
        rows={filteredOrders.map((order) => [
          order.id,
          order.studentName,
          order.phone,
          order.campusName,
          order.productName,
          `x${order.quantity ?? 1}`,
          `${order.points}`,
          order.createdAt,
          <span data-dev-note="order-status">{statusText[order.status]}</span>,
          order.status === "pending_pickup" ? (
            <div className="inline-actions" key={order.id}>
              <button className="primary-button" data-dev-note="complete-order" onClick={() => onComplete(order.id)}>确认领取</button>
              <button className="danger-button" data-dev-note="cancel-order" onClick={() => onCancel(order.id)}>取消订单</button>
            </div>
          ) : (
            ""
          ),
        ])}
      />
    </div>
  );
}

function OrderVerification({
  orders,
  products,
  onComplete,
  onCancel,
}: {
  orders: Order[];
  products: Product[];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState<"all" | CampusId>("all");
  const normalizedOrderId = orderIdQuery.trim().toLowerCase();
  const normalizedStudent = studentQuery.trim().toLowerCase();
  const normalizedPhone = phoneQuery.trim().toLowerCase();
  const hasVerificationQuery = Boolean(normalizedOrderId || normalizedStudent || normalizedPhone);
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const matchedOrders = hasVerificationQuery
    ? orders.filter((order) => {
        const orderId = order.id.toLowerCase();
        const studentName = order.studentName.toLowerCase();
        const phone = order.phone.toLowerCase();
        const matchesCampus = campusFilter === "all" || order.campusId === campusFilter;
        if (normalizedOrderId) {
          return (
            orderId.includes(normalizedOrderId) &&
            (!normalizedStudent || studentName.includes(normalizedStudent)) &&
            (!normalizedPhone || phone.includes(normalizedPhone)) &&
            matchesCampus
          );
        }
        return (
          order.status === "pending_pickup" &&
          (!normalizedStudent || studentName.includes(normalizedStudent)) &&
          (!normalizedPhone || phone.includes(normalizedPhone)) &&
          Boolean(normalizedStudent || normalizedPhone) &&
          matchesCampus
        );
      })
    : [];
  const verificationOrders = normalizedOrderId ? matchedOrders.slice(0, 1) : matchedOrders;

  return (
    <div data-dev-note="admin-order-verification-page">
      <PanelHeader title="兑换核实" />
      <div className="admin-filters" aria-label="兑换核实搜索">
        <label>
          订单号
          <input
            value={orderIdQuery}
            placeholder="输入订单号"
            onChange={(event) => setOrderIdQuery(event.target.value)}
          />
        </label>
        <label>
          姓名
          <input
            value={studentQuery}
            placeholder="输入学生姓名"
            onChange={(event) => setStudentQuery(event.target.value)}
          />
        </label>
        <label>
          手机号
          <input
            value={phoneQuery}
            placeholder="输入手机号"
            onChange={(event) => setPhoneQuery(event.target.value)}
          />
        </label>
        <label>
          领取校区
          <select value={campusFilter} onChange={(event) => setCampusFilter(event.target.value as "all" | CampusId)}>
            <option value="all">全部</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>{campus.name}</option>
            ))}
          </select>
        </label>
      </div>

      {!hasVerificationQuery && (
        <div className="verification-empty">请输入订单号、姓名或手机号，任意填写一项即可核实订单。</div>
      )}
      {hasVerificationQuery && verificationOrders.length === 0 && (
        <div className="verification-empty">未找到匹配订单。</div>
      )}

      {verificationOrders.length > 0 && (
        <div className="verification-results">
          {verificationOrders.map((order) => {
            const product = productMap.get(order.productId);
            const canOperate = order.status === "pending_pickup";
            return (
              <section className="verification-card" aria-label="兑换核实结果" key={order.id}>
                <div className="verification-summary">
                  {product ? (
                    <ProductArtwork product={product} className="verification-product-image" />
                  ) : (
                    <div className="verification-product-image product-image"><span>商品图</span></div>
                  )}
                  <div>
                    <p className="verification-order-id">{order.id}</p>
                    <h3>{order.productName}</h3>
                    <span className={`verification-status ${order.status}`}>
                      {statusText[order.status]}
                    </span>
                  </div>
                </div>
                <dl className="verification-grid">
                  <div><dt>学生</dt><dd>{order.studentName}</dd></div>
                  <div><dt>手机号</dt><dd>{order.phone}</dd></div>
                  <div><dt>领取校区</dt><dd>{order.campusName}</dd></div>
                  <div><dt>兑换数量</dt><dd>x{order.quantity ?? 1}</dd></div>
                  <div><dt>扣除积分</dt><dd>{order.points}</dd></div>
                  <div><dt>下单时间</dt><dd>{order.createdAt}</dd></div>
                  <div><dt>订单状态</dt><dd>{statusText[order.status]}</dd></div>
                </dl>
                <div className="verification-actions">
                  <button
                    className="primary-button"
                    data-dev-note="verify-complete-order"
                    disabled={!canOperate}
                    onClick={() => onComplete(order.id)}
                  >
                    确认领取
                  </button>
                  <button
                    className="danger-button"
                    data-dev-note="verify-cancel-order"
                    disabled={!canOperate}
                    onClick={() => onCancel(order.id)}
                  >
                    取消订单
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LedgerTable({ ledgers }: { ledgers: Ledger[] }) {
  const [query, setQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState<LedgerType[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const ledgerTypes = Array.from(new Set(ledgers.map((ledger) => ledger.type)));
  const normalizedQuery = query.trim().toLowerCase();
  const filteredLedgers = ledgers.filter((ledger) => {
    const ledgerDate = ledger.createdAt.slice(0, 10);
    const matchesQuery =
      !normalizedQuery ||
      [ledger.studentName, ledger.orderId, ledger.type]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesType = typeFilters.length === 0 || typeFilters.includes(ledger.type);
    const matchesStartDate = !startDate || ledgerDate >= startDate;
    const matchesEndDate = !endDate || ledgerDate <= endDate;
    return matchesQuery && matchesType && matchesStartDate && matchesEndDate;
  });

  function toggleTypeFilter(type: LedgerType) {
    setTypeFilters((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  }

  return (
    <div data-dev-note="ledger-page">
      <PanelHeader title="后台积分流水页" />
      <div className="admin-filters" aria-label="流水筛选">
        <label>
          搜索流水
          <input value={query} placeholder="学生 / 订单号 / 类型" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          开始时间
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          结束时间
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <fieldset className="admin-filter-group">
          <legend>流水类型</legend>
          <div className="admin-filter-options">
            {ledgerTypes.map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={typeFilters.includes(type)}
                  onChange={() => toggleTypeFilter(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <DataTable
        headers={["学生", "类型", "积分变动", "关联订单", "时间", "备注"]}
        rows={filteredLedgers.map((ledger) => [
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

function InventoryDetail({
  product,
  inventory,
  onClose,
}: {
  product: Product;
  inventory: InventoryItem[];
  onClose: () => void;
}) {
  const rows = inventory.filter((item) => item.productId === product.id);
  const totalAvailable = rows.reduce((total, item) => total + item.available, 0);
  const totalLocked = rows.reduce((total, item) => total + item.locked, 0);
  const totalUsed = rows.reduce((total, item) => total + item.used, 0);

  return (
    <Modal title="库存详情" onClose={onClose}>
      <div data-dev-note="inventory-detail">
        <div className="inventory-detail-head">
          <ProductArtwork product={product} className="admin-product-image" />
          <div>
            <h2>{product.name}</h2>
            <p>总可用 {totalAvailable}，锁定 {totalLocked}，已出库 {totalUsed}</p>
          </div>
        </div>
        <DataTable
          headers={["校区", "可用库存", "锁定库存", "已出库", "预警阈值", "补货目标", "存放位置", "更新时间", "状态"]}
          rows={rows.map((item) => [
            campusName(item.campusId),
            `${item.available}`,
            `${item.locked}`,
            `${item.used}`,
            `${item.warningThreshold}`,
            `${item.replenishTarget}`,
            item.storageLocation,
            item.updatedAt,
            item.available <= 0 ? "缺货" : item.available <= item.warningThreshold ? "低库存" : "正常",
          ])}
        />
      </div>
    </Modal>
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

function ProductArtwork({
  product,
  large = false,
  className = "",
}: {
  product: Product;
  large?: boolean;
  className?: string;
}) {
  const imageSrc = product.image.trim();
  const normalizedImageSrc = imageSrc.replace(/^\/+/, "");
  const isUploadedImage = imageSrc.startsWith("data:image/");
  const hasImage = isUploadedImage || normalizedImageSrc.startsWith("product-images/");
  const imageUrl = isUploadedImage ? imageSrc : publicAssetPath(normalizedImageSrc);
  return (
    <div className={`product-image ${large ? "large" : ""} ${className}`} aria-label={`${product.name} 商品图`}>
      {hasImage ? <img src={imageUrl} alt={product.name} /> : <span>商品图占位</span>}
    </div>
  );
}

function ConfirmExchange({
  product,
  inventory,
  defaultCampusId,
  recentCampusIds,
  studentPoints,
  onCancel,
  onSubmit,
}: {
  product: Product;
  inventory: InventoryItem[];
  defaultCampusId: CampusId;
  recentCampusIds: CampusId[];
  studentPoints: number;
  onCancel: () => void;
  onSubmit: (quantity: number, campusId: CampusId) => void;
}) {
  const campusInventory = inventory.filter((item) => item.productId === product.id);
  const firstAvailableCampusId =
    campusInventory.find((item) => item.campusId === defaultCampusId && item.available > 0)?.campusId ??
    campusInventory.find((item) => recentCampusIds.includes(item.campusId) && item.available > 0)?.campusId ??
    campusInventory.find((item) => item.available > 0)?.campusId ??
    defaultCampusId;
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(firstAvailableCampusId);
  const selectedInventory = campusInventory.find((item) => item.campusId === selectedCampusId);
  const campusAvailable = selectedInventory?.available ?? 0;
  const maxQuantity = Math.max(0, campusAvailable);
  const [quantity, setQuantity] = useState(maxQuantity > 0 ? 1 : 0);
  const totalPoints = product.points * quantity;
  const disabled = quantity < 1 || quantity > maxQuantity || campusAvailable <= 0 || studentPoints < totalPoints;

  useEffect(() => {
    setQuantity((current) => {
      if (maxQuantity <= 0) return 0;
      return Math.min(Math.max(1, current), maxQuantity);
    });
  }, [maxQuantity]);

  function updateQuantity(nextQuantity: number) {
    if (maxQuantity <= 0) {
      setQuantity(0);
      return;
    }
    setQuantity(Math.max(1, Math.min(maxQuantity, Math.floor(nextQuantity) || 1)));
  }

  return (
    <Modal title="兑换确认" className="exchange-modal" onClose={onCancel}>
      <div className="confirm-exchange-layout" data-dev-note="exchange-confirm">
        <ProductArtwork product={product} large />
        <div className="confirm-copy">
          <h2>{product.name}</h2>
          <dl className="detail-list compact">
            <div><dt>单件积分</dt><dd>{product.points}</dd></div>
            <div>
              <dt>领取校区</dt>
              <dd>
                <select value={selectedCampusId} onChange={(event) => setSelectedCampusId(event.target.value as CampusId)}>
                  {campuses.map((campus) => {
                    const item = campusInventory.find((stock) => stock.campusId === campus.id);
                    const available = item?.available ?? 0;
                    return (
                      <option key={campus.id} value={campus.id} disabled={available <= 0}>
                        {campus.name}（可用 {available}）
                      </option>
                    );
                  })}
                </select>
              </dd>
            </div>
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
          <ul>
            <li>请到校区前台领取。</li>
            <li>未领取前可取消并返还积分。</li>
          </ul>
        </div>
      </div>
      <div className="modal-actions">
        <button className="text-button" onClick={onCancel}>再想想</button>
        <button className="primary-button" data-dev-note="exchange-confirm" disabled={disabled} onClick={() => onSubmit(quantity, selectedCampusId)}>确认兑换</button>
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
  const canSave = draft.name.trim() && draft.points > 0 && draft.stock >= 0;

  function uploadProductImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setDraft((current) => ({ ...current, image: reader.result as string }));
      }
    });
    reader.readAsDataURL(file);
  }

  return (
    <Modal title={product.id ? "编辑商品" : "新增商品"} onClose={onCancel}>
      <div className="form-grid" data-dev-note="product-editor">
        <div className="product-upload-preview">
          <ProductArtwork product={draft} className="admin-editor-image" />
        </div>
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
          上传商品图
          <input
            accept="image/*"
            type="file"
            onChange={(event) => uploadProductImage(event.target.files?.[0])}
          />
        </label>
        <label>
          商品分类
          <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ProductCategory })}>
            {productCategoryOptions.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
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

function PanelHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
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
