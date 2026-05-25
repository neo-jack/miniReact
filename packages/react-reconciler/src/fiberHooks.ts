import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatcher, Dispatch } from 'react/src/currentDispatcher';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { requestUpdateLane } from './fiberLanes';
import { Effect, EffectQueue, HookHasEffect, Passive } from './hookEffectTags';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

const { currentDispatcher } = internals;

//fiber的memoizedState
interface Hook {
	memoizedState: any; //hook保存的状态
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	//赋值操作
	currentlyRenderingFiber = wip;
	workInProgressHook = null;
	currentHook = null;
	//重置
	wip.memoizedState = null;
	wip.updateQueue = null;

	const current = wip.alternate;

	if (current !== null) {
		//update
		currentDispatcher.current = HookDispatcherOnUpdate;
	} else {
		//mount
		currentDispatcher.current = HookDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.penddingProps;
	try {
		return Component(props);
	} finally {
		currentlyRenderingFiber = null;
		workInProgressHook = null;
		currentHook = null;
		currentDispatcher.current = null;
	}
}

const HookDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};

const HookDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};

function pushEffect(create: Effect['create'], deps: unknown[] | null, destroy: Effect['destroy'], changed: boolean) {
	const effect = { create, deps, destroy, tag: Passive | (changed ? HookHasEffect : 0) } as Effect;
	const fiber = currentlyRenderingFiber!;
	let queue = fiber.updateQueue as EffectQueue | null;
	if (queue === null) fiber.updateQueue = queue = { lastEffect: null };
	const last = queue.lastEffect;
	if (last === null) effect.next = effect;
	else {
		effect.next = last.next;
		last.next = effect;
	}
	queue.lastEffect = effect;
	return effect;
}

function mountEffect(create: Effect['create'], deps?: unknown[]) {
	const hook = mountWorkInProgresHook();
	hook.memoizedState = pushEffect(create, deps ?? null, undefined, true);
}

function updateEffect(create: Effect['create'], deps?: unknown[]) {
	const hook = updateWorkInProgresHook();
	const previous = hook.memoizedState as Effect;
	const next = deps ?? null;
	const equal = next !== null && previous.deps !== null && next.length === previous.deps.length
		&& next.every((value, i) => Object.is(value, previous.deps![i]));
	hook.memoizedState = pushEffect(create, next, previous.destroy, !equal);
}

function updateState<State>(

): [State, Dispatch<State>] {
	//拷贝hook数据到wip里
	const hook = updateWorkInProgresHook();

	//计算新state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;
	queue.shared.pending = null;
	if (pending != null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
		hook.memoizedState = memoizedState;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgresHook(): Hook {
	if (currentlyRenderingFiber === null) {
		throw new Error('请在函数组件内调用hook');
	}
	//TODO render阶段触更新
	//交互更新-	render更新
	let nextCurrentHook: Hook | null;

	if (currentHook === null) {
		const current = currentlyRenderingFiber.alternate;
		if (current !== null) {
			nextCurrentHook = current.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		//这个FC update 后续的hook
		nextCurrentHook = currentHook.next;
	}

	if (nextCurrentHook === null) {
		throw new Error(`本次执行的hook比上次执行的多`);
	}

	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		//mount 第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}

	return workInProgressHook;
}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	//拷贝hook数据到wip
	const hook = mountWorkInProgresHook();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	const queue = createUpdateQueue<State>();
	hook.memoizedState = memoizedState; //更新
	hook.updateQueue = queue;

	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber!, queue);
	queue.dispatch = dispatch;

	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	if (currentlyRenderingFiber !== null) throw new Error('暂不支持 render 阶段更新');
	const lane = requestUpdateLane();
	const update = createUpdate(action, lane);
	enqueueUpdate(updateQueue, update);
	//触发更新
	scheduleUpdateOnFiber(fiber, lane);

	// host更新
	// 	// 1. 创建更新
	// 	const update = createUpdate<ReactElementType | null>(reactElement);
	// 	// 2. 入队
	// 	enqueueUpdate(
	// 		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
	// 		update
	// 	);
	// 	scheduleUpdateOnFiber(hostRootFiber);
	//
}

function mountWorkInProgresHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		//mount 第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
