import { Props } from 'shared/ReactTypes';
import { unstable_runWithPriority as runWithPriority, unstable_ImmediatePriority as ImmediatePriority } from 'scheduler';

const propsKey = '__miniReactProps';
type DOMElement = Element & { [propsKey]?: Props };
type Listener = { node: Element; callback: (event: Event) => void };
const listening = new WeakSet<Element>();

export function updateFiberProps(node: Element, props: Props) {
	(node as DOMElement)[propsKey] = props;
}

export function initEvent(container: Element) {
	if (listening.has(container)) return;
	listening.add(container);
	container.addEventListener('click', (nativeEvent) => {
		const capture: Listener[] = [];
		const bubble: Listener[] = [];
		let node = nativeEvent.target as Node | null;
		while (node !== null && node !== container) {
			const props = (node as DOMElement)[propsKey];
			if (props) {
				if (typeof props.onClickCapture === 'function') {
					capture.unshift({ node: node as Element, callback: props.onClickCapture });
				}
				if (typeof props.onClick === 'function') {
					bubble.push({ node: node as Element, callback: props.onClick });
				}
			}
			node = node.parentNode;
		}
		if (node !== container) return;
		let stopped = false;
		let currentTarget: Element | null = null;
		const event = new Proxy(nativeEvent, {
			get(target, key) {
				if (key === 'currentTarget') return currentTarget;
				if (key === 'stopPropagation') return () => {
					stopped = true;
					target.stopPropagation();
				};
				const value = Reflect.get(target, key, target);
				return typeof value === 'function' ? value.bind(target) : value;
			}
		});
		try {
			for (const listener of [...capture, ...bubble]) {
				currentTarget = listener.node;
				runWithPriority(ImmediatePriority, () => listener.callback(event));
				if (stopped) break;
			}
		} finally {
			currentTarget = null;
		}
	});
}
