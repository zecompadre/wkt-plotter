// js/classes/WKTUtilities.js
import { lfkey } from '../utils/constants.js';
import { map } from '../map/setupMap.js';
import { utilities } from '../utils/utilities.js';

class WKTUtilities {
	constructor() {
		this.wkts = [];
	}

	clear(fromMap = true, fromStorage = true) {
		if (fromStorage) {
			localStorage.removeItem(lfkey);
			console.log("WKTs removidos do localStorage");
		}
		if (fromMap) {
			map.set("wkts", []);
		}
		this.wkts = [];
	}

	load() {
		const persistent = window.settingsManager?.getSettingById('wkt-presistent') === true;

		if (persistent) {
			try {
				const stored = localStorage.getItem(lfkey);
				this.wkts = stored ? JSON.parse(stored) : [];
			} catch (e) {
				console.error("Erro ao carregar localStorage:", e);
				this.wkts = [];
			}
		} else {
			this.wkts = [];
		}

		map.set("wkts", this.wkts);
		console.log(`Carregados ${this.wkts.length} WKT(s)`);
	}

	save() {
		const persistent = window.settingsManager?.getSettingById('wkt-presistent') === true;
		if (persistent) {
			localStorage.setItem(lfkey, JSON.stringify(this.wkts));
		}
		map.set("wkts", this.wkts);
	}

	remove(id) {
		this.wkts = this.wkts.filter(item => item.id !== id);
		this.save();
		console.log(`Removido WKT: ${id}`);
	}

	async add(feature) {
		if (!feature) return;

		try {
			const wkt = utilities.getFeatureWKT(feature);
			if (!wkt) throw new Error("WKT inválido");

			const checksum = await utilities.generateChecksum(wkt);

			if (!this.wkts.some(item => item.id === checksum)) {
				this.wkts.push({ id: checksum, wkt });
				feature.setId(checksum);
				this.save();
				console.log("WKT adicionado:", checksum);
			}
		} catch (err) {
			console.error("Erro ao adicionar WKT:", err);
		}
	}

	get() {
		return this.wkts;
	}

	update(id, wkt) {
		const item = this.wkts.find(i => i.id === id);
		if (item) {
			item.wkt = wkt;
			this.save();
			console.log("WKT atualizado:", id);
		} else {
			console.warn("WKT não encontrado:", id);
		}
	}
}

const wktUtilities = new WKTUtilities();
export default wktUtilities;