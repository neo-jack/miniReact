import { ReactElementType } from 'shared/ReactTypes';
//@ts-ignore
import { createRoot, __TEST_INTERNALS } from 'react-dom';

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div');
	return createRoot(div).render(element);
}

export async function act(callback: () => void | Promise<void>) {
	await callback();
	do {
		__TEST_INTERNALS.flushAllWork();
	} while (__TEST_INTERNALS.flushPassiveEffects());
}
