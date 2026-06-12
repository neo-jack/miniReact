const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');

describe('single node updates', () => {
	it('reuses matching DOM and replaces a different type or key', () => {
		const container = document.createElement('div');
		const root = createRoot(container);
		root.render(<div key="a">before</div>);
		const first = container.firstChild;
		root.render(<div key="a">after</div>);
		expect(container.firstChild).toBe(first);
		expect(container.textContent).toBe('after');
		root.render(<span key="a">new type</span>);
		expect(container.childNodes).toHaveLength(1);
		expect(container.firstChild).not.toBe(first);
		const span = container.firstChild;
		root.render(<span key="b">new key</span>);
		expect(container.firstChild).not.toBe(span);
		expect(container.textContent).toBe('new key');
	});

	it('deletes nested function and host nodes repeatedly', () => {
		const container = document.createElement('div');
		const root = createRoot(container);
		function Child() {
			return <div><span>nested</span></div>;
		}
		for (let i = 0; i < 3; i++) {
			root.render(<Child />);
			expect(container.textContent).toBe('nested');
			root.render(null);
			expect(container.childNodes).toHaveLength(0);
		}
	});

	it('keeps hook cursors and consumed updates isolated across renders', async () => {
		const container = document.createElement('div');
		const root = createRoot(container);
		let setFirst;
		let setSecond;
		let setChild;
		function Child({ label }) {
			const [value, setValue] = React.useState(0);
			setChild = setValue;
			return <span>{`${label}:${value}`}</span>;
		}
		function App() {
			const [first, updateFirst] = React.useState(0);
			const [second, updateSecond] = React.useState(0);
			setFirst = updateFirst;
			setSecond = updateSecond;
			return <Child label={`${first}:${second}`} />;
		}
		root.render(<App />);
		for (let i = 0; i < 10; i++) setFirst(n => n + 1);
		setSecond(3);
		setChild(n => n + 1);
		await act(() => {});
		root.render(<App />);
		expect(container.textContent).toBe('10:3:1');
		expect(() => React.useState(0)).toThrow();
	});

	it('preserves committed DOM after an error and clears hook context', () => {
		const container = document.createElement('div');
		const root = createRoot(container);
		function App({ fail }) {
			const [value] = React.useState(7);
			if (fail) throw new Error('render failed');
			return <span>{value}</span>;
		}
		root.render(<App fail={false} />);
		const previous = container.firstChild;
		expect(() => root.render(<App fail />)).toThrow('render failed');
		expect(container.firstChild).toBe(previous);
		expect(container.textContent).toBe('7');
		expect(() => React.useState(0)).toThrow();
		root.render(<App fail={false} />);
		expect(container.firstChild).toBe(previous);
	});
});
