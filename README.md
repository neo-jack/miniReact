# miniReact

学自卡颂React，使用 TypeScript 从零学习实现 React 的核心流程，包括 JSX、Fiber、协调更新、DOM 提交和 Hooks。

本项目用于阅读源码、实现练习与调试。

## 在线体验

[打开 Codeground 在线编辑与预览](https://www.lanbinquan.top/codeground/react/)


## 快速开始

使用兼容 pnpm 10 与 Vite 5 的 Node.js 环境，建议 Node.js 22 LTS；项目通过 `packageManager` 指定 `pnpm@10.34.5`。

```bash
git clone https://github.com/neo-jack/miniReact.git
cd miniReact
pnpm install
pnpm start
```


## 构建与验证

在仓库根目录执行：

```bash
# 检查库源码与 Demo 的 TypeScript 类型
pnpm exec tsc -p tsconfig.json --noEmit

# 生成开发构建产物
pnpm build-dev

# 测试刚生成的产物
pnpm test --runInBand
```

