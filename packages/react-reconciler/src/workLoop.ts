import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './FiberFlags';
import { HostRoot } from './workTags';
import { Lane, SyncLane } from './fiberLanes';
import { scheduleSyncCallback } from './syncTaskQueue';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
	//DFS-初始化
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane = SyncLane) {
	//调度功能
	const root = markUpdateFromFiberToRoot(fiber);
	if (root !== null) {
		root.pendingLanes |= lane;
		if (!root.syncScheduled) {
			root.syncScheduled = true;
			scheduleSyncCallback(() => {
				root.syncScheduled = false;
				root.pendingLanes &= ~SyncLane;
				rendeRoot(root);
			});
		}
	}
}

//找到FiberRootNode
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;

	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}

	return null;
}

//通过Dfs实现渲染更新
function rendeRoot(root: FiberRootNode) {
	prepareFreshStack(root);
	try {
		workloop();
	} catch (error) {
		workInProgress = null;
		root.finishework = null;
		throw error;
	}

	const finishework = root.current.alternate;

	root.finishework = finishework;

	//wip fiberNode树 树中的flags
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finisheWork = root.finishework;
	if (finisheWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit阶段开始');
	}

	//重置
	root.finishework = null;

	//判断是否执行
	// root flags root subtreeFlags
	const subtreeHasEffect =
		(finisheWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finisheWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		//beformutation
		commitMutationEffects(finisheWork);
		//mutation
		root.current=finisheWork
		//layout
	} else {
		root.current=finisheWork
	}
}

//DFS-递归函数
function workloop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

//DFS-遍历
function performUnitOfWork(fiber: FiberNode) {
	//DFS-递
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.penddingProps;
	if (next === null) {
		//DFS-归
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node != null);
}
