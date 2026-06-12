import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import { Container } from 'hostConfig';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { HostRoot } from './workTags';
import { scheduleUpdateOnFiber } from './workLoop';
import { Lane, SyncLane } from './fiberLanes';

export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);
	hostRootFiber.updateQueue = createUpdateQueue();
	return root;
}

export function updatedContainer(
	reactElement: ReactElementType | null,
	root: FiberRootNode,
	lane: Lane = SyncLane
) {
	const hostRootFiber = root.current;
	// 1. 创建更新
	const update = createUpdate<ReactElementType | null>(reactElement, lane);
	// 2. 入队
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);
	scheduleUpdateOnFiber(hostRootFiber, lane)

	// TODO: return reactElement;
}
