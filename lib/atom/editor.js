'use babel';

const { TextEditor } = require('atom');
const IEditor = require('../interface/ieditor');

module.exports = class Editor extends IEditor {
	/**
	 * @property {TextEditor} editor
	 */

	/**
	 * @constructor
	 * @param {TextEditor} editor
	 * @returns {Editor}
	 */
	constructor(editor) {
		super();
		this.editor = editor;
	}

	/**
	 * @returns {String}
	 */
	getText() {
		return this.editor.getText();
	}

	/**
	 * @param {Number} line
	 * @returns {String}
	 */
	getTextLine(line) {
		return this.editor.lineTextForBufferRow(line);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async close() {
		if (this.editor) {
			this.editor.destroy();
			this.editor = null;
		}
	}

	/**
	 * @returns {void}
	 */
	destroy() {}
}
