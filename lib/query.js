'use babel';

import * as cp from 'child_process';
import * as rl from 'readline';
import * as path from 'path';
import { TextBuffer, Range } from 'atom';
import Log from './log';
import QueryItem from './query-item';

const QueryType = Object.freeze({
	'symbol': '-0',
	'definition': '-1',
	'callee': '-2',
	'caller': '-3',
	'text': '-4',
	'egrep': '-5',
	'file': '-6',
	'include': '-7',
	'set': '-8'
});

export default class Query {
	cwd: String;
	word: String;
	type: String;
	results: QueryItem[];
	promises: Promise[];

	constructor(cwd: String, type: String, word: String) {
		this.cwd = cwd;
		this.type = type;
		this.word = word;
		this.results = [];
		this.promises = [];
	}

	getResults(): QueryItem[] {
		return this.results;
	}

	getFullPath(file: String): String {
		if (path.isAbsolute(file)) {
			return file;
		}
		return path.join(this.cwd, file);
	}

	async parse(line: String): Promise {
		return new Promise((resolve, reject) => {
			const tokens = line.match(/([^ ]*) +([^ ]*) +([^ ]*) (.*)/);
			if (tokens == null || tokens.length < 5) {
				reject();
			}
			const uri = tokens[1];
			const file = this.getFullPath(tokens[1]);
			const func = tokens[2];
			const lnum = parseInt(tokens[3]) - 1;
			const rest = tokens[4];
			let text = '';
			let cnum = 0;
			let length = 0;

			TextBuffer.load(file).then((buffer) => {
				text = buffer.lineForRow(lnum);
				if (this.type === 'callee') {
					cnum = text.indexOf(func);
					length = func.length;
				} else {
					cnum = text.indexOf(this.word);
					length = this.word.length;
				}
				if (cnum == -1) {
					cnum = 0;
					length = 0;
				}
				const range = new Range([lnum, cnum], [lnum, cnum + length]);
				const item = new QueryItem(uri, func, range, rest, text);
				this.results.push(item);
				resolve();
			}, (e) => {
				Log.err('Could not open "', file, '".');
				Log.err(e);
				reject();
			});
		});
	}

	async execute(): Promise {
		return new Promise((resolve, reject) => {
			// Build a query command
			const cmd = atom.config.get('cscope-atom.cscope');
			const arg = [
				atom.config.get('cscope-atom.queryArgs'),
				'-f',
				atom.config.get('cscope-atom.database'),
				QueryType[this.type],
				this.word
			];
			Log.info(cmd, arg);

			// Execute a query
			const proc = cp.spawn(cmd, arg, { cwd: this.cwd });
			const rline = rl.createInterface({ input: proc.stdout, terminal: false });
			rline.on('line', (line) => {
				this.promises.push(this.parse(line));
			});
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

	async wait(): Promise {
		await Promise.all(this.promises);
		this.prmises = [];
	}
}
