const React = require('react');
const Noop = require('react-noop-renderer');

test('shares reconciliation with DOM and moves existing host instances', async () => {
	const root = Noop.createRoot();
	const tree = names => <>{names.map(n => <span key={n}>{n}</span>)}</>;
	root.render(tree(['A','B','C']));
	const [a,b,c] = root.getChildren();
	root.render(tree(['C','A','B']));
	expect(root.getChildren()).toEqual([c,a,b]);
	root.render(tree(['B','C']));
	expect(root.getChildren()).toEqual([b,c]);
	await Noop.act(() => root.render(null));
	expect(root.getChildren()).toEqual([]);
});

test('preserves hook state and effect phase ordering without DOM', async () => {
	const root = Noop.createRoot();
	const log = [];
	let update;
	function Child({value}) {
		React.useEffect(() => { log.push(`child:${value}`); return () => log.push(`child-clean:${value}`); }, [value]);
		return <span>{value}</span>;
	}
	function App() {
		const [value, setValue] = React.useState(0);
		update = setValue;
		React.useEffect(() => { log.push(`parent:${value}`); return () => log.push(`parent-clean:${value}`); }, [value]);
		return <Child value={value} />;
	}
	await Noop.act(() => root.render(<App />));
	expect(log).toEqual(['child:0','parent:0']);
	log.length = 0;
	await Noop.act(() => { update(n => n + 1); update(n => n + 1); });
	expect(root.getChildren()[0].children[0].text).toBe('2');
	expect(log).toEqual(['child-clean:0','parent-clean:0','child:2','parent:2']);
	await Noop.act(() => root.render(null));
	expect(root.getChildren()).toEqual([]);
});
