import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
	unstable_runWithPriority as runWithPriority,
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_LowPriority as LowPriority
} from 'scheduler';

let setSize: (value: number) => void;
let increment: () => void;

function Row({ index }: { index: number }) {
	let checksum = 0;
	for (let i = 0; i < 20000; i++) checksum += Math.sqrt(index + i);
	return <li>{`第 ${index + 1} 项 · ${Math.round(checksum)}`}</li>;
}

function App() {
	const [size, updateSize] = useState(20);
	const [count, updateCount] = useState(0);
	setSize = updateSize;
	increment = () => updateCount(n => n + 1);
	useEffect(() => {
		document.querySelector('#status')!.textContent = `已提交：${size} 项，紧急计数 ${count}`;
	}, [size, count]);
	return <div>
		<p>{`计数：${count}`}</p>
		<ul>{Array.from({ length: size }, (_, index) => <Row key={index} index={index} />)}</ul>
	</div>;
}

ReactDOM.createRoot(document.querySelector('#root')!).render(<App />);
document.querySelector('#slow')!.addEventListener('click', () => runWithPriority(LowPriority, () => setSize(1500)));
document.querySelector('#urgent')!.addEventListener('click', () => runWithPriority(ImmediatePriority, increment));
document.querySelector('#reset')!.addEventListener('click', () => runWithPriority(ImmediatePriority, () => setSize(20)));
