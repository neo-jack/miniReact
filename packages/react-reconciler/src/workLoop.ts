import { beginWork } from './beginWork';
import { commitMutationEffects, commitPassiveEffects } from './commitWork';
import { flushPassiveEffects, schedulePassiveEffects } from './passiveEffects';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './FiberFlags';
import { HostRoot } from './workTags';
import { Lane, NoLane, SyncLane, getHighestPriorityLane, laneToSchedulerPriority } from './fiberLanes';
import { scheduleSyncCallback, flushSyncCallbacks } from './syncTaskQueue';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_cancelCallback as cancelCallback,
	unstable_shouldYield as shouldYield
} from 'scheduler';

let workInProgress: FiberNode | null = null;
let renderingRoot: FiberRootNode | null = null;
let renderLane: Lane = NoLane;
let renderVersion = 0;
const scheduledRoots = new Set<FiberRootNode>();

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane = SyncLane) {
	let node = fiber;
	while (node.return !== null) node = node.return;
	if (node.tag !== HostRoot) return;
	const root = node.stateNode as FiberRootNode;
	root.pendingLanes |= lane;
	root.updateVersion++;
	scheduledRoots.add(root);
	ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
	const lane = getHighestPriorityLane(root.pendingLanes);
	if (lane === root.callbackPriority) return;
	if (root.callbackNode !== null) cancelCallback(root.callbackNode);
	root.callbackNode = null;
	root.callbackPriority = lane;
	if (lane === NoLane) {
		scheduledRoots.delete(root);
		return;
	}
	if (lane === SyncLane) {
		if (!root.syncScheduled) {
			root.syncScheduled = true;
			scheduleSyncCallback(() => {
				root.syncScheduled = false;
				flushPassiveEffects();
				if (getHighestPriorityLane(root.pendingLanes) !== SyncLane) return;
				renderRoot(root, SyncLane, false);
				finishRoot(root, SyncLane);
			});
		}
	} else {
		root.callbackNode = scheduleCallback(laneToSchedulerPriority(lane),
			(didTimeout) => performConcurrentWork(root, didTimeout));
	}
}

function performConcurrentWork(root: FiberRootNode, didTimeout: boolean): any {
	const callback = root.callbackNode;
	flushPassiveEffects();
	if (callback !== root.callbackNode) return null;
	const lane = getHighestPriorityLane(root.pendingLanes);
	if (lane === NoLane || lane === SyncLane) return null;
	const completed = renderRoot(root, lane, !didTimeout);
	if (callback !== root.callbackNode) return null;
	if (!completed) return (timeout: boolean) => performConcurrentWork(root, timeout);
	finishRoot(root, lane);
	return null;
}

function renderRoot(root: FiberRootNode, lane: Lane, timeSlice: boolean) {
	if (renderingRoot !== root || renderLane !== lane || renderVersion !== root.updateVersion) {
		renderingRoot = root;
		renderLane = lane;
		renderVersion = root.updateVersion;
		root.finishework = null;
		workInProgress = createWorkInProgress(root.current, {});
	}
	try {
		while (workInProgress !== null && (!timeSlice || !shouldYield())) {
			performUnitOfWork(workInProgress);
		}
	} catch (error) {
		workInProgress = null;
		renderingRoot = null;
		renderLane = NoLane;
		root.finishework = null;
		root.pendingLanes &= ~lane;
		root.callbackPriority = NoLane;
		if (root.callbackNode !== null) cancelCallback(root.callbackNode);
		root.callbackNode = null;
		if (root.pendingLanes === NoLane) scheduledRoots.delete(root);
		else ensureRootIsScheduled(root);
		throw error;
	}
	return workInProgress === null;
}

function finishRoot(root: FiberRootNode, lane: Lane) {
	const finishedWork = root.current.alternate!;
	root.pendingLanes &= ~lane;
	root.callbackPriority = NoLane;
	root.callbackNode = null;
	renderingRoot = null;
	renderLane = NoLane;
	root.finishework = finishedWork;
	if (((finishedWork.flags | finishedWork.subtreeFlags) & MutationMask) !== NoFlags) {
		commitMutationEffects(finishedWork);
	}
	root.current = finishedWork;
	root.finishework = null;
	commitPassiveEffects(finishedWork);
	schedulePassiveEffects();
	if (root.pendingLanes === NoLane) scheduledRoots.delete(root);
	ensureRootIsScheduled(root);
}

// Deterministic test flushing, not a production scheduling path.
export function flushAllWork() {
	let passes = 0;
	while (scheduledRoots.size > 0) {
		if (++passes > 1000) throw new Error('Too many scheduled updates');
		flushPassiveEffects();
		flushSyncCallbacks();
		const root = scheduledRoots.values().next().value as FiberRootNode | undefined;
		if (!root) break;
		const lane = getHighestPriorityLane(root.pendingLanes);
		if (lane === NoLane) { scheduledRoots.delete(root); continue; }
		if (root.callbackNode !== null) cancelCallback(root.callbackNode);
		root.callbackNode = null;
		renderRoot(root, lane, false);
		finishRoot(root, lane);
	}
}

//DFS-遍历
function performUnitOfWork(fiber: FiberNode) {
	//DFS-递
	const next = beginWork(fiber, renderLane);
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
