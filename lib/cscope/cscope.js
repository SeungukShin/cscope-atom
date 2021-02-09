'use babel';

import * as cp from 'child_process';
import * as rl from 'readline';
import ILog from '../interface/ilog';
import IConfig from '../interface/iconfig';
import IEnv from '../interface/ienv';
import Item from './item';

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

export default class Cscope {
	config: IConfig;
	log: ILog;
	env: IEnv;

	constructor(config: IConfig, log: ILog, env: IEnv) {
		this.config = config;
		this.log = log;
		this.env = env;
	}

	build(cwd: String): Promise<String> {
		return new Promise((resolve, reject) => {
			const cmd = this.config.get('cscope');
			const db = this.config.get('database');
			const buildArgs = this.config.get('buildArgs');
			const args = [buildArgs, '-f', db];
			this.log.info(cmd, args, cwd);

			let out = '';
			let err = '';
			const proc = cp.spawn(cmd, args, { cwd: cwd });
			proc.stdout.on('data', (data) => {
				out = out.concat(data.toString());
			});
			proc.stderr.on('data', (data) => {
				err = err.concat(data.toString());
			});
			proc.on('error', (error) => {
				this.log.err('error:', error);
				reject(error.toString().trim());
			});
			proc.on('close', (code) => {
				if (err.length > 0) {
					this.log.err(`stderr: ${code}\n${err}`);
				}
				this.log.info(`stdout: ${code}\n${out}`);
				if (code != 0) {
					reject(err.trim());
				} else {
					resolve(out.trim());
				}
			});
		});
	}

	async query(type: String, word: String, cwd: String): Promise<Item[]> {
		return new Promise((resolve, reject) => {
			const cmd = this.config.get('cscope');
			const db = this.config.get('database');
			const queryArgs = this.config.get('queryArgs');
			const args = [queryArgs, '-f', db, QueryType[type], word];
			this.log.info(cmd, args, cwd);

			let results: Item[] = [];
			let out = '';
			let err = '';
			const proc = cp.spawn(cmd, args, { cwd: cwd });
			const rline = rl.createInterface({ input: proc.stdout, terminal: false });
			rline.on('line', (line) => {
				try {
					results.push(new Item(line));
				} catch(err) {
					this.log.err(err);
					this.log.err('cannot parse:', line);
				}
				out = out.concat(line);
			});
			proc.stdout.on('data', (data) => {
				out = out.concat(data.toString());
			});
			proc.on('error', (error) => {
				this.log.err('error:', error);
				reject(error.toString().trim());
			});
			proc.on('close', (code) => {
				if (err.length > 0) {
					this.log.err(`stderr: ${code}\n${err}`);
				}
				this.log.info(`stdout: ${code}\n${out}`);
				if (code != 0) {
					reject(err.trim());
				} else {
					this.log.info('results:', results);
					resolve(results);
				}
			});
		});
	}
}
