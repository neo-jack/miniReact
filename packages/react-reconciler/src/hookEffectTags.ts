export const HookHasEffect = 1;
export const Passive = 2;

export interface Effect {
	tag: number;
	create: () => void | (() => void);
	destroy: void | (() => void);
	deps: unknown[] | null;
	next: Effect;
}

export interface EffectQueue {
	lastEffect: Effect | null;
}
