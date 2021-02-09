'use babel';

import * as path from 'path';
import { CompositeDisposable, Pane, Point } from 'atom';
import SelectListView from 'atom-select-list';
import { IFileSelectListItem, IFileSelectList } from '../interface/ifile-select-list';

export class FileSelectListItem extends IFileSelectListItem {
	file: String;
	line: Number;
	column: Number;
	label: String;
	detail: String;

	constructor(file: String, line: Number, column: Number, label: String, detail: String) {
		super();
		this.file = file;
		this.line = line;
		this.column = column;
		this.label = label;
		this.detail = detail;
	}

	getFile(): String {
		return this.file;
	}

	getLine(): Number {
		return this.line;
	}

	getColumn(): Number {
		return this.column;
	}

	getLabel(): String {
		return this.label;
	}

	getDetail(): String {
		return this.detail;
	}

	setFile(file: String): void {
		this.file = file;
	}

	setLine(line: Number): void {
		this.line = line;
	}

	setColumn(column: Number): void {
		this.column = column;
	}

	setLabel(label: String): void {
		this.label = label;
	}

	setDetail(detail: String): void {
		this.detail = detail;
	}
}

export class FileSelectList extends IFileSelectList {
	disposables: CompositeDisposable;
	selectList: SelectListView;
	panel: Panel;
	word: String;
	cwd: String;
	previewOption: Boolean;
	previewPane: Pane;
	prevElement: Element;
	resolve: Function;
	reject: Function;
	addIconToElement: Function;

	constructor(items: IFileSelectListItem[], word: String, cwd: String, preview: Boolean, addIconToElement: Function) {
		super();
		this.disposables = new CompositeDisposable();
		this.word = word;
		this.cwd = cwd;
		this.previewOption = preview;
		this.previewPane = null;
		this.prevElement = null;
		this.resolve = null;
		this.reject = null;
		this.addIconToElement = addIconToElement;
		this.selectList = new SelectListView({
			items: items,
			filterKeyForItem: item => {item.getFile() + item.getLabel() + item.getDetail()},
			elementForItem: this.elementForItem.bind(this),
			didChangeSelection: this.preview.bind(this),
			didConfirmSelection: this.select.bind(this),
			didCancelSelection: this.cancel.bind(this)
		});
		this.panel = atom.workspace.addTopPanel({
			item: this.selectList.element,
			visible: false
		});
	}

	destroy(): void {
		this.hide();
		this.selectList.destroy();
		this.disposables.dispose();
	}

	update(items: IFileSelectListItem[], word: String, cwd: String): void {
		this.selectList.reset();
		this.disposables.dispose();
		this.disposables = new CompositeDisposable();
		this.word = word;
		this.cwd = cwd;
		this.selectList.update({ items: items });
	}

	async show(): Promise<IFileSelectListItem> {
		return new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
			this.prevElement = document.activeElement;
			this.panel.show();
			this.selectList.focus();
		});
	}

	hide(): void {
		this.panel.hide();
		if (this.reject) {
			this.reject();
			this.resolve = null;
			this.reject = null;
		}
		if (this.previewPane) {
			this.previewPane.destroy();
			this.previewPane = null;
		}
		if (this.prevElement) {
			this.prevElement.focus();
			this.prevElement = null;
		}
	}

	elementForItem(item, { /*index, selected,*/ visible }): Element {
		const li = document.createElement('li');
		li.style.paddingTop = '0px';
		li.style.paddingBottom = '0px';
		if (!visible) {
			return li;
		}

		const code = document.createElement('div');
		code.classList.add('primary-line');

		const func = document.createElement('span');
		func.classList.add('left');
		func.innerText = item.getLabel();
		func.style.color = 'cyan';
		func.style.fontSize = '16px';
		func.style.paddingRight = '8px';

		const text = document.createElement('span');
		text.classList.add('right');
		text.innerText = item.getDetail();
		text.style.color = 'white';
		text.style.fontSize = '16px';

		code.appendChild(func);
		code.appendChild(text);
		li.appendChild(code);

		const file = document.createElement('div');
		file.classList.add('secondary-line');

		const icon = document.createElement('span');
		text.classList.add('icon');
		if (this.addIconToElement) {
			const i = document.createElement('span');
			const disposable = this.addIconToElement(i, item.getFile());
			this.disposables.add(disposable);
			icon.appendChild(i);
			icon.style.paddingRight = '8px';
		} else {
			icon.innerHTML = "<i class='icon icon-file-text'>";
		}

		const name = document.createElement('span');
		name.classList.add('left');
		name.innerText = item.getFile();
		name.style.color = 'rgba(255, 128, 128, 1)';
		name.style.fontSize = '12px';

		let position = null;
		const line = item.getLine();
		const column = item.getColumn();
		if (line || column) {
			position = document.createElement('span');
			position.classList.add('right');
			position.innerText = ' (';
			if (line) {
				position.innerText += line.toString();
			}
			if (column) {
				position.innerText += `:${column}`;
			}
			position.innerText += ')';
			position.style.color = 'yellow';
			position.style.fontSize = '12px';
		}

		file.appendChild(icon);
		file.appendChild(name);
		if (position) {
			file.appendChild(position);
		}
		li.appendChild(file);

		return li;
	}

	async preview(item): void {
		if (this.previewOption && item) {
			if (!this.previewPane) {
				const pane = atom.workspace.getActivePane();
				this.previewPane = pane.splitDown();
			}
			const uri = path.join(this.cwd, item.getFile());
			const line = item.getLine();
			const options = {
				initialLine: line,
				activatePane: false,
				location: 'bottom'
			};
			const editor = await atom.workspace.open(uri, options);
			if (editor) {
				const text = editor.lineTextForBufferRow(line);
				const column = text.indexOf(this.word);
				if (column >= 0) {
					const position = new Point(line, column);
					editor.setCursorBufferPosition(position);
				}
			}
		}
	}

	async select(item): void {
		if (this.resolve) {
			const uri = path.join(this.cwd, item.getFile());
			const line = item.getLine();
			const options = {
				initialLine: line,
				activatePane: false
			};
			const editor = await atom.workspace.open(uri, options);
			if (editor) {
				const text = editor.lineTextForBufferRow(line);
				let column = text.indexOf(this.word);
				if (column < 0) {
					column = 0;
				}
				item.setColumn(column);
				options.initialColumn = column;
			}

			this.resolve(item);
			this.resolve = null;
			this.reject = null;

			if (this.previewPane) {
				this.previewPane.destroy();
				this.previewPane = null;
			}
			atom.workspace.open(uri, options);
		}
		this.hide();
	}

	cancel(): void {
		this.hide();
	}
}
