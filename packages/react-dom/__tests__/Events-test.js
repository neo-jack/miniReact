const React = require('react');
const { createRoot } = require('react-dom/client');

test('delegates capture and bubble with correct currentTarget', () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	const calls = [];
	const record = label => e => calls.push([label, e.currentTarget.tagName]);
	root.render(<div onClickCapture={record('pc')} onClick={record('pb')}>
		<button onClickCapture={record('cc')} onClick={record('cb')}>go</button>
	</div>);
	container.querySelector('button').click();
	expect(calls).toEqual([['pc', 'DIV'], ['cc', 'BUTTON'], ['cb', 'BUTTON'], ['pb', 'DIV']]);
});

test('uses latest committed callbacks and supports stopping propagation', async () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	const parent = jest.fn();
	function App() {
		const [count, setCount] = React.useState(0);
		return <div onClick={parent}><button onClick={e => {
			e.stopPropagation();
			setCount(count + 1);
		}}>{count}</button></div>;
	}
	root.render(<App />);
	container.querySelector('button').click();
	await Promise.resolve();
	container.querySelector('button').click();
	await Promise.resolve();
	expect(container.textContent).toBe('2');
	expect(parent).not.toHaveBeenCalled();
});
