const { ipcRenderer } = require('electron');
const Timer = require('timer.js');
const ProgressBar = require('progressbar.js');

let timerContainer = document.getElementById('timer-container');
let switchButton = document.getElementById('switch-button');
let progressBar = new ProgressBar.Circle('#timer-container', {
	strokeWidth: 2,
	color: '#F44336',
	trailColor: '#eee',
	trailWidth: 1,
	svgStyle: null,
});
let workTime = 1 * 60; // rest after 1 minute
let restTime = 10; // 10 seconds
let state = {};

const render = () => {
	let { remainTime: s, type } = state;
	let maxTime = type < 2 ? workTime : restTime;
	let ss = s % 60;
	let mm = ((s - ss) / 60).toFixed();
	progressBar.set(1 - s / maxTime);
	progressBar.setText(
		`${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
	);
	if (type === 0) {
		switchButton.innerText = 'Start Coding';
	} else if (type === 1) {
		switchButton.innerText = 'STOP';
	} else if (type === 2) {
		switchButton.innerText = 'Break Time';
	} else {
		switchButton.innerText = 'END';
	}
};

function setState(_state) {
	Object.assign(state, _state);
	render();
} //end setState

const startWork = () => {
	setState({ type: 1, remainTime: workTime });
	workTimer.start(workTime);
}; //end startWork

function startRest() {
	setState({ type: 3, remainTime: restTime });
	workTimer.start(restTime);
} //end startRest

const workTimer = new Timer({
	ontick: (ms) => {
		setState({ remainTime: (ms / 1000).toFixed(0) });
	}, // 每秒更新时间
	onstop: () => {
		setState({ type: 0, remainTime: 0 });
	}, // 只要是停止，都会进入到工作状态
	onend: function () {
		let { type } = state;
		if (type === 1) {
			setState({ type: 2, remainTime: 0 });
			if (process.platform === 'darwin') {
				// 在Mac下才能使用notification
				notification({
					title: 'Finish coding',
					body: 'Start your break？',
					actionText: 'break for 5',
					closeButtonText: 'go back to work',
					onaction: startRest,
					onclose: startWork,
				});
			} else {
				// windows直接alert
				alert('Finish Working');
			}
		} else if (type === 3) {
			setState({ type: 0, remainTime: 0 });
			if (process.platform === 'darwin') {
				notification({
					body: 'Start Coding!',
					title: 'break end',
					closeButtonText: 'continue chilling',
					actionText: 'Start Coding',
					onaction: startWork,
					onclose: startRest,
				});
			} else {
				alert('Finish Working');
			}
		}
	},
}); // end of workTimer

switchButton.onclick = function () {
	if (this.innerText === 'Start Coding') {
		startWork();
	} else if (this.innerText === 'Break Time') {
		startRest();
	} else {
		workTimer.stop();
	}
};
///////////////////
const notification = async ({
	title,
	body,
	actionText,
	closeButtonText,
	onclose,
	onaction,
}) => {
	let res = await ipcRenderer.invoke('notification', {
		title,
		body,
		actions: [{ text: actionText, type: 'button' }],
		closeButtonText,
	});
	res.event === 'close' ? onclose() : onaction();
}; // end of notification

setState({
	remainTime: 0,
	type: 0, // 0 start coding、1 stop、2 time for break、3 end
});
