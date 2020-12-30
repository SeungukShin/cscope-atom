'use babel';

import { Point } from 'atom';
import Log from './log';

export default class Position {
	uri: String;
	position: Point;

	constructor(uri: String = null, position: Point = null) {
		const editor = atom.workspace.getActiveTextEditor();
		if (uri) {
			this.uri = uri;
		} else if (editor) {
			this.uri = editor.getPath();
		} else {
			this.uri = '';
			Log.err('Cannot find active text editor');
		}
		if (position) {
			this.position = position;
		} else if (editor) {
			this.position = editor.getCursorBufferPosition();
		} else {
			this.position = new Point(0, 0);
			Log.err('Cannot find active text editor');
		}
	}

	getUri(): String {
		return this.uri;
	}

	getPosition(): Point {
		return this.position;
	}

	getRow(): Number {
		return this.position.row;
	}

	getColumn(): Number {
		return this.position.column;
	}

	async go(preview: Boolean = false): Promise {
		const uri = this.uri;
		const options = {
			initialLine: this.position.row,
			initialColumn: this.position.column,
			activatePane: !preview
		};
		return atom.workspace.open(uri, options);
	}
}
