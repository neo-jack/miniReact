//ReactDOM.creatRoot(fiber).render(APP)

import { Container } from 'hostConfig';
import {
	createContainer,
	updatedContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';

export function createRoot(container: Container ) {

const root = createContainer(container);
	if(__DEV__)
	{
		console.log("版本0.0.1")
	}
	return {
		render(element: ReactElementType | null) {
			updatedContainer(element, root);
		}
	};
}
