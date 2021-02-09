'use babel';

import IStatusbar from '../interface/istatusbar';

export default class Statusbar extends IStatusbar {
	static instance: Statusbar;
	statusBar: StatusBarView;
	statusBarTile: statusBarTile;

	constructor() {
		if (!Statusbar.instance) {
			super();
			this.statusBar = null;
			this.statusBarTile = null;
			Statusbar.instance = this;
		}
		return Statusbar.instance;
	}

	static getInstance(): Statusbar {
		if (!Statusbar.instance) {
			Statusbar.instance = new Statusbar();
		}
		return Log.instance;
	}

	destroy(): void {
		if (this.statusBar && this.statusBarTile) {
			this.statusBarTile.destroy();
		}
	}

	set(statusBar: StatusBarView): void {
		this.statusBar = statusBar;
	}

	show(message: String): void {
		if (!this.statusBar) {
			return;
		}
		if (this.statusBarTile) {
			this.statusBarTile.destroy();
		}
		const span = document.createElement('span');
		span.innerText = message;
		this.statusBarTile = this.statusBar.addLeftTile({ item: span, priority: 100 });
	}

	hide(): void {
		if (this.statusBar && this.statusBarTile) {
			this.statusBarTile.destroy();
		}
	}
}
