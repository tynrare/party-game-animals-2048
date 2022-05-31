//https://github.com/davidbau/seedrandom
/**
 * @file Alea.js
 * @author tynrare
 * @version 1
 * @module Core
 */

/**
 * объект, хранящий состояния и функции генерации псевдослучайных чисел
 */
class Alea {
	/**
	 * создает инстанс рандома, загружает из кеша, если находит
	 *
	 * @param {string} seed seed for random
	 * @param {object} [options] опции
	 * @param {boolean} options.autocache кешировать ли результаты вызовов автоматически.
	 */
	constructor(seed, options) {
		this.seed = seed;
		this.options = options;
		this.genFactsnapData();
	}

	/**
	 * возвращает следующее псевдослучайное значение
	 *
	 * @returns {number} сгенерированное число
	 */
	next() {
		//хз что за число и что должно значить
		const N1 = 2091639;
		// 2^-32
		const N2 = 2.3283064365386963e-10;

		const t = N1 * this.s0 + this.c * N2;
		this.s0 = this.s1;
		this.s1 = this.s2;
		this.s2 = t - (this.c = t | 0);

		return this.s2;
	}

	/**
	 * @returns {number} Псевдослучайное целое число
	 */
	int32() {
		const N1 = 0x100000000;

		return (this.next() * N1) | 0;
	}

	/**
	 * @returns {number} Псевдослучайное число
	 */
	double() {
		const N1 = 0x200000;
		// 2^-53
		const N2 = 1.1102230246251565e-16;

		return this.next() + ((this.next() * N1) | 0) * N2;
	}

	/**
	 * случайное число в диапазоне и с округлением
	 *
	 * @param {number} min минимальное значение
	 * @param {number} max максимальное значение
	 * @param {number} precision кол-во нулей после запятой
	 * @returns {number} (min, max)
	 */
	range(min, max, precision) {
		const val = this.next() * (max - min) + min;
		if (typeof precision === 'undefined') {
			return val;
		}

		return Number(Math.round(Number(val + 'e' + precision)) + 'e-' + precision);
	}

	/**
	 * генерирует новые данные на основе сида
	 */
	genFactsnapData() {
		const mash = Alea.genMash();
		// Apply the seeding algorithm from Baagoe.
		const addSeedMash = (key) => {
			this[key] -= mash(this.seed);
			if (this[key] < 0) {
				this[key] += 1;
			}
		};
		this.c = 1;
		this.s0 = mash(' ');
		this.s1 = mash(' ');
		this.s2 = mash(' ');
		addSeedMash('s0');
		addSeedMash('s1');
		addSeedMash('s2');
	}

	/**
	 * @returns {Function} функция генерации рандомных числел на базе строки
	 */
	static genMash() {
		let n = 0xefc8249d;

		/* eslint-disable max-statements */
		/**
		 * генерация данных на базе строки
		 *
		 * @param {string|*} data данные, из которых надо получить число
		 * @returns {number} новое число
		 */
		function mash(data) {
			const sdata = data.toString();
			const N1 = 0.02519603282416938;
			// 2^32
			const N2 = 0x100000000;
			// 2^-32
			const N3 = 2.3283064365386963e-10;

			for (let i = 0; i < sdata.length; i++) {
				n += sdata.charCodeAt(i);
				let h = N1 * n;
				n = h >>> 0;
				h -= n;
				h *= n;
				n = h >>> 0;
				h -= n;
				n += h * N2;
			}

			return (n >>> 0) * N3;
		}
		/* eslint-disable max-statements */

		return mash;
	}
}

export default Alea;
