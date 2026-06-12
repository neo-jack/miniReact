import { Lane } from './fiberLanes';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue, mergeUpdateQueues } from './updateQueue';
import {
	FunctionComponent,
	Fragment,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { reconcileChildFibers, mountChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';

//递归的递
export const beginWork = (wip: FiberNode, lane: Lane) => {
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip, lane);
		case HostComponent:
		case Fragment:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, lane);
		default:
			if (__DEV__) {
				console.warn('beginWork为实现的类型');
			}
			break;
	}

	//比较返回子fibernode
	return null;
};

function updateFunctionComponent(wip: FiberNode, lane: Lane) {
	const nextChildren = renderWithHooks(wip, lane);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostRoot(wip: FiberNode, lane: Lane) {
	const queue = wip.updateQueue as UpdateQueue<ReactElementType | null>;
	const current = wip.alternate!;
	const baseQueue = mergeUpdateQueues(current.baseQueue, queue.shared.pending);
	current.baseQueue = baseQueue;
	queue.shared.pending = null;
	const result = processUpdateQueue(wip.baseState, baseQueue, lane);
	wip.memoizedState = result.memoizedState;
	wip.baseState = result.baseState;
	wip.baseQueue = result.baseQueue;
	reconcileChildren(wip, wip.memoizedState);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.penddingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;
	if (current !== null) {
		//update
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		//mount

		wip.child = mountChildFibers(wip, null, children);
	}
}
