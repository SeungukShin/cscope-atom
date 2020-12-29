'use babel';

import * as cp from 'child_process';
import * as path from 'path';
import { CompositeDisposable } from 'atom';
import Log from './log';
import Query from './query';
import QueryItem from './query-item';
import QueryView from './query-view';

class CscopeAtom {
	subscriptions: CompositeDisposable;
	queryView: QueryView;
	queryDir: String;
	queryWord: String;
	queryResults: QueryItem[];
	statusBar: StatusBarView;
	statusBarTile: Tile;
	statusBarTimer: NodeJS.Timer;

	activate() {
		this.subscriptions = new CompositeDisposable();
		this.queryView = new QueryView();

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
			"cscope-atom:pop": () => this.queryView.pop()
		}));

		Log.info('"cscope-atom" is now active!');
	}

	deactivate() {
		this.subscriptions.dispose();
		this.queryView.destroy();

		Log.info('"cscope-atom" is now inactive!');
	}

	getCurrentDirectory(): String {
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

	getCurrentWord(): String {
		const editor = atom.workspace.getActiveTextEditor();
		if (!editor) {
			return '';
		}
		return editor.getWordUnderCursor();
	}

	async build(): Promise {
		return new Promise((resolve, reject) => {
			// Build a build command
			const cmd = atom.config.get('cscope-atom.cscope');
			const arg = [
				atom.config.get('cscope-atom.queryArgs'),
				'-f',
				atom.config.get('cscope-atom.database')
			];
			Log.info(cmd, arg);

			// Execute a build
			const proc = cp.spawn(cmd, arg, { cwd: this.getCurrentDirectory() });
			proc.stderr.on('data', (data) => {
				Log.err(data);
			});
			proc.on('error', (err) => {
				Log.err(err);
				reject();
			});
			proc.on('exit', (code, signal) => {
				resolve(this);
			});
		});
	}

	async showResults() {
		this.queryView.show(this.queryDir, this.queryResults);
	}

	async query(type: String, input: Boolean) {
		if (this.statusBar) {
			if (this.statusBarTile) {
				this.statusBarTile.destroy();
			}
			const span = document.createElement('span');
			span.innerText = 'cscope-atom: querying...';
			this.statusBarTile = this.statusBar.addLeftTile({ item: span });
		}

		this.queryDir = this.getCurrentDirectory();
		this.queryWord = this.getCurrentWord();
		const query = new Query(this.queryDir, type, this.queryWord);
		await query.execute();
		await query.wait();
		this.queryResults = query.getResults();
		this.showResults();

		if (this.statusBar) {
			if (this.statusBarTile) {
				this.statusBarTile.destroy();
			}
		}
	}

	consumeStatusBar(statusBar: StatusBarView): void {
		this.statusBar = statusBar;
	}

	consumeElementIcons(func: Function): void {
		this.queryView.addIconToElement = func;
	}
}

const cscopeAtom = new CscopeAtom();
export default cscopeAtom;
