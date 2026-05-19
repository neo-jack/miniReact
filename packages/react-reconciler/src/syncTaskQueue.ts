import { scheduleMicroTask } from 'hostConfig';

let callbacks: Array<() => void> = [];
let scheduled = false;
let flushing = false;

export function scheduleSyncCallback(callback: () => void) {
	callbacks.push(callback);
	if (!scheduled) {
		scheduled = true;
		scheduleMicroTask(flushSyncCallbacks);
	}
}

export function flushSyncCallbacks() {
	if (flushing) return;
	flushing = true;
	let failed = false;
	let firstError: unknown;
	try {
		while (callbacks.length) {
			const batch = callbacks;
			callbacks = [];
			for (const callback of batch) {
				try { callback(); } catch (error) {
					if (!failed) firstError = error;
					failed = true;
				}
			}
		}
	} finally {
		flushing = false;
		scheduled = false;
	}
	if (failed) throw firstError;
}
