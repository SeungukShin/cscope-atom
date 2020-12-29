'use babel';

import Log from './log';
import Position from './position';

export default class History {
	history: Position[];

	constructor() {
		this.history = [];
	}

	push(position: Position): Position {
		if (!position) {
			position = new Position();
		}
		this.history.push(position);
		return position;
	}

	pop(): Position {
		const position = this.history.pop();
		if (!position) {
			Log.warn('End of History');
		}
		return position;
	}
}
