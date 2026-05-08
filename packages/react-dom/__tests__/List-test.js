const React = require('react');
const { createRoot } = require('react-dom/client');

test('reorders keyed DOM without replacing instances', () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	const render = names => root.render(<ul>{names.map(name => <li key={name}>{name}</li>)}</ul>);
	render(['A', 'B', 'C']);
	const nodes = Object.fromEntries([...container.querySelectorAll('li')].map(n => [n.textContent, n]));
	for (const names of [['C','A','B'], ['C','B','A'], ['D','A','C'], ['C'], []]) {
		render(names);
		expect(container.textContent).toBe(names.join(''));
		for (const node of container.querySelectorAll('li')) {
			if (nodes[node.textContent]) expect(node).toBe(nodes[node.textContent]);
		}
	}
});

test('supports nulls, zero, array-to-single and non-host insertion before a sibling', () => {
	const container = document.createElement('div');
	const root = createRoot(container);
	const Item = ({name}) => <span>{name}</span>;
	root.render(<div>{[null, false, 0, <Item key="B" name="B" />]}</div>);
	expect(container.textContent).toBe('0B');
	const b = container.querySelector('span');
	root.render(<div>{[<Item key="A" name="A" />, <Item key="B" name="B" />]}</div>);
	expect(container.textContent).toBe('AB');
	root.render(<div><Item key="B" name="B" /></div>);
	expect(container.textContent).toBe('B');
	expect(container.querySelector('span')).toBe(b);
	root.render(<div>{null}</div>);
	expect(container.textContent).toBe('');
});

test('automatic JSX runtime preserves keys and children', () => {
	const {jsx, jsxs} = require('react/jsx-runtime');
	const {jsxDEV} = require('react/jsx-dev-runtime');
	for (const factory of [jsx, jsxs, jsxDEV]) {
		const element = factory('div', {children: 'hello'}, 'key');
		expect(element.key).toBe('key');
		expect(element.props).toEqual({children:'hello'});
	}
});
