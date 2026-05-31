import type { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import type { Props } from 'shared/ReactTypes';

export interface Container { children: HostNode[]; }
export interface Instance extends Container {
	type: string;
	props: Props;
	parent: Container | null;
}
export interface TextInstance { text: string; parent: Container | null; }
type HostNode = Instance | TextInstance;

export const createInstance = (type: string, props: Props): Instance => ({type, props, children: [], parent: null});
export const createTextInstance = (content: string): TextInstance => ({text: String(content), parent: null});
export const scheduleMicroTask = (callback: () => void) => queueMicrotask(callback);

function detach(child: HostNode) {
	if (child.parent !== null) {
		const siblings = child.parent.children;
		const index = siblings.indexOf(child);
		if (index !== -1) siblings.splice(index, 1);
		child.parent = null;
	}
}

export function appendInitialChild(parent: Container, child: HostNode) {
	detach(child);
	parent.children.push(child);
	child.parent = parent;
}
export const appendChildToContainer = appendInitialChild;

export function insertChildToContainer(child: HostNode, container: Container, before: HostNode) {
	if (child === before) return;
	if (!container.children.includes(before)) throw new Error('Insertion anchor is not a child');
	detach(child);
	container.children.splice(container.children.indexOf(before), 0, child);
	child.parent = container;
}

export function removeChild(child: HostNode, container: Container) {
	if (child.parent !== container) throw new Error('Removal parent mismatch');
	detach(child);
}

export function commitUpdate(fiber: FiberNode) {
	if (fiber.tag === HostText) fiber.stateNode.text = String(fiber.memoizedProps.content);
	if (fiber.tag === HostComponent) fiber.stateNode.props = fiber.memoizedProps;
}
