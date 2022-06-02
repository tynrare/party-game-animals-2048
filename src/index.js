import { d220531 } from './d220531/index.js';
import WebglApp from './webgl/index.js';

function main() {
	d220531();
	new WebglApp().init().run();
}

if (document.readyState == 'loading') {
	// loading yet, wait for the event
	document.addEventListener('DOMContentLoaded', main);
} else {
	// DOM is ready!
	main();
}
