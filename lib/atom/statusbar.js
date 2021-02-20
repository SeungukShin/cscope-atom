'use babel';

const IStatusbar = require('../interface/istatusbar');

module.exports = class Statusbar extends IStatusbar {
	/**
	 * @property {Statusbar} instance - static
	 * @property {StatusBarView} statusBar
	 * @property {statusBarTile} statusBarTile
	 */

	/**
	 * @constructor
	 * @returns {Statusbar}
	 */
	constructor() {
		if (!Statusbar.instance) {
			super();
			this.statusBar = null;
			this.statusBarTile = null;
			Statusbar.instance = this;
		}
		return Statusbar.instance;
	}

	/**
	 * @returns {Statusbar}
	 */
	static getInstance() {
		if (!Statusbar.instance) {
			Statusbar.instance = new Statusbar();
		}
		return Statusbar.instance;
	}

	/**
	 * @returns {void}
	 */
	destroy() {
		if (this.statusBar && this.statusBarTile) {
			this.statusBarTile.destroy();
		}
	}

	/**
	 * @param {StatusBarView} statusBar
	 * @returns {void}
	 */
	set(statusBar) {
		this.statusBar = statusBar;
	}

	/**
	 * @param {String} message
	 * @returns {void}
	 */
	show(message) {
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

	/**
	 * @returns {void}
	 */
	hide() {
		if (this.statusBar && this.statusBarTile) {
			this.statusBarTile.destroy();
		}
	}
}
