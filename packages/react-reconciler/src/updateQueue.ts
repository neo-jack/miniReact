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

// Merge circular queues without dropping updates from an interrupted render.
export function mergeUpdateQueues<State>(base: Update<State> | null, pending: Update<State> | null) {
	if (pending === null) return base;
	if (base !== null) {
		const first = base.next;
		base.next = pending.next;
		pending.next = first;
	}
	return pending;
}

export function processUpdateQueue<State>(
	baseState: State,
	pending: Update<State> | null,
	renderLane: Lane = SyncLane
) {
	let state = baseState;
	let newBaseState = baseState;
	let firstSkipped: Update<State> | null = null;
	let lastSkipped: Update<State> | null = null;
	function append(update: Update<State>) {
		if (lastSkipped === null) firstSkipped = lastSkipped = update;
		else {
			lastSkipped.next = update;
			lastSkipped = update;
		}
	}
	if (pending !== null) {
		const first = pending.next!;
		let update = first;
		do {
			if (update.lane !== 0 && (update.lane & renderLane) === 0) {
				if (lastSkipped === null) newBaseState = state;
				append({...update, next: null});
			} else {
				if (lastSkipped !== null) append({...update, lane: 0, next: null});
				const action = update.actions;
				state = typeof action === 'function' ? (action as (value: State) => State)(state) : action;
			}
			update = update.next!;
		} while (update !== first);
	}
	if (lastSkipped === null) newBaseState = state;
	else (lastSkipped as Update<State>).next = firstSkipped;
	return { memoizedState: state, baseState: newBaseState, baseQueue: lastSkipped as Update<State> | null };
}
