export type Lane = number;
export type Lanes = number;
export const NoLane = 0;
export const NoLanes = 0;
export const SyncLane = 1;
export const mergeLanes = (a: Lanes, b: Lane): Lanes => a | b;
export const getHighestPriorityLane = (lanes: Lanes): Lane => lanes & -lanes;
export const requestUpdateLane = (): Lane => SyncLane;
