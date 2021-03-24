"use strict";

import a from './Ansi.mjs';

const LOG_LEVELS = {
	DEBUG: 0,
	INFO: 1,
	LOG: 2,
	WARN: 4,
	ERROR: 8,
	NONE: 2048
};

class Log {
	
	
	constructor() {
		this.start = new Date();
		
		// This is set automatically by the CLI
		this.level = LOG_LEVELS.DEBUG;
	}
	
	
	debug(...message) {
		if(this.level > LOG_LEVELS.DEBUG) return;
		this.__do_log("debug", ...message);
	}
	
	info(...message) {
		if(this.level > LOG_LEVELS.INFO) return;
		this.__do_log("info", ...message);
	}
	
	log(...message) {
		if(this.level > LOG_LEVELS.LOG) return;
		this.__do_log("log", ...message);
	}
	
	warn(...message) {
		if(this.level > LOG_LEVELS.WARN) return;
		this.__do_log("warn", ...message);
	}
	
	error(...message) {
		if(this.level > LOG_LEVELS.ERROR) return;
		this.__do_log("error", ...message);
	}
	
	
	__do_log(level, ...message) {
		message.unshift(`${a.locol}[ ${((new Date() - this.start) / 1000).toFixed(3)}]${a.reset}`);
		let part = `[ ${level} ]`;
		switch(level) {
			case "debug":
				part = a.locol + part;
				break;
			case "warn":
				part = a.fyellow + part;
				break;
			case "error":
				part = a.fred + part;
				break;
		}
		message.unshift(part)
		
		console.error(...message);
	}
}

// You won't normally need these
export { LOG_LEVELS };

export default new Log();
