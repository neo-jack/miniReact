import { createContainer, updatedContainer } from 'react-reconciler/src/fiberReconciler';
import { flushSyncCallbacks } from 'react-reconciler/src/syncTaskQueue';
import { flushPassiveEffects } from 'react-reconciler/src/passiveEffects';
import { flushAllWork } from 'react-reconciler/src/workLoop';
import { requestUpdateLane } from 'react-reconciler/src/fiberLanes';
import type { ReactElementType } from 'shared/ReactTypes';
import type { Container as ReconcilerContainer } from 'hostConfig';
import type { Container } from './src/hostConfig';

export function createRoot() {
	const container: Container = {children: []};
	// The root tsc project checks the DOM host; this bundle injects the Noop host.
	const root = createContainer(container as unknown as ReconcilerContainer);
	return {
		renderConcurrent(element: ReactElementType | null) {
			updatedContainer(element, root, requestUpdateLane());
		},
		render(element: ReactElementType | null) {
			updatedContainer(element, root);
			flushSyncCallbacks();
		},
		getChildren: () => container.children
	};
}

export async function act(callback: () => void | Promise<void>) {
	await callback();
	do { flushAllWork(); } while (flushPassiveEffects());
}
