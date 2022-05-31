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
			const childdb = this.db.querySelector(':scope > #' + key);
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

		this.db.classList.add('wired');
		this.guids = 0;
		this.pull();

		return this;
	}

	dispose() {
		this.db.classList.remove('wired');
		this.db.classList.remove('uncommited');
		for (const k in this.cache) {
			this.cache[k].dispose();
			delete this.cache[k];
		}

		if (this.db.tagName === 'DUST') {
			this.db.parentNode.removeChild(this.db);
		}
	}

	// --

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

		return this;
	}

	push(databox = this) {
		if (this.guids) {
			for (const k in this.cache) {
				this.cache[k].push(databox.get(k));
			}
		} else {
			this.db.innerHTML = databox.value;
		}

		this.db.classList.remove('uncommited');
	}

	// --

	stamp(databox) {
		if (this.db.classList.contains('uncommited')) {
			databox.commit(this.db.innerHTML);
		}

		for (const k in this.cache) {
			const box = this.cache[k];
			if (box.db.classList.contains('uncommited')) {
				box.stamp(databox.forsure(k));
			}
		}
	}

	// --

	append(key, value = '') {
		const d = document.createElement('dust');
		d.id = key;
		d.innerHTML = value;
		this.db.appendChild(d);

		const box = this.get(key);
		box.commit(value);

		return box;
	}

	prepend(key, value = '') {
		const d = document.createElement('dust');
		d.id = key;
		d.innerHTML = value;
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
		this.inventory = this.bb.get('inventory');

		return this;
	}

	dispose() {
		this.db.dispose();
		this.bb.dispose();
		this.wb.dispose();
		this.print.dispose();
	}

	run() {
		this.inventory.get('step').commit(0);
		this.inventory.forsure('random', this.db.get('seed'));

		this.on('step', () => this.step());

		this.on('click step', () => this.event('step'));
		this.on('click undo', () => {
			this.inventory.push(this.bb.get('stamp'));
			this.inventory.pull();
			this.write(step);
		});
		this.on('click restart', () => {
			this.dispose();
			this.init();
			this.run();
		});

		this.event('step');

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
		const step = this.inventory.get('step');
		const random = this.inventory.get('random');
		random.commit(new Alea(random.toNumber()).next());

		step.commit(step.toNumber() + 1);
		this.write(step);
	}

	write() {
		const step = this.inventory.get('step').toNumber();
		const graphlen = 10;
		const steppos = step % graphlen;
		const graph = '-'.repeat(steppos) + '▮' + '-'.repeat(9 - steppos);
		const wbstep = `[x${Math.floor(step / 10)}]~[${graph}]`;

		this.wb.get('step').commit(wbstep);

		this.serialize();

		this.push();

		return wbstep;
	}

	// --

	serialize() {
		const stamp = this.bb.forsure('stamp');
		this.inventory.stamp(stamp);

		return stamp;
	}

	// --

	on(type, callback) {
		const events = this.bb.forsure('events');
		const guids = events.forsure('guids', 0);

		const guid = guids.commit(guids.toNumber() + 1).value;
		const key = 'evt_' + guid;
		events.append(key, type);
		this.cache.listeners[key] = callback;

		guids.push();
		events.push();
	}

	event(key) {
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
