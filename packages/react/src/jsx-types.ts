import { ReactElementType } from 'shared/ReactTypes';

export namespace JSX {
	export type Element = ReactElementType;
	export interface ElementChildrenAttribute { children: unknown; }
	export interface IntrinsicAttributes { key?: string | number; }
	export interface IntrinsicElements { [tag: string]: any; }
}
