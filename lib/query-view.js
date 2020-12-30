'use babel';

import * as path from 'path';
import { CompositeDisposable, Range, Point, Panel, Pane } from 'atom';
import SelectListView from 'atom-select-list';
import QueryItem from './query-item';
import Position from './position';

export default class QueryView {
	disposables: CompositeDisposable;
	selectList: SelectListView;
	panel: Panel;
	cwd: String;
	addIconToElement: Function;
	prevElement: Element;
	resolve: Function;
	reject: Function;
	preview: Pane;

	constructor() {
		this.disposables = new CompositeDisposable();
		this.selectList = new SelectListView({
			items: [],
			filterKeyForItem: item => item.text,
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

	destroy() {
		this.hide();
		this.selectList.destroy();
		this.disposables.dispose();
		this.addIconToElement = null;
	}

	elementForItem(item, { index, selected, visible }) {
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
		func.innerText = item.getFunction();
		func.style.color = 'cyan';
		func.style.fontSize = '16px';
		func.style.paddingRight = '8px';

		const text = document.createElement('span');
		text.classList.add('right');
		text.innerText = item.getText();
		text.style.color = 'white';
		text.style.fontSize = '16px';

		code.appendChild(func);
		code.appendChild(text);
		li.appendChild(code);

		const file = document.createElement('div');
		file.classList.add('secondary-line');

		const icon = document.createElement('span');
		icon.classList.add('left');
		if (this.addIconToElement) {
			const i = document.createElement('span');
			const disposable = this.addIconToElement(i, item.getUri());
			this.disposables.add(disposable);
			icon.appendChild(i);
			icon.style.paddingRight = '8px';
		} else {
			icon.innerHTML = "<i class='icon icon-file-text'>";
		}
		li.appendChild(icon);

		const name = document.createElement('span');
		name.classList.add('right');
		const point = item.getRange().start;
		name.innerText = item.getUri() + ' (' + point.row.toString() + ':' + point.column.toString() + ')';

		file.appendChild(icon);
		file.appendChild(name);
		li.appendChild(file);

		return li;
	}

	preview(item): void {
		if (atom.config.get('cscope-atom.preview') && item) {
			const uri = path.join(this.cwd, item.getUri());
			const point = item.getRange().start;
			const position = new Position(uri, point);
			position.go(true);
		}
	}

	select(item): void {
		const uri = path.join(this.cwd, item.getUri());
		const point = item.getRange().start;
		const position = new Position(uri, point);
		if (this.resolve) {
			this.resolve(position);
			this.resolve = null;
			this.reject = null;
		}
		this.hide();
	}

	cancel(): void {
		if (this.reject) {
			this.reject();
			this.resolve = null;
			this.reject = null;
		}
		this.hide();
	}

	async show(cwd: string, results: QueryItem[]): Promise {
		return new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;

			this.selectList.reset();
			this.disposables.dispose();
			this.disposables = new CompositeDisposable();
			this.cwd = cwd;
			this.selectList.update({ items: results });

			this.prevElement = document.activeElement;
			if (atom.config.get('cscope-atom.preview')) {
				const pane = atom.workspace.getActivePane();
				this.preview = pane.splitUp({ copyActiveItem: false });
				this.preview.activate();
			}
			this.panel.show();
			this.selectList.focus();
		});
	}

	async hide(): void {
		this.panel.hide();
		if (this.preview) {
			this.preview.destroy();
			this.preview = null;
		}
		if (this.prevElement) {
			this.prevElement.focus();
			this.prevElement = null;
		}
	}
}
