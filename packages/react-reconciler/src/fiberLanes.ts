import {
	unstable_getCurrentPriorityLevel as getCurrentPriorityLevel,
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	unstable_NormalPriority as NormalPriority,
	unstable_LowPriority as LowPriority,
	unstable_IdlePriority as IdlePriority
} from 'scheduler';

export type Lane = number;
export type Lanes = number;
export const NoLane = 0;
export const NoLanes = 0;
export const SyncLane = 1;
export const InputLane = 2;
export const DefaultLane = 4;
export const LowLane = 8;
export const IdleLane = 16;
export const mergeLanes = (a: Lanes, b: Lane): Lanes => a | b;
export const getHighestPriorityLane = (lanes: Lanes): Lane => lanes & -lanes;
export function requestUpdateLane(): Lane {
	switch (getCurrentPriorityLevel()) {
		case ImmediatePriority: return SyncLane;
		case UserBlockingPriority: return InputLane;
		case LowPriority: return LowLane;
		case IdlePriority: return IdleLane;
		default: return DefaultLane;
	}
}

export function laneToSchedulerPriority(lane: Lane) {
	switch (lane) {
		case SyncLane: return ImmediatePriority;
		case InputLane: return UserBlockingPriority;
		case LowLane: return LowPriority;
		case IdleLane: return IdlePriority;
		default: return NormalPriority;
	}
}
