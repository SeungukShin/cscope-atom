'use babel';

const path = require('path');
const process = require('process');
const IEnv = require('../interface/ienv');
const { FilePosition } = require('../interface/position');
const Editor = require('./editor');
const Input = require('./input');

module.exports = class Env extends IEnv {
	/**
	 * @property {Env} instance - static
	 */

	/**
	 * @constructor
	 * @returns {Env}
	 */
	constructor() {
		if (!Env.instance) {
			super();
			Env.instance = this;
		}
		return Env.instance;
	}

	/**
	 * @returns {Env}
	 */
	static getInstance() {
		if (!Env.instance) {
			Env.instance = new Env();
		}
		return Env.instance;
	}

	/**
	 * @returns {void}
	 */
	destroy() {}

	/**
	 * Get a current directory.
	 * @returns {String} - A current directory.
	 */
	getCurrentDirectory() {
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

	/**
	 * Get a current word under the cursor.
	 * @returns {String} - A current word.
	 */
	getCurrentWord() {
		const editor = atom.workspace.getActiveTextEditor();
		if (!editor) {
			return '';
		}
		return editor.getWordUnderCursor();
	}

	/**
	 * Get a current position of the cursor.
	 * @returns {FilePosition} - A current position of the cursor.
	 */
	getCurrentPosition() {
		const editor = atom.workspace.getActiveTextEditor();
		if (!editor) {
			return null;
		}
		const file = editor.getPath();
		const point = editor.getCursorBufferPosition();
		return new FilePosition(file, point.row, point.column);
	}

	/**
	 * Open a file and return editor object.
	 * @param {FilePosition} position - A file name and cursor position.
	 * @param {Boolean} preview - A preview option.
	 * @returns {Promise<IEditor>} - An editor object.
	 */
	async open(position, preview) {
		return new Promise((resolve, reject) => {
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
			atom.workspace.open(uri, options).then((editor) => {
				resolve(new Editor(editor));
			}), ((error) => {
				reject(error);
			});
		});
	}

	/**
	 * Show an input box and get an input.
	 * @param {String} value - A default value.
	 * @returns {Promise<String>} - An input value.
	 */
	async getInput(value) {
		const input = new Input();
		return input.show(value).then(() => {
			input.destroy();
		});
	}

	/**
	 * Observe changes of files.
	 * @param {String} extensions - File extensions to observe.
	 * @param {Function} callback - A callback function to call when a file is changed.
	 * @returns {Object} - A disposible object.
	 */
	observeFiles(extensions, callback) {
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
