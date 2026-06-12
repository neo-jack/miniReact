/// <reference path="./reconciler.d.ts" />

import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './FiberFlags';
import { Container } from 'hostConfig';
import type { Update } from './updateQueue';
import type { CallbackNode } from 'scheduler';

export class FiberNode {
	baseState: any = null;
	baseQueue: Update<any> | null = null;
	//基础属性
	type: any; //小类型
	tag: WorkTag; //大类型
	penddingProps: Props; //jsx-props
	key: Key; //jsx-key
	stateNode: any; //实例
	ref: Ref; //jsx-ref

	//树状结构 jsx-props初构建子 父与子关联
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	//更新结构
	memoizedProps: Props | null;
	memoizedState: any; //hook链表
	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags;
	updateQueue: unknown;
	deletions: FiberNode[] | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key;
		this.stateNode = null;
		//类型
		this.type = null;
		//树状结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		//工作节点
		this.penddingProps = pendingProps;
		this.memoizedProps = null;
		this.memoizedState = null;
		this.updateQueue = null;

		//双缓存
		this.alternate = null;

		//副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

export class FiberRootNode {
	callbackNode: CallbackNode | null = null;
	callbackPriority = 0;
	updateVersion = 0;
	pendingLanes = 0;
	syncScheduled = false;
	Container: Container;
	current: FiberNode;
	finishework: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.Container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishework = null;
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	penddingProps: Props
): FiberNode => {
	let wip = current.alternate;
	if (wip === null) {
		wip = new FiberNode(current.tag, penddingProps, current.key);
		wip.type = current.type;
		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		//update
		wip.penddingProps = penddingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
	}
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedState = current.memoizedState;
	wip.memoizedProps = current.memoizedProps;
	wip.baseState = current.baseState;
	wip.baseQueue = current.baseQueue;

	return wip;
};
