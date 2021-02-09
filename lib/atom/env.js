'use babel';

import * as path from 'path';
import * as process from 'process';
import IEnv from '../interface/ienv';
import IEditor from '../interface/ieditor';
import { FilePosition } from '../interface/position';
import Editor from './editor';
import Input from './input';

export default class Env extends IEnv {
	static instance: Env;

	constructor() {
		if (!Env.instance) {
			super();
			Env.instance = this;
		}
		return Env.instance;
	}

	static getInstance(): Env {
		if (!Env.instance) {
			Env.instance = new Env();
		}
		return Env.instance;
	}

	destroy(): void {}

	getCurrentDirectory(): String {
		const projects = atom.project.getPaths();
		if (projects.length > 0) {
			return projects[0];
		}
		const editor = atom.workspace.getActiveTextEditor();
		if (editor) {
			const file = editor.getPath();
			return path.dirname(file);
		}
		if (process.env.home) {
			return process.env.home;
		}
		return '';
	}

	getCurrentWord(): String {
		const editor = atom.workspace.getActiveTextEditor();
		if (!editor) {
			return '';
		}
		return editor.getWordUnderCursor();
	}

	getCurrentPosition(): FilePosition {
		const editor = atom.workspace.getActiveTextEditor();
		if (!editor) {
			return null;
		}
		const file = editor.getPath();
		const point = editor.getCursorBufferPosition();
		return new FilePosition(file, point.row, point.column);
	}

	async open(position: FilePosition, preview: Boolean): Promise<IEditor> {
		const uri = position.getFile();
		const options = {};
		if (position.getLine()) {
			options.initialLine = position.getLine();
		}
		if (position.getColumn()) {
			options.initialColumn = position.getColumn();
		}
		if (preview) {
			options.activatePane = false;
			options.location = 'bottom';
		}
		const editor = await atom.workspace.open(uri, options);
		return new Editor(editor);
	}

	async getInput(value: String): Promise<String> {
		const input = new Input();
		const word = await input.show(value);
		input.destroy();
		return word;
	}

	observeFiles(extensions: String, callback: Function): Object {
		return atom.project.onDidChangeFiles((events) => {
			const exts = extensions.split(',');
			let changed = false;
			for (const event of events) {
				const ext = path.extname(event.path).substring(1).toLowerCase();
				if (exts.includes(ext)) {
					changed = true;
					break;
				}
			}
			if (changed) {
				callback();
			}
		});
	}
}
