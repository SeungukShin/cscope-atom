'use babel';

import { FilePosition } from './position';
import IEditor from './ieditor';

export default class IEnv {
	destroy(): void {
		throw new Error('not implemented');
	}

	getCurrentDirectory(): String {
		throw new Error('not implemented');
	}

	getCurrentWord(): String {
		throw new Error('not implemented');
	}

	getCurrentPosition(): FilePosition {
		throw new Error('not implemented');
	}

	async open(position: FilePosition, preview: Boolean): Promise<IEditor> {
		throw new Error('not implemented:', position, preview);
	}

	async getInput(value: String): Promise<String> {
		throw new Error('not implemented:', value);
	}

	observeFiles(extensions: String, callback: Function): Object {
		throw new Error('not implemented:', extensions, callback);
	}
}
