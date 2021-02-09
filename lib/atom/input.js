'use babel';

import { CompositeDisposable, TextEditor, Panel } from 'atom';

export default class Input {
	subscriptions: CompositeDisposable;
	miniEditor: TextEditor;
	panel: Panel;
	prevElement: Element;
	resolve: Function;
	reject: Function;

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

	destroy(): void {
		this.subscriptions.dispose();
	}

	async show(word: String): Promise<String> {
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
