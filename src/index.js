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

	pull(databox = this) {
		const asText = databox.db.innerHTML;
		const asNumber = this.toNumber(asText);
		this.value = asNumber ? asText : asNumber;
		for (const k in databox.cache) {
			const box = this.cache[k];

			// reinit old pointers with new data
			delete this.cache[k];
			this.get(k, box);

			box.pull(databox.get(k));
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
			box = this.prepend(key, dflt);
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

function graph_1D(value) {
	const graphlen = 10;
	const steppos = Math.round(value) % graphlen;
	const graph = '-'.repeat(steppos) + '▮' + '-'.repeat(graphlen - steppos - 1);
	const fullgraph = `[x${Math.floor(value / 10)}]~[${graph}]`;

	return fullgraph;
}

class D220531 {
	constructor() {
		this.cache = {
			listeners: {}
		};
	}

	init() {
		this.db = new Databox(document.querySelector('databox')).init();
		this.bb = new Databox(document.querySelector('blackbox')).init();
		this.wb = new Databox(document.querySelector('whitebox')).init();
		this.print = new Databox(document.querySelector('wb#print')).init();
		this.table = this.bb.get('table');

		return this;
	}

	dispose() {
		this.db.dispose();
		this.bb.dispose();
		this.wb.dispose();
		this.print.dispose();
	}

	run() {
		this.table.get('step').commit(0);
		this.table.forsure('rand', this.db.get('seed'));

		this.on('step', () => this.step());

		this.on('click:step', () => this.event('step'));
		this.on('click:undo', () => {
			this.table.pull(this.bb.get('stamp'));
			this.write();
		});
		this.on('click:restart', () => {
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
		this.event(`${type}:${key}`);
	}

	step() {
		const step = this.table.get('step');
		const rand = this.table.get('rand');
		rand.commit(new Alea(rand.toNumber()).next());

		step.commit(step.toNumber() + 1);
		this.write(step);
	}

	write() {
		const step = this.table.get('step').toNumber();
		const rand = this.table.get('rand').toNumber();

		this.wb.get('step').commit(graph_1D(step));
		this.wb.get('rand').commit(graph_1D(rand * 100));

		this.serialize();

		this.push();
	}

	// --

	serialize() {
		const stamp = this.bb.forsure('stamp');
		this.table.stamp(stamp);

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

function d220531() {
	const error = new Databox(document.querySelector('wb#error')).init();
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

function time(t = new Date()) {
	//return `${t.getYear()}${t.getMonth()}${t.getDay()} ${t.getHours()}${t.getMinutes()}`;
	return t.toString();
}

function main() {
	d220531();

	const timestamp = new Databox(document.querySelector('databox#legs #timestamp')).init();

	setInterval(() => {
		timestamp.commit(time());
		timestamp.push();
	}, 31141.5);
}

if (document.readyState == 'loading') {
	// loading yet, wait for the event
	document.addEventListener('DOMContentLoaded', main);
} else {
	// DOM is ready!
	main();
}
