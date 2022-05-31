class Databox {
	/**
	 * @param {HTMLElement} db .
	 */
	constructor(db) {
		this.db = db;
		this.value = null;
		this.cache = {};
		this.guids = 0;
	}

	get(key) {
		let childbox = this.cache[key];
		if (!childbox) {
			const childdb = this.db.querySelector('#' + key);
			childbox = this.cache[key] = new Databox(childdb);
			childbox.init();
			this.guids += 1;
		}

		return childbox;
	}

	init() {
		this.db.classList.add('wired');
		this.guids = 0;
		this.pull();

		return this;
	}

	dispose() {
		this.db.classList.remove('wired');
		for (const k in this.cache) {
			this.cache[k].dispose();
			delete this.cache[k];
		}
	}

	pull() {
		const asText = this.db.innerHTML;
		const asNumber = this.toNumber(asText);
		this.value = asNumber ? asText : asNumber;
		for (const k in this.cache) {
			this.cache[k].pull();
		}
		// ..
	}

	commit(value) {
		this.value = value;
		this.db.classList.add('uncommited');
	}

	push() {
		if (this.guids) {
			for (const k in this.cache) {
				this.cache[k].push();
			}
		} else {
			this.db.innerHTML = this.value;
		}

		this.db.classList.remove('uncommited');
	}

	// --
	toString() {
		return this.value;
	}

	toArray() {
	}

	toNumber(value = this.value) {
		const asNumber = Number(value);

		return isNaN(asNumber) ? null : asNumber;
	}
}

/**
 * @param {Databox} output .
 * @param {string} text .
 */
function stdout(output, text) {
	output.commit(text);
	output.push();
}

class D220531 {
	init() {
		this.db = new Databox(document.querySelector('#d220531 databox')).init();
		this.bb = new Databox(document.querySelector('#d220531 blackbox')).init();
		this.wb = new Databox(document.querySelector('#d220531 whitebox')).init();
		this.print = new Databox(document.querySelector('#devlog #print')).init();

		return this;
	}

	run() {
		this.step();
		this.push();

		return this;
	}

	push() {
		this.wb.push();
		this.bb.push();
	}

	stdin(key) {
		stdout(this.print, `click ${key}`);
		switch (key) {
			case 'step':
				this.step();
				this.push();
				break;
			default:
				break;
		}
	}

	step() {
		const step = this.bb.get('step').value + 1;

		this.bb.get('step').commit(step);
		this.wb.get('step').commit(this.draw(step));

		stdout(this.print, `step: ${step}, seed: ${this.db.get('seed')}`);
	}

	draw(step) {
		const graphlen = 10;
		const steppos = step % graphlen;
		const graph = '-'.repeat(steppos) + '▮' + '-'.repeat(10 - steppos);
		const wbstep = `[x${Math.floor(step / 10)}]~[${graph}]`;

		return wbstep;
	}
}

function main() {
	const error = new Databox(document.querySelector('whitebox #error')).init();
	try {
		const box = new D220531().init().run();
		document.addEventListener('click', (e) => {
			try {
				box.stdin(e.target.id);
			} catch (err) {
				stdout(error, err.message);
			}
		});
	} catch (err) {
		stdout(error, err.message);
	}
}

if (document.readyState == 'loading') {
	// loading yet, wait for the event
	document.addEventListener('DOMContentLoaded', main);
} else {
	// DOM is ready!
	main();
}
