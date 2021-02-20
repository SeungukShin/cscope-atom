'use babel';

const fs = require('fs');
const path = require('path');
const { CompositeDisposable } = require('atom');
const History = require('./interface/history');
const { FilePosition } = require('./interface/position');
const Config = require('./atom/config');
const Log = require('./atom/log');
const Statusbar = require('./atom/statusbar');
const Env = require('./atom/env');
const { FileSelectListItem, FileSelectList } = require('./atom/file-select-list');
const Cscope = require('./cscope/cscope');
const Item = require('./cscope/item');

class CscopeAtom {
	/**
	 * @property {CompositeDisposable} subscriptions
	 * @property {Disposable} buildDisposable
	 * @property {IConfig} config
	 * @property {ILog} log
	 * @property {IEnv} env
	 * @property {IStatusbar} statusbar
	 * @property {History} history
	 * @property {Cscope} cscope
	 * @property {Function} addIconToElement
	 * @property {String} prevWord
	 * @property {String} prevCwd
	 * @property {IFileSelectListItem[]} prevResults
	 */

	/**
	 * @returns {void}
	 */
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
			this.setBuild();
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

	/**
	 * @returns {void}
	 */
	deactivate() {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
			this.buildDisposable = null;
		}
		this.subscriptions.dispose();
		this.statusbar.destroy();
		this.env.destroy();

		this.log.info('"cscope-atom" is now inactive!');
	}

	/**
	 * @returns {void}
	 */
	setBuild() {
		if (this.buildDisposable) {
			return;
		}
		this.buildDisposable = this.env.observeFiles(this.config.get('extensions'), this.build.bind(this));
	}

	/**
	 * @returns {void}
	 */
	clearBuild() {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
			this.buildDisposable = null;
		}
	}

	/**
	 * @returns {Promise<void>}
	 */
	async build() {
		this.statusbar.show('cscope-atom: building...');
		try {
			this.cscope.build(this.env.getCurrentDirectory());
		} catch (err) {
			this.log.err(err);
		}
		this.statusbar.hide();
	}

	/**
	 * @param {String} type
	 * @param {String} word
	 * @param {String} cwd
	 * @returns {Promise<Item[]>}
	 */
	async __query(type, word, cwd) {
		this.statusbar.show('cscope-atom: querying...');
		let results = null;
		try {
			results = await this.cscope.query(type, word, cwd);
		} catch (err) {
			this.log.err(err);
		}
		this.statusbar.hide();
		return results;
	}

	/**
	 * @param {IFileSelectListItem[]} items
	 * @param {String} word
	 * @param {String} cwd
	 * @returns {Promise<IFileSelectListItem>}
	 */
	async __showList(items, word, cwd) {
		let item = null;
		const selectList = new FileSelectList(items, word, cwd, true, this.addIconToElement);
		try {
			item = await selectList.show();
		} catch (err) {
			this.log.err(err);
		}
		selectList.destroy();
		return item;
	}

	/**
	 * @param {String} type
	 * @param {Boolean} input
	 * @returns {Promise<void>}
	 */
	async query(type, input) {
		const cwd = this.env.getCurrentDirectory();
		let word = this.env.getCurrentWord();
		if (input) {
			try {
				word = await this.env.getInput(word);
			} catch (err) {
				this.log.err(err);
				return;
			}
		}
		const results = await this.__query(type, word, cwd);
		const items = [];
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

	/**
	 * @returns {Promise<void>}
	 */
	async showResults() {
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

	/**
	 * @returns {Promise<FilePosition>}
	 */
	async pop() {
		const position = this.history.pop();
		if (position) {
			this.env.open(position, false);
		}
		return position;
	}

	/**
	 * @param {StatusBarView} statusBar
	 * @returns {void}
	 */
	consumeStatusBar(statusBar) {
		this.statusbar.set(statusBar);
	}

	/**
	 * @param {Function} func
	 * @returns {void}
	 */
	consumeElementIcons(func) {
		this.addIconToElement = func;
	}
}

const cscopeAtom = new CscopeAtom();
module.exports = cscopeAtom;
