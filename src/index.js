import Alea from './lib/Alea.js';

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

	get(key, boxpointer) {
		let childbox = this.cache[key];
		if (!childbox) {
			const childdb = this.db.querySelector('#' + key);
			if (!childdb) {
				return null;
			}
			childbox = this.cache[key] = boxpointer ? boxpointer : new Databox(childdb);
			childbox.init(childdb);
			this.guids += 1;
		}

		return childbox;
	}

	// ---

	init(db = this.db) {
		this.db = db;

		this.dispose();

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
			const box = this.cache[k];

			// reinit old pointers with new data
			delete this.cache[k];
			this.get(k, box);

			box.pull();
		}
	}

	commit(value) {
		this.value = value;
		this.db.classList.add('uncommited');

		return this.value;
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

	append(key, value = '') {
		const d = document.createElement('dust');
		d.id = key;
		this.db.appendChild(d);

		const box = this.get(key);
		box.commit(value);

		return box;
	}

	prepend(key, value = '') {
		const d = document.createElement('dust');
		d.id = key;
		this.db.insertBefore(d, this.db.firstChild);

		const box = this.get(key);
		box.commit(value);

		return box;
	}

	forsure(key, dflt) {
		let box = this.get(key);
		if (box === null) {
			box = this.append(key, dflt);
		}

		return box;
	}

	// --
	toString() {
		return String(this.value);
	}

	toArray() {}

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
	constructor() {
		this.cache = {
			listeners: {}
		};
	}

	init() {
		this.db = new Databox(document.querySelector('#d220531 databox')).init();
		this.bb = new Databox(document.querySelector('#d220531 blackbox')).init();
		this.wb = new Databox(document.querySelector('#d220531 whitebox')).init();
		this.print = new Databox(document.querySelector('#devlog #print')).init();

		return this;
	}

	run() {
		//this.step();

		this.on('step', () => {
			const random = this.bb.forsure('random', this.db.get('seed'));
			random.commit(new Alea(random.toNumber()).next());
		});
		this.on('step', () => this.step());

		this.on('click step', () => this.event('step'));

		return this;
	}

	push() {
		this.wb.push();
		this.bb.push();
	}

	stdin(type, key) {
		this.event(`${type} ${key}`);
	}

	step() {
		const step = this.bb.get('step').toNumber() + 1;

		this.bb.get('step').commit(step);
		this.wb.get('step').commit(this.draw(step));

		this.push();

		stdout(this.print, `step: ${step}, seed: ${this.db.get('seed')}`);
	}

	draw(step) {
		const graphlen = 10;
		const steppos = step % graphlen;
		const graph = '-'.repeat(steppos) + '▮' + '-'.repeat(9 - steppos);
		const wbstep = `[x${Math.floor(step / 10)}]~[${graph}]`;

		return wbstep;
	}

	// --

	on(type, callback) {
		const guids = this.bb.forsure('guids', 0);
		const events = this.bb.forsure('events');

		const guid = guids.commit(guids.toNumber() + 1);
		const key = 'evt_' + guid;
		events.append(key, type);
		this.cache.listeners[key] = callback;

		guids.push();
		events.push();
	}

	event(key) {
		stdout(this.print, key);
		const events = this.bb.forsure('events');

		for (const k in this.cache.listeners) {
			if (events.get(k).toString() === key) {
				this.cache.listeners[k]();
			}
		}
	}
}

function main() {
	const error = new Databox(document.querySelector('whitebox #error')).init();
	try {
		const box = new D220531().init().run();
		document.addEventListener('click', (e) => {
			try {
				box.stdin('click', e.target.id);
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
