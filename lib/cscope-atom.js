'use babel';

import * as fs from 'fs';
import * as path from 'path';
import { CompositeDisposable, Disposable } from 'atom';
import IConfig from './interface/iconfig';
import ILog from './interface/ilog';
import IStatusbar from './interface/istatusbar';
import IEnv from './interface/ienv';
import { IFileSelectListItem } from './interface/ifile-select-list';
import History from './interface/history';
import { FilePosition } from './interface/position';
import Config from './atom/config';
import Log from './atom/log';
import Statusbar from './atom/statusbar';
import Env from './atom/env';
import { FileSelectListItem, FileSelectList } from './atom/file-select-list';
import Cscope from './cscope/cscope';
import Item from './cscope/item';

class CscopeAtom {
	subscriptions: CompositeDisposable;
	buildDisposable: Disposable;
	config: IConfig;
	log: ILog;
	env: IEnv;
	statusbar: IStatusbar;
	history: History;
	cscope: Cscope;
	addIconToElement: Function;
	prevWord: String;
	prevCwd: String;
	prevResults: IFileSelectListItem[];

	activate() {
		this.subscriptions = new CompositeDisposable();
		this.buildDisposable = null;
		this.config = new Config('cscope-atom');
		this.log = new Log(this.config);
		this.env = new Env();
		this.statusbar = new Statusbar();
		this.history = new History(this.log);
		this.cscope = new Cscope(this.config, this.log, this.env);
		this.addIconToElement = null;
		this.prevWord = null;
		this.prevCwd = null;
		this.prevResults = null;

		// Auto build
		if (this.config.get('auto')) {
			const root = this.env.getCurrentDirectory();
			const db = path.join(root, this.config.get('database'));
			fs.access(db, fs.constants.F_OK, (err) => {
				if (err) {
					this.build();
				}
			});
		}
		this.subscriptions.add(this.config.observe('auto', (() => {
			if (this.config.get('auto')) {
				this.setBuild();
			} else {
				this.clearBuild();
			}
		})));

		// Register commands
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			"cscope-atom:build": () => this.build(),
			"cscope-atom:symbol": () => this.query('symbol', false),
			"cscope-atom:symbol-input": () => this.query('symbol', true),
			"cscope-atom:definition": () => this.query('definition', false),
			"cscope-atom:definition-input": () => this.query('definition', true),
			"cscope-atom:callee": () => this.query('callee', false),
			"cscope-atom:callee-input": () => this.query('callee', true),
			"cscope-atom:caller": () => this.query('caller', false),
			"cscope-atom:caller-input": () => this.query('caller', true),
			"cscope-atom:text": () => this.query('text', false),
			"cscope-atom:text-input": () => this.query('text', true),
			"cscope-atom:egrep": () => this.query('egrep', false),
			"cscope-atom:egrep-input": () => this.query('egrep', true),
			"cscope-atom:file": () => this.query('file', false),
			"cscope-atom:file-input": () => this.query('file', true),
			"cscope-atom:include": () => this.query('include', false),
			"cscope-atom:include-input": () => this.query('include', true),
			"cscope-atom:set": () => this.query('set', false),
			"cscope-atom:set-input": () => this.query('set', true),
			"cscope-atom:show-results": () => this.showResults(),
			"cscope-atom:pop": () => this.pop()
		}));

		this.log.info('"cscope-atom" is now active!');
	}

	deactivate() {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
		}
		this.subscriptions.dispose();
		this.statusbar.destroy();
		this.env.destroy();

		this.log.info('"cscope-atom" is now inactive!');
	}

	setBuild(): void {
		if (this.buildDisposable) {
			return;
		}
		this.buildDisposable = this.env.observeFiles(this.config.get('extensions'), this.build.bind(this));
	}

	clearBuild(): void {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
			this.buildDisposable = null;
		}
	}

	async build(): Promise {
		this.statusbar.show('cscope-atom: building...');
		try {
			this.cscope.build(this.env.getCurrentDirectory());
		} catch(err) {
			this.log.err(err);
		}
		this.statusbar.hide();
	}

	async __query(type: String, word: String, cwd: String): Promise<Item[]> {
		this.statusbar.show('cscope-atom: querying...');
		let results: Item[] = [];
		try {
			results = await this.cscope.query(type, word, cwd);
		} catch(err) {
			this.log.err(err);
		}
		this.statusbar.hide();
		return results;
	}

	async __showList(items: IFileSelectListItem[], word: String, cwd: String): Promise<IFileSelectListItem> {
		let item: IFileSelectListItem = null;
		const selectList = new FileSelectList(items, word, cwd, true, this.addIconToElement);
		try {
			item = await selectList.show();
		} catch(err) {
			this.log.err(err);
		}
		selectList.destroy();
		return item;
	}

	async query(type: String, input: Boolean): Promise<void> {
		const cwd = this.env.getCurrentDirectory();
		let word = this.env.getCurrentWord();
		if (input) {
			try {
				word = await this.env.getInput(word);
			} catch(err) {
				this.log.err(err);
				return;
			}
		}
		const results = await this.__query(type, word, cwd);
		const items: IFileSelectListItem[] = [];
		for (const item of results) {
			const litem = new FileSelectListItem(item.getFile(), item.getLine(), null, item.getFunction(), item.getText());
			items.push(litem);
		}
		this.prevWord = word;
		this.prevCwd = cwd;
		this.prevResults = items;
		const position = this.env.getCurrentPosition();
		const item = await this.__showList(items, word, cwd);
		if (!item) {
			return;
		}
		if (position) {
			this.history.push(position);
		}
	}

	async showResults(): Promise<void> {
		if (!this.prevResults) {
			return;
		}
		const position = this.env.getCurrentPosition();
		const item = await this.__showList(this.prevResults, this.prevWord, this.prevCwd);
		if (!item) {
			return;
		}
		if (position) {
			this.history.push(position);
		}
	}

	async pop(): Promise<FilePosition> {
		const position = this.history.pop();
		if (position) {
			this.env.open(position, false);
		}
		return position;
	}

	consumeStatusBar(statusBar: StatusBarView): void {
		this.statusbar.set(statusBar);
	}

	consumeElementIcons(func: Function): void {
		this.addIconToElement = func;
	}
}

const cscopeAtom = new CscopeAtom();
export default cscopeAtom;
