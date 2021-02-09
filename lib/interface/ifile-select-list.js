'use babel';

export class IFileSelectListItem {
	getFile(): String {
		throw new Error('not implemented');
	}

	getLine(): Number {
		throw new Error('not implemented');
	}

	getColumn(): Number {
		throw new Error('not implemented');
	}

	getLabel(): String {
		throw new Error('not implemented');
	}

	getDetail(): String {
		throw new Error('not implemented');
	}

	setFile(file: String): void {
		throw new Error('not implemented:', file);
	}

	setLine(line: Number): void {
		throw new Error('not implemented:', line);
	}

	setColumn(column: Number): void {
		throw new Error('not implemented:', column);
	}

	setLabel(label: String): void {
		throw new Error('not implemented:', label);
	}

	setDetail(detail: String): void {
		throw new Error('not implemented:', detail);
	}
}

export class IFileSelectList {
	destroy(): void {
		throw new Error('not implemented');
	}

	update(items: IFileSelectListItem[], word: String, cwd: String): void {
		throw new Error('not implemented:', items, word, cwd);
	}

	async show(): Promise<IFileSelectListItem> {
		throw new Error('not implemented');
	}

	hide(): void {
		throw new Error('not implemented');
	}
}
