# Points Mall MVP

积分商城最小 MVP 交互原型。

核心闭环：

- 后台配置商品
- 学生浏览商品
- 积分兑换
- 后台处理订单
- 查看基础数据报表

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

页面右下角点击“开发说明”，或使用快捷键 `Ctrl/Cmd + Shift + D`，可以切换开发模式。开发模式会冻结页面操作，只展示当前页面的业务规则、字段说明和动作说明。

## GitHub Pages

本项目已包含 GitHub Actions 配置：

```text
.github/workflows/deploy-pages.yml
```

仓库 Pages 设置里选择：

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```
