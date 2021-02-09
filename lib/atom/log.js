'use babel';

import ILog from '../interface/ilog';
import IConfig from '../interface/iconfig';

export default class Log extends ILog {
	static instance: Log;
	config: IConfig;

	constructor(config: IConfig) {
		if (!Log.instance) {
			super();
			this.config = config;
			Log.instance = this;
		}
		return Log.instance;
	}

	static getInstance(config: IConfig): Log {
		if (!Log.instance) {
			Log.instance = new Log(config);
		}
		return Log.instance;
	}

	err(...args): void {
		console.log('E:', ...args);
	}

	warn(...args): void {
		const l = this.config.get('logLevel');
		if (l !== 'E') {
			console.log('W:', ...args);
		}
	}

	info(...args): void {
		const l = this.config.get('logLevel');
		if (l === 'I') {
			console.log('I:', ...args);
		}
	}
}
