'use babel';

import { TextEditor } from 'atom';
import IEditor from '../interface/ieditor';

export default class Editor extends IEditor {
	editor: TextEditor;

	constructor(editor: TextEditor) {
		super();
		this.editor = editor;
	}

	close(): void {
		if (this.editor) {
			this.editor.destroy();
			this.editor = null;
		}
	}

	destroy(): void {}
}
