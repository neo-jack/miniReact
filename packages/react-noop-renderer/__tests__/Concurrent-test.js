jest.mock('scheduler', () => require('scheduler/unstable_mock'));
const Scheduler = require('scheduler');
const React = require('react');
const Noop = require('react-noop-renderer');

const low = callback => Scheduler.unstable_runWithPriority(Scheduler.unstable_LowPriority, callback);
const urgent = callback => Scheduler.unstable_runWithPriority(Scheduler.unstable_ImmediatePriority, callback);
const flush = () => { Scheduler.unstable_flushAllWithoutAsserting(); Scheduler.unstable_clearYields(); };
const text = root => root.getChildren().map(n => n.children.map(c => c.text).join('')).join('');

afterEach(() => { flush(); });

test('interrupts low priority work and rebases skipped updates in original order', async () => {
	const root = Noop.createRoot();
	let update;
	const effects = [];
	function App() {
		const [value, setValue] = React.useState(1);
		update = setValue;
		React.useEffect(() => { effects.push(value); }, [value]);
		Scheduler.unstable_yieldValue(value);
		return <span>{value}</span>;
	}
	await Noop.act(() => root.render(<App />));
	Scheduler.unstable_clearYields();
	low(() => update(n => n + 10));
	Scheduler.unstable_flushNumberOfYields(1);
	expect(Scheduler.unstable_clearYields()).toEqual([11]);
	expect(text(root)).toBe('1');
	expect(effects).toEqual([1]);
	urgent(() => update(n => n * 2));
	await Promise.resolve();
	expect(text(root)).toBe('2');
	Scheduler.unstable_clearYields();
	flush();
	expect(text(root)).toBe('22');
	expect(effects).toEqual([1,2,22]);
	await Noop.act(() => root.render(null));
});

test('does not lose a same-priority update arriving while rendering is paused', () => {
	const root = Noop.createRoot();
	let update;
	function App() {
		const [value, setValue] = React.useState(0);
		update = setValue;
		Scheduler.unstable_yieldValue(value);
		return <span>{value}</span>;
	}
	root.render(<App />);
	Scheduler.unstable_clearYields();
	low(() => update(n => n + 1));
	Scheduler.unstable_flushNumberOfYields(1);
	Scheduler.unstable_clearYields();
	low(() => update(n => n + 1));
	flush();
	expect(text(root)).toBe('2');
	root.render(null);
});

test('keeps multiple roots separate and preserves newer root renders after rebasing', () => {
	const first = Noop.createRoot();
	const second = Noop.createRoot();
	function Item({label}) {
		Scheduler.unstable_yieldValue(label);
		return <span>{label}</span>;
	}
	low(() => first.renderConcurrent(<Item label="first" />));
	Scheduler.unstable_flushNumberOfYields(1);
	Scheduler.unstable_clearYields();
	expect(first.getChildren()).toEqual([]);
	second.render(<Item label="second" />);
	Scheduler.unstable_clearYields();
	flush();
	expect(text(first)).toBe('first');
	expect(text(second)).toBe('second');
	low(() => first.renderConcurrent(<Item label="stale" />));
	first.render(<Item label="latest" />);
	Scheduler.unstable_clearYields();
	flush();
	expect(text(first)).toBe('latest');
	first.render(null);
	second.render(null);
});

test('an expired concurrent task completes without yielding', () => {
	const root = Noop.createRoot();
	function Item() {
		Scheduler.unstable_yieldValue('render');
		return <span>done</span>;
	}
	low(() => root.renderConcurrent(<Item />));
	Scheduler.unstable_advanceTime(20000);
	Scheduler.unstable_flushExpired();
	expect(text(root)).toBe('done');
	Scheduler.unstable_clearYields();
	root.render(null);
});
