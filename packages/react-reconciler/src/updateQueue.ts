import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane, SyncLane } from './fiberLanes';

export interface Update<State> {
	actions: Action<State>;
	lane: Lane;
	next: Update<State> | null;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(actions: Action<State>, lane: Lane = SyncLane): Update<State> => {
	return {
		actions, lane, next: null
	};
};

export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

export const enqueueUpdate = <Action>(
	updateQueue: UpdateQueue<Action>,
	update: Update<Action>
) => {
	const pending = updateQueue.shared.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;
};

export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: { memoizedState: State } = {
		memoizedState: baseState
	};

	if (pendingUpdate !== null) {
		const first = pendingUpdate.next!;
		let update = first;
		do {
			const action = update.actions;
			result.memoizedState = typeof action === 'function'
				? (action as (state: State) => State)(result.memoizedState)
				: action;
			update = update.next!;
		} while (update !== first);
	}

	return result;
};
