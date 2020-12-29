'use babel';

import { Range } from 'atom';

export default class QueryItem {
	uri: String;
	func: String;
	range: Range;
	rest: String;
	text: String;

	constructor(uri: String, func: String, range: Range, rest: String, text: String) {
		this.uri = uri;
		this.func = func;
		this.range = range;
		this.rest = rest;
		this.text = text;
	}

	getUri(): String {
		return this.uri;
	}

	getFunction(): String {
		return this.func;
	}

	getRange(): Range {
		return this.range;
	}

	getRest(): String {
		return this.rest;
	}

	getText(): String {
		return this.text;
	}
}
