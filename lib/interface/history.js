'use babel';

import ILog from './ilog';
import { FilePosition } from './position';

export default class History {
	log: ILog;
	positions: FilePosition[];

	constructor(log: ILog) {
		this.log = log;
		this.positions = [];
	}

	pop(): FilePosition {
		const position = this.positions.pop();
		if (!position) {
			this.log.warn('End of History');
		}
		return position;
	}

	push(position: FilePosition): FilePosition {
		this.positions.push(position);
		return position;
	}
}
