import {global} from '../App.js';
import data from './loc.json';
import * as styles from '../styles/index.js';

export function deepClone(li){ //turns class objects into regular objects
	return JSON.parse(JSON.stringify(li));
}
export function objClone(obj){ //turns arrays into objects. Conserves class objects
	return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

export function triangle(n){ //https://en.wikipedia.org/wiki/Triangular_number
	return n*(n+1)/2;
}

export const jsonEqual = (prevProps, nextProps) => JSON.stringify(prevProps) === JSON.stringify(nextProps);

export function loc(key){
	if(data[key]){
		return data[key];
	}
	console.log("Error. Loc string", key, "not found");
	return undefined;
}

export function random(from, to, round, bias){
	round = (round === undefined || round ? true : false)
	bias = Math.pow(Math.random(), bias||0);
	if(round){
		return Math.floor((Math.random()*(to-from+1)*bias +from));
	}
	else{
		return (Math.random()*(to-from)*bias +from)
	}
}

export function randBias(min, max, N, D) { //https://stackoverflow.com/questions/29325069/how-to-generate-random-numbers-biased-towards-one-value-in-a-range
	D = (D || 1)
	var a = 1,
		b = 50;

	var influence = Math.floor(Math.random() * (101)),
	x = Math.floor(Math.random() * (max - min + 1)) + min;

	return x > N 
		? x + Math.floor(gauss(influence) * (N - x)) 
		: x - Math.floor(gauss(influence) * (x - N));

	function gauss(x) {
		return a * Math.exp(-(x - b) * (x - b) / (2 * D * D));
	}
}

export function round(v, p) {
	var mul = Math.pow(10, p || 0);
	return Math.round(v * mul) / mul;
}
export function floor(v, p) {
	var mul = Math.pow(10, p || 0);
	return Math.floor(v * mul) / mul;
}
export function ceil(v, p) {
	var mul = Math.pow(10, p || 0);
	return Math.ceil(v * mul) / mul;
}

export function ToString(obj, test) {
	test = (test || false);
	return JSON.stringify(obj);
}

export function ts(item){
	return JSON.stringify(item);
}

export function updateEffects(specific=false){
	let stats = global["statList"];
	let statsInfo = global["statsInfo"];
	//const statTemplate = global["statTemplate"];
	//let resources = global["resources"];

	const shop = global["shop"];
	const energizer = global["energizer"];
	const garden = global["garden"];
	const dungeon = global["dungeon"];
	const stars = global["stars"];
	if(!specific || specific === "shop"){
		shop.unlocked = true;
		stats.clear("shop");
		if(shop.unlocked){
			for(const [index, entry] of Object.entries(global["shop"]["upgrades"])){
				stats.set("shop", index, entry["stats"], {set:true}, {mult:entry["bought"]});
			}
		}
	}
	if(!specific || specific === "energizer"){
		for(const [, entry] of Object.entries(energizer["allModules"])){
			entry.visible = entry.visible || global["debug"]["energizerAllUnlocked"] || entry.visibleCondition();
			entry.unlocked = entry.unlocked || global["debug"]["energizerAllUnlocked"] || entry.unlockCondition();
		}
		energizer.update(); //handles module count tracking and module stats
	}
	if(!specific || specific === "garden"){
		const screen = 0;
		statsInfo.clear(`garden-${screen}`);
		stats.clear(`garden-${screen}`); //todo: clear stats if garden becomes locked.
		if(garden["unlocked"]){
			//for(const [, entry] of Object.entries(garden["screens"][0].gridSort())){ //set adjustable stat values for tiles.
				//entry["tempStats"] = {}; //stats added by temporary effects like surrounding plant auras
				//entry["combinedStats"] = {}; //tempstats, permstats and plant stats combined together.
				//entry["realStats"] = {}; //combined stats converted into single values. (addTickPower:1 + addExtraTickPower:2 = tickPower:3)
				//permStats are stats added permanently by surrounding plant perm auras. They are not reset here
				//if(!entry["permAuraEffects"]){
				//	entry["permAuraEffects"] = {};
				//}
				//for(const [, entry2] of Object.entries(global.values.effects)){
					//if(!entry["permAuraEffects"][entry2]){ //add perm stats if they do not exist.
						//entry["permAuraEffects"][entry2] = {};
					//}
				//}
			//}
			/*
			;Tile stat rules:
			;tiles can get stats from plants on them, as well as temporary effects from surrounding plants or permanent effect from perm aura plants.
			;plant stats are stored in tile.plant.stats, temporary stats are stored in tile.tempStats and permanent stats are stored in tile.permStats
			;these stats are then combined into tile.combinedStats and converted into actual stat values in tile.realStats
			;stats are constructed from a modifier value first
			;afterwards comes the stat name, followed by an amount. Stats with a capital P at the end are considered percentage.
			;add = effects that apply globally as long as the plant exists
			;mult = effects that apply globally as long as the plant exists (percentage, 1=100%)
			;harvest = effects that apply only when the plant is harvested, usually gaining resources
			;aura = effects that are applied to the surrounding 8 tiles as temp stats
			;permAura = effects that are slowly permanently applied to the surrounding 8 tiles as perm stats
			;xExtra (x can be any of the previous values) = stats that are added to the original x value, but only if said stat exists on the plant
			;xMult (x can be any of the previous values) = stats that are multiplied to the original x value, but only if said stat exists on the plant
			;add/clickPower/1 = power per click +1
			;addExtra/clickPower/1 = existing add/clickPower value of this plant +1
			;addMult/clickPower/1 = existing add/clickPower value of this plant +100%
			;add/clickPowerP/1 = power per click +100%
			;addExtra/clickPowerP/1 = existing add/clickPowerP value of this plant +1
			;addMult/clickPowerP/1 = existing add/clickPowerP value of this plant +100%
			;harvest/power/1 = +1 power when plant is Harvested
			;add/harvestPower/1 = +1 to the harvest/power value of all plants that have it.
			;harvestExtra/power/1 = existing harvest/power value of this plant +1
			;harvestMult/power/1 = existing harvest/power value of this plant +100%
			;addExtra/harvestPower/1 = existing add/harvestPower value of this plant +1
			;addMult/harvestPower/1 = existing add/harvestPower value of this plant +100%
			;add/harvestPowerP/1 = +100% to the harvest/power value of all plants that have it.
			;addExtra/harvestPowerP/1 = existing add/harvestPowerP value of this plant +1
			;addMult/harvestPowerP/1 = existing add/harvestPowerP value of this plant +100%

			;aura/add/clickPower/1 = add/clickPower of the surrounding plants + 1
			;permAura/addExtra/clickPower/1 = slowly raises the addExtra/clickPower tempstat of the surrounding tiles up to +1
			;aura/aura/add/clickPower/1 < auras can NOT boost auras or permAuras. It would be scary if it did.
			
			;stats are condensed into an object called realstats
			;tile["realstats"]
			;addclickPower = add/clickPower + addExtra/clickPower * addMult/clickPower
			;addharvestPower = add/harvestPower + addExtra/harvestPower * addMult/harvestPower
			;harvestpower = harvest/power + harvestExtra/power * harvestMult/power
			;auraaddclickPower = aura/add/clickPower + auraExtra/add/clickPower * auraMult/add/clickPower
			
			;plant["stats"] = the base stats on a plant, unaffected by other sources
			;plant["stats"]["aura"] = these stats are applied as tempStats to up to 8 tiles surrounding this one
			;plant["stats"]["permAura"] = these stats are slowly permanently applied to up to 8 tiles surrounding this one.
			;^ effects stay if the plant is moved or harvested, tile stats can't go above the permAura values, a plant with a stronger permAura can improve stats further and add new ones.
			;^ plants placed on an affected tile have the tile's stats added as tempStats
			;tile["tempStats"] = temporary stats added by surrounding aura plants
			;tile["permStats"] = permanent stats added by surrounding perm aura plants
			;tile["realStats"] = stats, tempstats, and permstats combined into one, with x, xExtra and xMult combined into one stat.

			;stats start lower than usual but scale linearly as growth increases. Stats are halved below 50% growth.
			;growth modifier can be seen with plant.growMult()
			*/
			const Gscreen = garden["screens"][screen];
			for(const [index, entry] of Object.entries(Gscreen["grid"])){ //index = id of garden tile (0/1/2/3/etc), entry = each garden tile in garden
				//const coords = garden["screens"][screen].gridToCoords({X:entry["X"], Y:entry["Y"]});
				if(entry["plant"] && entry["plant"]["stats"]["aura"]){
					statsInfo.set(`garden-${screen}`, `aura-${index}`, entry["plant"]["stats"]["aura"], {add:true}, {mult:entry["plant"].growMult()});
					let tileCoords = Gscreen.coordsToGrid(index);
					let tiles = Gscreen.square(tileCoords.X-1, tileCoords.X+1, tileCoords.Y-1, tileCoords.Y+1);
					for(const [, entry2] of Object.entries(tiles)){ //ondex2 = index of each surrounding tile (0/1/2/3/etc), entry2 = each garden tile surrounding a garden tile that has an aura
						const coords2 = garden["screens"][screen].gridToCoords({X:entry2["X"], Y:entry2["Y"]});
						statsInfo.set(`garden-${screen}`, `auraEffects-${coords2}`, entry["plant"]["stats"]["aura"], {add:true}, {mult:entry["plant"].growMult()});
					}
				}
			}
			for(const [index, entry] of Object.entries(Gscreen["grid"])){ //entry = each garden tile in garden
				//const coords = garden["screens"][screen].gridToCoords({X:entry["X"], Y:entry["Y"]});
				//entry["auraEffects"] = statsInfo.get(`garden-${screen}`, `${coords}`);
				//entry["auraStats"] = statsInfo.get(`garden-${screen}`, `aura-${coords}`);
				entry["effects"] = {
					aura:statsInfo.get(`garden-${screen}`, `aura-${index}`),
					permAura:statsInfo.get(`garden-${screen}`, `permAura-${index}`),
					auraEffects:statsInfo.get(`garden-${screen}`, `auraEffects-${index}`),
					permAuraEffects:statsInfo.get(`garden-${screen}`, `permAuraEffects-${index}`)
				}
				if(entry["plant"]){ //calculate plant stats and add them to statlist;
					statsInfo.set(`garden-${screen}`, `main-${index}`, entry["plant"]["stats"], {set:true}, {mult:entry["plant"].growMult()});
					//statsInfo.set(`garden-${screen}`, `harvest-${coords}`, entry["plant"]["stats"]["harvest"], {set:true}, {mult:entry["plant"].growMult()});
					let auraVal = entry["effects"]["auraEffects"];
					let permAuraVal = entry["effects"]["permAuraEffects"];
					statsInfo.set(`garden-${screen}`, `total-${index}`, statsInfo.get(`garden-${screen}`, `main-${index}`));
					statsInfo.set(`garden-${screen}`, `total-${index}`, auraVal, {mult:true}, {add:1});
					statsInfo.set(`garden-${screen}`, `total-${index}`, permAuraVal, {mult:true}, {add:1});
					
					/*auraVal = entry["effects"]["auraEffects"]["harvest"];
					permAuraVal = entry["effects"]["permAuraEffects"]["harvest"];
					statsInfo.set(`garden-${screen}`, `total-harvest-${coords}`, statsInfo.get(`garden-${screen}`, `harvest-${coords}`));
					statsInfo.set(`garden-${screen}`, `total-harvest-${coords}`, auraVal, {mult:true});
					statsInfo.set(`garden-${screen}`, `total-harvest-${coords}`, permAuraVal, {mult:true});*/
				}
				entry["effects"] = {...entry["effects"], 
					mainBase:statsInfo.get(`garden-${screen}`, `main-${index}`),
					main:statsInfo.get(`garden-${screen}`, `total-${index}`)
					/*harvestBase:statsInfo.get(`garden-${screen}`, `harvest-${coords}`),*/
					/*harvest:statsInfo.get(`garden-${screen}`, `total-harvest-${coords}`),*/
				}
				if(entry["unlocked"]){
					stats.set(`garden-${screen}`, index, {main:entry["effects"]["main"]});
				}
			}
		}
	}
	if(!specific || specific === "dungeon"){
		stats.clear("dungeon");
		if(dungeon["unlocked"]){
			const equipment = dungeon["inCombat"] ? dungeon["inCombat"]["player"]["equipment"] : dungeon["player"]["equipment"];
			for(const [index, entry] of Object.entries(equipment)){
				if(entry){
					entry["realStats"] = {}; //combined stats converted into single values. (addTickPower:1 + addExtraTickPower:2 = tickPower:3)
				}
				if(entry && dungeon["equipSlotTypes"][index]["type"]){ //ignore empty slots and weapons
					/*let combinedStats = Array.prototype.concat(...["", ...global.values.effectExtra].map((indexA, entryA) => {
						let test = entry2[`${entry3}${indexA}`] ? Object.entries(entry2[`${entry3}${indexA}`]).map(([index, entry]) => 
							index
						) : ""
						return test;
					}));*/
					//this["totalStats"]["damage"]["base"]
					stats.set("dungeon", index, entry["totalStats"]);
				}
			}
		}
	}
	if(!specific || specific === "stars"){
		stats.clear("stars");
		if(stars["unlocked"]){
			for(const [index, entry] of Object.entries(global["stars"]["upgrades"])){
				for(const [index2, entry2] of Object.entries(entry)){
				stats.set("stars", `${index}-${index2}`, entry2["stats"], {set:true}, {mult:entry2["bought"]});
				/*for(const [index2, entry2] of Object.entries(entry["stats"])){ //entry2 = {add: { tickPower: 1 }}
					for(const [index3, entry3] of Object.entries(entry2)){
						if(index2 === "add"){
							effects["shop"][index3]["add"] += entry3 * entry["bought"];
						}
						else if(index2 === "mult"){
							effects["shop"][index3]["mult"] += entry3 * entry["bought"];
						}
					}
				}*/
				}
			}
		}
		/*if(stars["unlocked"]){
			for(const [, entry] of Object.entries(stars["upgrades"])){
				entry.attemptUnlock() //unlock any available shop upgrades that meet unlock requirements here.
				for(const [index2, entry2] of Object.entries(entry["stats"])){
					for(const [index3, entry3] of Object.entries(entry2)){
						if(index2 === "add"){
							effects["stars"][index3] += entry3 * entry["bought"]
						}
						else if(index2 === "mult"){
							effects["stars"][index3 + "P"] += entry3 * entry["bought"]
						}
					}
				}
			}
		}*/
	}
	/*for(const [index] of Object.entries(effects)){
		if(index === "total"){
			continue
		}
		for(const [index2] of Object.entries(statTemplate)){
			effects["total"][index2]["add"] += effects[index][index2]["add"];
			effects["total"][index2]["mult"] *= effects[index][index2]["mult"];
		}
	}
	for(const [index] of Object.entries(statTemplate)){
		effects["total"][index + "Total"] = effects["total"][index]["add"] * effects["total"][index]["mult"];
	}
	global["effects"] = effects;*/
	energizer["unlocked"] = global["shop"]["upgrades"]["energizer"]["bought"] >= 1;
	garden["unlocked"] = global["shop"]["upgrades"]["garden"]["bought"] >= 1;
	dungeon["unlocked"] = global["shop"]["upgrades"]["dungeon"]["bought"] >= 1;
	stars["unlocked"] = global["shop"]["upgrades"]["telescope"]["bought"] >= 1;
	global["statList"].update();
	for(const [, entry] of Object.entries(shop["upgrades"])){
		entry.attemptUnlock(); //attempt to unlock shop upgrades that satisfy the requirement.
	}
	for(const [, entry] of Object.entries(stars["upgrades"])){
		for(const [, entry2] of Object.entries(entry)){
			entry2.attemptUnlock(); //attempt to unlock star upgrades that satisfy the requirement.
		}
	}
	garden.update(); //handles unlocked tiles and plant visuals.
}

export function purchase(item, amount, price, type){
	
	if (item["cap"] !== -1 && item["bought"] + amount > item["cap"]) {
		amount = item["cap"] - item["bought"] //lower amount purchased to the cap if attempting to purchase more than the cap
	}
	if (amount > 0) {
		for (const [index, entry] of Object.entries(price["price"])) {
			if(entry > global["resources"][index].amount){
				return false //not enough resources to spend
			}
		}
		for (const [index, entry] of Object.entries(price["price"])) {
			global["resources"][index].sub(entry)
		}
		item["bought"] += price["amount"];
		return true
	}
	return false
}

export function c(name){
	return name.split(" ").map((entry, index) => (
		(`${entry ? (styles[global["states"]["style"]]?.[entry] ? styles[global["states"]["style"]][entry] + " " : "") + entry : ""}`)
	)).join(" ");
}

export function lineRotAngle(distX, distY){ //returns line rotation in degrees to get from point A to point B
	return (distX < 0 ? -180 : 0) + Math.atan(distY/distX) * (180/Math.PI);
}

export const seededRandom = (val) => {
    let rnd = ((val * 9301 + 49297) % 233280) / 233280;
    return rnd;
}

export const splitmix32 = (a) => {
	/*return function(){
		return seededRandom(a);
	}*/
	return function() {
		a |= 0;
		a = a + 0x9e3779b9 | 0;
		let t = a ^ (a >>> 16);
		t = Math.imul(t, 0x21f0aaad);
		t = t ^ (t >>> 15);
		t = Math.imul(t, 0x735a2d97);
		return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
	}
	/*return function() {
		a |= 0; a = a + 0x9e3779b9 | 0;
		var t = a ^ a >>> 16; t = Math.imul(t, 0x21f0aaad);
			t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
		return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
	}*/
}