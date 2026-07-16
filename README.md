# Points Mall MVP

积分商城最小 MVP 交互原型。

核心闭环：

- 后台配置商品图、分类、标签、上下架和多校区库存
- 学生浏览商品
- 学生选择领取校区并兑换，系统锁定对应校区库存
- 后台按校区处理订单
- 前台按订单号、姓名、手机号和校区核实待领取兑换
- 库存管理查看各校区可用、锁定、已出库和预警状态
- 查看积分流水，支持类型多选和时间范围筛选

## 本地运行

```bash
npm install
npm run dev
```

## 构建验证

```bash
npm run build
npm test
npm run lint
```

## 开发说明模式

使用快捷键 `Ctrl/Cmd + Shift + D` 可以切换开发模式。开发模式会冻结页面操作，只展示当前页面的业务规则、字段说明和动作说明。

## GitHub Pages

本项目已包含 GitHub Actions 配置：

```text
.github/workflows/deploy-pages.yml
```

仓库 Pages 设置里选择：

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```
