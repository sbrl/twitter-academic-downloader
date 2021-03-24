"use strict";

function sleep_async(ms) {
	return new Promise((resolve, _reject) => {
		setTimeout(resolve, ms);
	});
}

export default sleep_async;
