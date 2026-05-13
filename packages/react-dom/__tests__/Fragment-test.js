const React = require('react');
const { createRoot } = require('react-dom/client');

test('moves keyed fragments and deletes all host roots through nested components', () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	const Leaf = ({name}) => <span>{name}</span>;
	const Group = ({name}) => <><Leaf name={name} /><Leaf name={name.toLowerCase()} /></>;
	const tree = names => <div>{names.map(name => <React.Fragment key={name}><Group name={name} /></React.Fragment>)}</div>;
	root.render(tree(['A','B']));
	const original = [...container.querySelectorAll('span')];
	root.render(tree(['B','A']));
	expect(container.textContent).toBe('BbAa');
	expect([...container.querySelectorAll('span')]).toEqual([original[2], original[3], original[0], original[1]]);
	root.render(tree(['B']));
	expect(container.textContent).toBe('Bb');
	root.render(null);
	expect(container.childNodes).toHaveLength(0);
});

test('handles nested arrays with empty children and zero', () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	root.render(<>{[[0, null, 'A'], [<span key="b">B</span>]]}</>);
	expect(container.textContent).toBe('0AB');
	root.render(<>{[['C'], []]}</>);
	expect(container.textContent).toBe('C');
	root.render(null);
	expect(container.childNodes).toHaveLength(0);
});
