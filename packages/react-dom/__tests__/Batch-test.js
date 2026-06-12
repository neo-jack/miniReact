const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');

test('batches functional updates and preserves action order', async () => {
	const container = document.createElement('div');
	let dispatch;
	let renders = 0;
	function App() {
		const [value, setValue] = React.useState(0);
		dispatch = setValue;
		renders++;
		return <span>{value}</span>;
	}
	createRoot(container).render(<App />);
	dispatch(n => n + 1);
	dispatch(n => n + 1);
	dispatch(n => n + 1);
	expect(container.textContent).toBe('0');
	await act(() => {});
	expect(container.textContent).toBe('3');
	expect(renders).toBe(2);
	dispatch(4);
	dispatch(4);
	dispatch(n => n * 2);
	await act(() => {});
	expect(container.textContent).toBe('8');
	expect(renders).toBe(3);
});
