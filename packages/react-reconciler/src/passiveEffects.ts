import { unstable_scheduleCallback as scheduleCallback, unstable_cancelCallback as cancelCallback, unstable_NormalPriority as NormalPriority, CallbackNode } from 'scheduler';
import { Effect } from './hookEffectTags';

const unmount: Effect[] = [];
const updates: Effect[] = [];
let callback: CallbackNode | null = null;
let flushing = false;

export function enqueuePassiveEffect(effect: Effect, deleted = false) {
	(deleted ? unmount : updates).push(effect);
}

export function schedulePassiveEffects() {
	if (callback === null && (unmount.length || updates.length)) {
		callback = scheduleCallback(NormalPriority, () => {
			callback = null;
			flushPassiveEffects();
		});
	}
}

export function flushPassiveEffects() {
	if (flushing || (!unmount.length && !updates.length)) return false;
	if (callback !== null) cancelCallback(callback);
	callback = null;
	flushing = true;
	const deleted = unmount.splice(0);
	const changed = updates.splice(0);
	try {
		for (const effect of [...deleted, ...changed]) {
			const destroy = effect.destroy;
			effect.destroy = undefined;
			if (typeof destroy === 'function') destroy();
		}
		for (const effect of changed) {
			const destroy = effect.create();
			effect.destroy = typeof destroy === 'function' ? destroy : undefined;
		}
	} finally {
		flushing = false;
	}
	return true;
}
