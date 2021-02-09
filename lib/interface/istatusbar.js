'use babel';

export default class IStatusbar {
	destroy(): void {
		throw new Error('not implemented');
	}

	set(statusBar: Object): void {
		throw new Error('not implemented:', statusBar);
	}

	show(message: String): void {
		throw new Error('not implemented:', message);
	}

	hide(): void {
		throw new Error('not implemented');
	}
}
