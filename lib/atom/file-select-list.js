'use babel';

const path = require('path');
const { CompositeDisposable, Point } = require('atom');
const SelectListView = require('atom-select-list');
const { IFileSelectListItem, IFileSelectList } = require('../interface/ifile-select-list');

class FileSelectListItem extends IFileSelectListItem {
	/**
	 * @property {String} file
	 * @property {Number} line
	 * @property {Number} column
	 * @property {String} label
	 * @property {String} detail
	 */

	/**
	 * @constructor
	 * @param {String} file
	 * @param {Number} line
	 * @param {Number} column
	 * @param {String} label
	 * @param {String} detail
	 * @returns {FileSelectListItem}
	 */
	constructor(file, line, column, label, detail) {
		super();
		this.file = file;
		this.line = line;
		this.column = column;
		this.label = label;
		this.detail = detail;
	}

	/**
	 * @returns {String}
	 */
	getFile() {
		return this.file;
	}

	/**
	 * @returns {Number}
	 */
	getLine() {
		return this.line;
	}

	/**
	 * @returns {Number}
	 */
	getColumn() {
		return this.column;
	}

	/**
	 * @returns {String}
	 */
	getLabel() {
		return this.label;
	}

	/**
	 * @returns {String}
	 */
	getDetail() {
		return this.detail;
	}

	/**
	 * @param {String} file
	 * @returns {void}
	 */
	setFile(file) {
		this.file = file;
	}

	/**
	 * @param {Number} line
	 * @returns {void}
	 */
	setLine(line) {
		this.line = line;
	}

	/**
	 * @param {Number} column
	 * @returns {void}
	 */
	setColumn(column) {
		this.column = column;
	}

	/**
	 * @param {String} label
	 * @returns {void}
	 */
	setLabel(label) {
		this.label = label;
	}

	/**
	 * @param {String} detail
	 * @returns {void}
	 */
	setDetail(detail) {
		this.detail = detail;
	}
}

class FileSelectList extends IFileSelectList {
	/**
	 * @property {CompositeDisposable} disposables
	 * @property {SelectListView} selectList
	 * @property {Panel} panel
	 * @property {String} word
	 * @property {String} cwd
	 * @property {Boolean} previewOption
	 * @property {Pane} previewPane
	 * @property {Element} prevElement
	 * @property {Function} resolve
	 * @property {Function} reject
	 * @property {Function} addIconToElement
	 */

	/**
	 * @constructor
	 * @param {IFileSelectListItem[]} items
	 * @param {String} word
	 * @param {String} cwd
	 * @param {Boolean} preview
	 * @param {Function} addIconToElement
	 * @returns {FileSelectList}
	 */
	constructor(items, word, cwd, preview, addIconToElement) {
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

	/**
	 * @returns {void}
	 */
	destroy() {
		this.hide();
		this.selectList.destroy();
		this.disposables.dispose();
	}

	/**
	 * @param {IFileSelectListItem[]} items
	 * @param {String} word
	 * @param {String} cwd
	 * @returns {void}
	 */
	update(items, word, cwd) {
		this.selectList.reset();
		this.disposables.dispose();
		this.disposables = new CompositeDisposable();
		this.word = word;
		this.cwd = cwd;
		this.selectList.update({ items: items });
	}

	/**
	 * @returns {Promise<IFileSelectListItem>}
	 */
	async show() {
		return new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
			this.prevElement = document.activeElement;
			this.panel.show();
			this.selectList.focus();
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
		if (this.previewPane) {
			this.previewPane.destroy();
			this.previewPane = null;
		}
		if (this.prevElement) {
			this.prevElement.focus();
			this.prevElement = null;
		}
	}

	/**
	 * @param {IFileSelectListItem} item
	 * @param {Boolean} visible
	 * @returns {Element}
	 */
	elementForItem(item, { /*index, selected,*/ visible }) {
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

	/**
	 * @param {IFileSelectListItem} item
	 * @returns {Promise<void>}
	 */
	async preview(item) {
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

	/**
	 * @param {IFileSelectListItem} item
	 * @returns {Promise<void>}
	 */
	async select(item) {
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

	/**
	 * @returns {void}
	 */
	cancel() {
		this.hide();
	}
}

module.exports = {
	FileSelectListItem,
	FileSelectList
}
