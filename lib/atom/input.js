'use babel';

const { CompositeDisposable } = require('atom');

module.exports = class Input {
	/**
	 * @property {CompositeDisposable} subscriptions
	 * @property {TextEditor} miniEditor
	 * @property {Panel} panel
	 * @property {Element} prevElement
	 * @property {Function} resolve
	 * @property {Function} reject
	 */

	/**
	 * @constructor
	 * @returns {Input}
	 */
	constructor() {
		this.subscriptions = new CompositeDisposable();
		this.miniEditor = atom.workspace.buildTextEditor({ mini: true });
		this.panel = atom.workspace.addModalPanel({
			item: this.miniEditor.element,
			visible: false
		});
		this.prevElement = null;
		this.resolve = null;
		this.reject = null;
		this.subscriptions.add(atom.commands.add(this.miniEditor.element, {
			'core:confirm': () => {
				if (this.resolve) {
					this.resolve(this.miniEditor.getText());
					this.resolve = null;
					this.reject = null;
				}
				this.hide();
			},
			'core:cancel': () => {
				if (this.reject) {
					this.reject();
					this.resolve = null;
					this.reject = null;
				}
				this.hide();
			}
		}));
	}

	/**
	 * @returns {void}
	 */
	destroy() {
		this.subscriptions.dispose();
	}

	/**
	 * @param {String} word
	 * @returns {Promise<String>}
	 */
	async show(word) {
		return new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
			this.prevElement = document.activeElement;
			this.miniEditor.setText(word);
			this.miniEditor.selectAll();
			this.panel.show();
			this.miniEditor.element.focus();
		});
	}

	/**
	 * @returns {Promise<void>}
	 */
	async hide() {
		this.panel.hide();
		if (this.reject) {
			this.reject();
			this.resolve = null;
			this.reject = null;
		}
		if (this.prevElement) {
			this.prevElement.focus();
			this.prevElement = null;
		}
	}
}
