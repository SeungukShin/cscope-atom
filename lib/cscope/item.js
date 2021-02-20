'use babel';

export default class Item {
	file: String;
	func: String;
	line: Number;
	text: String;
	raw: String;

	constructor(line: String) {
		const tokens = line.match(/([^ ]*) +([^ ]*) +([^ ]*) (.*)/);
		if (tokens == null || tokens.length < 5) {
			throw new Error('wrong format');
		}
		this.file = tokens[1];
		this.func = tokens[2];
		this.line = parseInt(tokens[3]) - 1;
		this.text = tokens[4];
		this.raw = line;
	}

	getFile(): String {
		return this.file;
	}

	getFunction(): String {
		return this.func;
	}

	getLine(): Number {
		return this.line;
	}

	getText(): String {
		return this.text;
	}

	getRaw(): String {
		return this.raw;
	}
}
