const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');

test('effect deps and cleanup follow commit lifecycle', async () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	const log = [];
	function App({value}) {
		React.useEffect(() => { log.push(`create:${value}`); return () => log.push(`destroy:${value}`); }, [value]);
		return <span>{value}</span>;
	}
	root.render(<App value={1} />);
	expect(log).toEqual([]);
	await act(() => {});
	expect(log).toEqual(['create:1']);
	await act(() => root.render(<App value={1} />));
	expect(log).toEqual(['create:1']);
	await act(() => root.render(<App value={2} />));
	expect(log).toEqual(['create:1','destroy:1','create:2']);
	await act(() => root.render(null));
	expect(log).toEqual(['create:1','destroy:1','create:2','destroy:2']);
});

test('runs all changed cleanups before creates including effects without DOM changes', async () => {
	const root = createRoot(document.createElement('div'));
	const log = [];
	function Child({id, value}) {
		React.useEffect(() => { log.push(`+${id}${value}`); return () => log.push(`-${id}${value}`); });
		return null;
	}
	const tree = value => <><Child id="a" value={value} /><Child id="b" value={value} /></>;
	await act(() => root.render(tree(0)));
	log.length = 0;
	await act(() => root.render(tree(1)));
	expect(log).toEqual(['-a0','-b0','+a1','+b1']);
	await act(() => root.render(null));
});

test('does not run effects from failed renders and supports state updates inside effects', async () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	const effect = jest.fn();
	function App({fail}) {
		const [value, setValue] = React.useState(0);
		React.useEffect(() => { effect(); setValue(1); }, []);
		if (fail) throw new Error('failed');
		return <span>{value}</span>;
	}
	expect(() => root.render(<App fail />)).toThrow('failed');
	await act(() => {});
	expect(effect).not.toHaveBeenCalled();
	await act(() => root.render(<App fail={false} />));
	expect(effect).toHaveBeenCalledTimes(1);
	expect(container.textContent).toBe('1');
	await act(() => root.render(null));
});
