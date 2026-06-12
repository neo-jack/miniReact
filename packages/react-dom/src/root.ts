//ReactDOM.creatRoot(fiber).render(APP)

import { Container } from 'hostConfig';
import {
	createContainer,
	updatedContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { initEvent } from './SyntheticEvent';
import { flushSyncCallbacks } from 'react-reconciler/src/syncTaskQueue';
import { flushPassiveEffects } from 'react-reconciler/src/passiveEffects';
import { flushAllWork } from 'react-reconciler/src/workLoop';
import { requestUpdateLane } from 'react-reconciler/src/fiberLanes';

export const __TEST_INTERNALS = { flushSyncCallbacks, flushPassiveEffects, flushAllWork };

export function createRoot(container: Container ) {

const root = createContainer(container);
	initEvent(container);
	if(__DEV__)
	{
		console.log("版本0.0.1")
	}
	return {
		renderConcurrent(element: ReactElementType | null) {
			updatedContainer(element, root, requestUpdateLane());
		},
		render(element: ReactElementType | null) {
			updatedContainer(element, root);
			flushSyncCallbacks();
		}
	};
}
