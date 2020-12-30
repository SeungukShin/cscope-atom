'use babel';

import * as cp from 'child_process';
import * as path from 'path';
import { CompositeDisposable, Disposable, File } from 'atom';
import Log from './log';
import Query from './query';
import QueryItem from './query-item';
import QueryView from './query-view';
import QueryInput from './query-input';

class CscopeAtom {
	subscriptions: CompositeDisposable;
	buildDisposable: Disposable;
	queryView: QueryView;
	queryInput: QueryInput;
	queryDir: String;
	queryWord: String;
	queryResults: QueryItem[];
	statusBar: StatusBarView;
	statusBarTile: Tile;
	statusBarTimer: NodeJS.Timer;

	activate() {
		this.subscriptions = new CompositeDisposable();
		this.queryView = new QueryView();
		this.queryInput = new QueryInput();

		// Auto build
		if (atom.config.get('cscope-atom.auto')) {
			const root = this.getCurrentDirectory();
			const db = path.join(root, atom.config.get('cscope-atom.database'));
			const file = new File(db);
			file.exists().then((value) => {
				if (!value) {
					this.build();
				}
			});
		}
		this.subscriptions.add(atom.config.observe('cscope-atom.auto', ((value) => {
			if (value) {
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
			"cscope-atom:pop": () => this.queryView.pop()
		}));

		Log.info('"cscope-atom" is now active!');
	}

	deactivate() {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
		}
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

	setBuild(): void {
		if (this.buildDisposable) {
			return;
		}
		this.buildDisposable = atom.project.onDidChangeFiles((events) => {
			const extensions = atom.config.get('cscope-atom.extensions').split(',');
			let needBuild = false;
			for (const event of events) {
				const ext = path.extname(event.path).substring(1).toLowerCase();
				if (extensions.includes(ext)) {
					needBuild = true;
				}
			}
			if (needBuild) {
				this.build();
			}
		});
	}

	clearBuild(): void {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
			this.buildDisposable = null;
		}
	}

	async build(): Promise {
		return new Promise((resolve, reject) => {
			if (this.statusBar) {
				if (this.statusBarTile) {
					this.statusBarTile.destroy();
				}
				const span = document.createElement('span');
				span.innerText = 'cscope-atom: building...';
				this.statusBarTile = this.statusBar.addLeftTile({ item: span });
			}

			// Build a build command
			const cmd = atom.config.get('cscope-atom.cscope');
			const arg = [
				atom.config.get('cscope-atom.buildArgs'),
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

				if (this.statusBar) {
					if (this.statusBarTile) {
						this.statusBarTile.destroy();
						this.statusBarTile = null;
					}
				}
			});
		});
	}

	async showResults() {
		this.queryView.show(this.queryDir, this.queryResults);
	}

	async query(type: String, input: Boolean) {
		this.queryDir = this.getCurrentDirectory();
		this.queryWord = this.getCurrentWord();
		if (input) {
			try {
				this.queryWord = await this.queryInput.show(this.queryWord);
			} catch(err) {
				return;
			}
		}

		if (this.statusBar) {
			if (this.statusBarTile) {
				this.statusBarTile.destroy();
			}
			const span = document.createElement('span');
			span.innerText = 'cscope-atom: querying...';
			this.statusBarTile = this.statusBar.addLeftTile({ item: span });
		}

		const query = new Query(this.queryDir, type, this.queryWord);
		await query.execute();
		await query.wait();
		this.queryResults = query.getResults();
		this.showResults();

		if (this.statusBar) {
			if (this.statusBarTile) {
				this.statusBarTile.destroy();
				this.statusBarTile = null;
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
