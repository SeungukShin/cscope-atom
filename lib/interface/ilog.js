'use babel';

export default class ILog {
	err(...args): void {
		throw new Error('not implemented:', ...args);
	}

	warn(...args): void {
		throw new Error('not implemented:', ...args);
	}

	info(...args): void {
		throw new Error('not implemented:', ...args);
	}
}
