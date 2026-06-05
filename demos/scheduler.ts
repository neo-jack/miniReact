import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_cancelCallback as cancelCallback,
	unstable_shouldYield as shouldYield,
	unstable_LowPriority as LowPriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	CallbackNode
} from 'scheduler';

const output = document.querySelector<HTMLPreElement>('#output')!;
let lowTask: CallbackNode | null = null;
let version = 0;
const lines: string[] = [];

function log(message: string) {
	lines.push(message);
	output.textContent = lines.slice(-40).join('\n');
}

document.querySelector('#low')!.addEventListener('click', () => {
	if (lowTask !== null) cancelCallback(lowTask);
	const id = ++version;
	let remaining = 2000;
	let checksum = 0;
	log(`低优先级 #${id} 已排队`);
	function work(didTimeout: boolean): any {
		if (id !== version) return null;
		while (remaining > 0 && (didTimeout || !shouldYield())) {
			for (let i = 0; i < 20000; i++) checksum = (checksum + i) % 1000003;
			remaining--;
		}
		if (remaining > 0) {
			log(`低优先级 #${id} 让出线程，剩余 ${remaining}`);
			return work;
		}
		lowTask = null;
		log(`低优先级 #${id} 完成，校验值 ${checksum}`);
		return null;
	}
	lowTask = scheduleCallback(LowPriority, work);
});

document.querySelector('#high')!.addEventListener('click', () => {
	log('高优先级任务已排队');
	scheduleCallback(UserBlockingPriority, () => log('高优先级任务完成'));
});

document.querySelector('#cancel')!.addEventListener('click', () => {
	if (lowTask === null) return;
	cancelCallback(lowTask);
	lowTask = null;
	version++;
	log('低优先级任务已取消');
});
