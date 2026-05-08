import { createElement as createElementFN, isValidElement as isValidElementFN } from './src/jsx';
import currentDispatcher from './src/currentDispatcher';
import { resolveDispatcher, Dispatcher } from './src/currentDispatcher';

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};
//内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '0.0.0';
//TODO: 根据环境去修改
export const createElement = createElementFN;
export const isValidElement = isValidElementFN;
