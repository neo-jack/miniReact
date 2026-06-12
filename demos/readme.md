# 本地演示

在仓库根目录执行 `pnpm start`，浏览器访问：

- <http://localhost:5173/>：基础 useState 示例。
- <http://localhost:5173/scheduler.html>：Scheduler 优先级、时间切片与任务取消。
- <http://localhost:5173/concurrent.html>：低优先级列表、紧急计数和提交后的 effect 状态。

Vite 直接加载 packages 中的源码，不需要手动 pnpm link。根 render 保持同步，普通状态更新按 Scheduler 优先级调度；并发演示显式使用 LowPriority 与 ImmediatePriority。

自动化验证在根目录执行 `pnpm build-dev`，再运行 `pnpm test --runInBand`。并发用例使用 Scheduler mock 控制暂停和恢复，不依赖机器速度或任意延时。
