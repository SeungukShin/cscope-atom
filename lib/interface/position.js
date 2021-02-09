'use babel';

export class Position {
	line: Number;
	column: Number;

	constructor(line: Number, column: Number) {
		this.line = line;
		this.column = column;
	}

	getLine(): Number {
		return this.line;
	}

	getColumn(): Number {
		return this.column;
	}
}

export class FilePosition extends Position {
	file: String;

	constructor(file: String, line: Number, column: Number) {
		super(line, column);
		this.file = file;
	}

	getFile(): String {
		return this.file;
	}
}
