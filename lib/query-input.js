'use babel';

import { TextEditor, Panel } from 'atom';

export default class QueryInput {
	miniEditor: TextEditor;
	panel: Panel;
	prevElement: Element;
	resolve: Function;
	reject: Function;

	constructor() {
		this.miniEditor = new TextEditor({ mini: true });
		this.panel = atom.workspace.addModalPanel({
			item: this.miniEditor.element,
			visible: false
		});
		atom.commands.add(this.miniEditor.element, {
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
		});
	}

	async show(word: String): Promise {
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

	hide(): void {
		this.panel.hide();
		if (this.prevElement) {
			this.prevElement.focus();
			this.prevElement = null;
		}
	}
}
