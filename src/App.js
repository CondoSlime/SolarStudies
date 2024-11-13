import React, { useState, useEffect, createContext, useReducer, useRef} from 'react';
import { Tooltip } from 'react-tooltip';
import { MainButton, RsDisplay, DragElem, SubMenu, FeatureMenu, PopupBox} from './components/comps';
import * as classes from './components/classes';
import {saveGame, loadGame} from './components/save';
import * as func from './components/functions';
import { ts, c } from './components/functions';
import * as img from './images/index';
//import App from './App';
//import reportWebVitals from './reportWebVitals';

func.ts(); //temp remove "defined but never used" warning.
if(img){}

export const mainContext = createContext(undefined); //context for menubuttons
export const dragContext = createContext({});
export const stateContext = createContext({});
export const global = {};
const now = new Date().getTime();
{
	const statTemplate = [
		"tickPower", "gardenPower", "dungeonPower", "gardenTile", "gardenPlantChance", "harvestPower", "starPower", "damage", "armor", "equipmentMax"
	];
	const starColors = [
		"red", "blue", "green", "yellow", "gray"
	];
	global["statTemplate"]= {}
	for(let i=0;i<statTemplate.length;i++){
		global["statTemplate"][statTemplate[i]] = {add:0, mult:1};
	}
	global["store"] = { focus: "welcome", test: { 1: 0, 2: 0, 3: 0 }, shop: { items: {}, buyAmount: 1 }, compendium: { plantId: 0 }, treasury: {}, dungeon: { screen: "dungeon", invSelect: 0, showCombatEquipment: 0}, stats: { screen: "main", breakdown: "none" },
		mouse:{startX:0, startY:0}};
	const effects = ["base", "mult"];
	const auras = ["permAura", "aura"];
	const statMods = ["base", "extra", "mult"];
	const equipStats = ["strike"];
	const multStats = ["mult"];
	const statDefaults = {shopUpgrade:"base", plantAura:"base", plantPermAura:"base", plantStats:"base", plantHarvest:"base", dungeonEquipment:"base"};
	global["values"] = {
		gardenX: 6, gardenY: 5, energizerX:4, energizerY:3, invW: 15, invH: 6, equipmentStatMax: 2, accCount: 4, baseDamage: 2, baseHealth: 10,
		damageScale: 1.02, healthScale: 1.02, features: ["shop", "energizer", "garden", "dungeon", "stars"], statTemplate:statTemplate, effects:effects, statDefaults:statDefaults,
		plantEffects:["harvest", "permAura", "aura"], equipStats:equipStats, statMods:statMods, multStats:multStats, auras:auras, starColors:starColors
	};
	global["debug"] = {testUpgrades:false, shopAllUnlocked:false, starsAllUnlocked:false}
	global["timer"] = { activator:1000};
	global["resources"] = new classes.resources();
	global["states"] = {};
	let resources = global["resources"];
	resources["power"] = new classes.resource("power", undefined, 10);
	for(let i=0;i<starColors.length;i++){
		resources[`${starColors[i]}Power`] = new classes.resource(`${starColors[i]}Power`);
	}
	resources["knowledge"] = new classes.resource("knowledge");
	global["statList"] = new classes.statList();
	global["statsInfo"] = new classes.statList();
	//global["stats"].setIgnoreName("unused", true);
	global.statList.stat = function(name) { //return the current value of an existing stat with all modifiers.
		return this["stats"]["total"][name]["total"];
	}
	global.statList.fullStat = function(name) { //return the current value of an existing stat with all modifiers.
		return this["stats"]["total"][name];
	}
	global["shop"] = new classes.shop();
	let shop = global["shop"];
	//new classes.upgrade("TP1", "tbd", "Power generation 1", { power: "5+5" }, "shop", 10, {add:{tickPower:1}});
	shop.add(new classes.upgrade("TP1", "Power collecting", "tbd", { power: "5+5" }, "shop", 10, {base:{tickPower:1}}));
	shop.add(new classes.upgrade("TP2", "Power generation 2", "tbd", { power: "100*1.1" }, "shop", 45, { base: { tickPower: 2 } }, () => (shop["upgrades"]["energizer"]["bought"] >= 1 && shop["upgrades"]["TP1"]["bought"] >= 1 )));
	shop.add(new classes.upgrade("TP3", "Power generation 3", "tbd", { power: "300*1.15"}, "shop", 50, { mult: { tickPower: 0.04 } }, () => (shop["upgrades"]["energizer"]["bought"] >= 1 && shop["upgrades"]["TP2"]["bought"] >= 5 )));
	shop.add(new classes.upgrade("energizer", "energizer", "tbd", { power: "10" }, "shop", 1, undefined, () => (shop["upgrades"]["garden"]["bought"] >= 1)));
	shop.add(new classes.upgrade("test1", "Power sink", "tbd", { power: "10" }, "shop", -1, undefined, undefined, () => (global["debug"]["testUpgrades"])))
	shop.add(new classes.upgrade("test2", "Power sink 2", "tbd", { power: "10+1" }, "shop", -1, undefined, undefined, () => (global["debug"]["testUpgrades"])));
	shop.add(new classes.upgrade("test3", "Power sink 3", "tbd", { power: "10*1.1" }, "shop", -1, undefined, undefined, () => (global["debug"]["testUpgrades"])));
	shop.add(new classes.upgrade("garden", "Garden", "tbd", { power: "15" }, "shop", 1, { base: { gardenTile: 4 } }, () => (shop["upgrades"]["TP1"]["bought"] >= 3)));
	shop.add(new classes.upgrade("garden2", "Garden tiles", "tbd", { power: "500+500" }, "shop", 5, { base: { gardenTile: 1 } }, () => (shop["upgrades"]["garden"]["bought"] >= 1)));
	shop.add(new classes.upgrade("garden3", "More garden tiles", "tbd", { power: "4000*1.1" }, "shop", 21, { base: { gardenTile: 1 } }, () => (shop["upgrades"]["garden2"]["bought"] >= 8)));
	shop.add(new classes.upgrade("dungeon", "Dungeon", "tbd", { power: "8000" }, "shop", 1, undefined, () => (shop["upgrades"]["garden2"]["bought"] >= 5)));
	shop.add(new classes.upgrade("telescope", "Telescope", "See the stars", { power: "10000" }, "shop", 1, undefined, () => (resources["power"]["amount"] >= 8000)));
	shop.add(new classes.upgrade("starPrism", "Star Prism", "Create some star power", { power: "10000*10" }, "shop", -1, {base:{starPower:1}}, () => (shop["upgrades"]["telescope"]["bought"] >= 1)));

	global["energizer"] = new classes.energizer(global["values"]["energizerX"], global["values"]["energizerY"], ["power", "garden", "dungeon"]);
	let energizer = global["energizer"];
	//useGlobalReducer("energizer", energizerReducer, {activator: false, power: false, garden: false, dungeon: false, redirector:false, redirector2:false, randRedirector:false});
	energizer.addModule("activator", "activator", {max:1, amount:1, activator:true, dirType:"cycle", dir:[false, false, true, false, false, false]});
	energizer.addModule("activator2", "spreading activator", {max:1, activator:true, amount:1, power:1.1, dirCount:2, dirType:"split", dir:[false, true, true, true, false, false]}, {power:2500});
	energizer.addModule("powerTarget", "power nexus", {max:1, amount:1, power:1, activate:"power"});
	energizer.addModule("gardenTarget", "garden nexus", {max:1, amount:1, power:0.2, activate:"garden"});
	energizer.addModule("dungeonTarget", "dungeon nexus", {max:1, amount:1, power:1, activate:"dungeon"});
	energizer.addModule("redirector", "redirector", {dirType:"turn", amount:2, stopper:false, dir:[false, true, false, false, false, false], noBack:false});
	energizer.addModule("redirector2", "cycling redirector", {dirType:"cycle", stopper:false, dir:[false, true, true, false, false, false]});
	energizer.addModule("redirector3", "randomizer", {dirType:"random", stopper:"empty", dir:[true, true, true, true, false, false]});
	energizer.addModuleUpgrade("activator", "strength", "increases strength", {power:"100*1.3"}, -1, {strength:0.01});
	energizer.addModuleUpgrade("activator", "modifiers", "unlocks additional modifier slots", {power:"1000*5"}, 6, {modifierSlot:1});
	energizer.addModuleUpgrade("activator", "cost", "reduces cost of other upgrades for this module", {knowledge:"10*1.1"}, -1, {costModifier:0.98});

	energizer.addModifier("power", "P", {power:0.05});
	energizer.addModifier("turner", "T", {turnPower:0.03});

	global["compendium"] = new classes.compendium();
	global["garden"] = new classes.garden(global["values"]["gardenX"], global["values"]["gardenY"]);
	let garden = global["garden"];
	//id, name, icon, background color, icon color, description, maxGrowth, stats
	garden.addNewPlant("Tplant1", "test plant 1", 1, "#DD8888", "#FFFFFF", "TBD", 10, 10, {aura:{mult:{tickPower:0.5, damage:0.6, armor:0.5}, harvest:{power:0.6}}});
	garden.addNewPlant("Tplant2", "test plant 2", 2, "#00FFFF", "#000000", "TBD", 16, 40, {harvest:{power:500}});
	garden.addNewPlant("Tplant3", "test plant 3", 3, "#FFFF00", "#000000", "TBD", 18, 50, {mult:{harvestPower:1}});
	garden.addNewPlant("Tplant4", "test plant 4", 4, "#FFFFFF", "#000000", "TBD", 4, 60, {harvest:{power:1}, aura:{base:{tickPower:1}}, mult:{tickPower:1}});
	garden.addNewPlant("Tplant5", "test plant 5", 5, "#000000", "#FFFFFF", "This plant appeared because you defeated an enemy in the dungeon.", 25, 70, {mult:{tickPower:1}});
	
	garden.addNewPlant("plant1", "plant 1", "P1", "#DD8888", "#FFFFFF", "Raises tick power", 2, 10, {mult:{tickPower:1}});
	garden.addNewPlant("plant2", "plant 2", "P2", "#00FFFF", "#000000", "Can be harvested for power", 3, 10, {harvest:{power:400}});
	garden.addNewPlant("plant3", "plant 3", "P3", "#FFFF00", "#000000", "Can be harvested for knowledge", 4, 10, {harvest:{knowledge:3}});
	garden.addNewPlant("plant4", "plant 4", "P4", "#448844", "#FFFFFF", "Combines the effect of all plants", 5, 40, {harvest:{power:400, knowledge:3}, mult:{tickPower:1}});

	garden.addToPool("basic", "plant1", 10);
	garden.addToPool("basic", "plant2", 10);
	garden.addToPool("basic", "plant3", 10);
	garden.addToPool("basic", "Tplant1", 10);
	garden.addToPool("basic", "plant4", 100, {mult:{tickPower:4}, harvest:{power:300}});

	global["dungeon"] = new classes.dungeon();
	let dungeon = global["dungeon"];

	let equipment;
	dungeon.addRarity("common", "common", "#BBBBBB");
	dungeon.addRarity("uncommon", "uncommon", "#118811");
	dungeon.addRarity("rare", "rare", "#4444BB");

	equipment = dungeon.addEquipment("weapon1", "weapon 1", "W1", "#118811", "weapon");
	equipment.addStats("common", {mult:{damage:0.25}, weapon:{minDamage:4, maxDamage:6}});
	equipment.addStats("uncommon", {mult:{damage:0.30}, weapon:{maxDamage:4}});
	equipment = dungeon.addEquipment("weapon2", "weapon 2", "W2", "#118811", "weapon");
	equipment.addStats("common", {weapon:{minDamage:7, maxDamage:11}});
	equipment.addStats("rare", {weapon:{minDamage:3, maxDamage:3}});
	equipment = dungeon.addEquipment("weapon3", "weapon 3", "W3", "#118811", "weapon");
	equipment.addStats("common", {mult:{damage:0.15}, weapon:{minDamage:3, maxDamage:3}});
	equipment.addStats("uncommon", {mult:{damage:0.2}, weapon:{minDamage:2, maxDamage:3}});
	equipment.addStats("rare", {mult:{damage:0.2}, weapon:{minDamage:2, maxDamage:3}});
	equipment = dungeon.addEquipment("helm1", "helm 1", "H1", "#881111", "head");
	equipment.addStats("common", {mult:{health:0.1, damage:0.15}});
	equipment.addStats("uncommon", {mult:{health:0.15, damage:0.09}});
	equipment.addStats("rare", {mult:{health:0.14, damage:0.1}});
	equipment = dungeon.addEquipment("helm2", "helm 2", "H2", "#111188", "head");
	equipment.addStats("common", {mult:{health:0.2, armor:0.2}});
	equipment.addStats("uncommon", {mult:{health:0.11, armor:0.05}});
	equipment.addStats("rare", {mult:{health:0.1, armor:0.05}});
	equipment = dungeon.addEquipment("trinket1", "trinket 1", "T1", "#AAAA55", "trinket");
	equipment.addStats("common", {mult:{tickPower:0.2}});
	equipment.addStats("uncommon", {mult:{tickPower:0.3}});
	equipment.addStats("rare", {mult:{tickPower:0.2}});
	equipment = dungeon.addEquipment("trinket2", "trinket 2", "T2", "#999933", "trinket");
	equipment.addStats("common", {mult:{tickPower:0.4}});
	equipment.addStats("uncommon", {mult:{tickPower:0.1}});
	equipment.addStats("rare", {mult:{tickPower:0.1}});
	//dungeon.addEquipment(equipmentClass("weapon2", "weapon", "A2", "#118811", Map("damage",4)))
	//dungeon.addEquipment(equipmentClass("weapon3", "weapon", "A3", "#118811", Map("damage",5)))

	//addEnemy(id, name, icon, color, hp (mod), damage (mod), stress (mod), effects) {
	dungeon.addEnemy("snake", "Snake", "s", "#66AA66", 0.9, 1.1, 0.8);
	dungeon.addEnemy("lizard", "Lizard", "l", "#88AA66", 1.1, 0.9, 0.85);
	dungeon.addEnemy("beetle", "Beetle", "b", "#662222", 1.3, 0.8, 1);
	global["dungeon"].newFloor(6, 6, 1);

	global["stars"] = new classes.starsMain();
	global["stars"].addMain(0, 10, 10, "green");
	global["stars"].addMain(1, 30, 50, "yellow");
	global["stars"].addMain(2, 90, 80, "blue");
	global["stars"].addMain(3, 10, 70, "gray");
	global["stars"].addUpgrade(0, "U1", "U1", "Test 1", -100, -100, 40, "star", {power:10}, 10, {base:{tickPower:10}}, undefined, undefined);
	global["stars"].addUpgrade(0, "U2", "U2", "Test 2", -200, -100, 40, "starBlue", {power:10}, 10, undefined, (() => (global["stars"]["upgrades"][0]["U1"].bought >= 5)), (() => (global["stars"]["upgrades"][0]["U1"].bought >= 1)));
	global["stars"].addUpgrade(0, "U3", "U3", "Test 3", -100, -200, 40, "starBlue", {power:10}, 10, undefined, (() => (global["stars"]["upgrades"][0]["U1"].bought >= 7)), (() => (global["stars"]["upgrades"][0]["U1"].bought >= 2)));
	global["stars"].addUpgrade(0, "U4", "U4", "Test 4", -200, -200, 40, "starBlue", {power:10}, 10, undefined, (() => (global["stars"]["upgrades"][0]["U1"].bought >= 9)), (() => (global["stars"]["upgrades"][0]["U1"].bought >= 3)));
	global["stars"].addConnection(0, "U1", "U2", "gray");
	global["stars"].addConnection(0, "U1", "U3", "gray");
	global["stars"].addConnection(0, "U1", "U4", "gray");
	/*global["stars"].addConnection(0, "U2", "U1", "blue");
	global["stars"].addConnection(0, "U2", "U3", "gray");
	global["stars"].addConnection(0, "U2", "U4", "gray");
	global["stars"].addConnection(0, "U3", "U1", "blue");
	global["stars"].addConnection(0, "U3", "U2", "blue");
	global["stars"].addConnection(0, "U3", "U4", "gray");
	global["stars"].addConnection(0, "U4", "U1", "blue");
	global["stars"].addConnection(0, "U4", "U2", "blue");
	global["stars"].addConnection(0, "U4", "U3", "blue");*/
	if(true){
		//shop["upgrades"]["starPrism"].addLevel(1);
		//shop["upgrades"]["energizer"].addLevel(1);
		//shop["upgrades"]["garden"].addLevel(1);
		//shop["upgrades"]["garden2"].addLevel(2);
		//shop["upgrades"]["dungeon"].addLevel(2);

		energizer.placeTile("activator2", {X:0, Y:1});
		energizer.placeTile("powerTarget", {X:1, Y:1});
		//let module = energizer.copyModule("activator2");
		//module.setDirection([1, 1, 0, 0]);
		//energizer.placeTile(module, {X:0, Y:2});
		//energizer.placeTile("gardenTarget", {X:0, Y:1});
		//energizer.placeTile("dungeonTarget", {X:3, Y:2});

		//dungeon.lootEquipment("weapon1", "random", 5);
		//dungeon.lootEquipment("weapon3", "random", 5);
		//dungeon.lootEquipment("helm1", "random", 5);
		//dungeon.lootEquipment("trinket1", "random", 5);
		//dungeon.lootEquipment("trinket2", "random", 5);*/
	}
	loadGame();
	func.updateEffects();
}


export function App() {
	const dragRef = useRef(undefined);
	const invTileSize = 70;
	const featureHandler = (state, action) =>{ //setFeature
		global["states"].setStarsScreen(-1);
		global["states"].setStarsAscension(false);
		return action;
	}
	const timerHandler = (state, action) => { //setTimer
		let newState = {...state};
		//const now = new Date().getTime();
		if (["activator", "garden"].includes(action.type)) {
			newState[action.type] = /*now*/action.custom || newState[action.type] + (global["timer"][action.type] * (action.mult || 1));
			return newState;
		}
		else {
			throw Error("Error. Invalid action: " + ts(action.type));
		}
	}
	const popupBoxHandler = (state, action) =>{ //setPopupBox
		if(action.text){
			let newState = {...state};
			newState.text = action.text;
			newState.visible = true;
			newState.buttons = action.buttons || [];
			return newState;
		}
		if(action.close){
			return {};
		}
	}
	const invScreenHandler = (state, action) =>{ //setInvScreen
		//let newState = {...state};
		let newState = {...state};
		if(action.type === "inventory"){
			newState = [1, {left:"0"}];
		}
		else if(action.type === "compendium"){
			newState = [0, {left:"-100%"}];
		}
		else{
			throw Error("state " + action.type + " is invalid.");
		}
		global["dungeon"]["invScreen"] = action;
		return newState
	}
	const invShowModeHandler = (state) =>{ //setInvShowMode
		return (state+1)%4;
	}
	const invRarityModeHandler = (state) =>{ //setInvRarityMode
		return (state+2)%(global["dungeon"]["rarityOrder"].length+1)-1;
	}
	const starsScreenHandler = (state, action) =>{ //setStarsScreen
		return action;
	}
	/*let def = [];
	for(let i=0;i<global["energizer"]["X"]*global["energizer"]["Y"];i++){
		def.push({current:false, hover:false});
	}*/
	const activatorTick = (action) =>{
		//const directions = ["up", "right", "down", "left"];'
		let result = {power:0, garden:0, dungeon:0};
		let newState = global["energizer"];
		let amount = action.amount || 1;
		const stats = global["statList"];
		const tickPower = stats.stat("tickPower");
		if(global["energizer"].unlocked){
			for(let i=0;i<newState.size();i++){
				let tile = newState["grid"][i];
				tile.resetBeam(); //reset beam size for all tiles
				tile.setNextMarkDir(); //cycle to the next direction for cycling modules. No effect on modules with no cycling properties
			}
			for(let i=0;i<newState.size();i++){
				const tile = newState["grid"][i];
				if(tile.module){
					const module = tile.module;
					if(module.activator){
						let actiDir;
						if(module.marker){
							actiDir = tile.currentMarkDir();
						}
						else if(module.dirType === "split"){
							actiDir = tile.dir;
						}
						else{
							throw Error("invalid direction for activator: " + ts(tile));
						}
						if(tile.dirCount()){
							for(let j=0;j<actiDir.length;j++){
								let used = [];
								if(actiDir[j]){
									let beam = true;
									let beamPower = (tile.stats.power || 0) / tile.dirCount() * amount;
									let newPos = newState.coordsToGrid(i);
									let direction = j;
									let storedDirection = j;
									tile["beam"][j] += 1;
									let loop = 0;
									while(beam){
										//dir0 = Y-1
										//dir1 = X%2 ? X+1 : X+1 Y-1
										//dir2 = X%2 ? X+1 Y+1 : X+1
										//dir3 = Y+1
										//dir4 = x%2 ? X-1 Y+1 : X-1
										//dir5 = x%2 ? X-1 : X-1 Y-1
										if(direction === 0){
											//dir0 = Y-1
											newPos["Y"] -= 1
										}
										if(direction === 1){
											//dir1 = X%2 ? X+1 : X+1 Y-1
											newPos["X"] += 1
											newPos["Y"] -= (newPos["X"]%2);
										}
										if(direction === 2){
											//dir2 = X%2 ? X+1 Y+1 : X+1
											newPos["Y"] += (newPos["X"]%2);
											newPos["X"] += 1
										}
										if(direction === 3){
											//dir3 = Y+1
											newPos["Y"] += 1
										}
										if(direction === 4){
											//dir4 = x%2 ? X-1 Y+1 : X-1
											newPos["Y"] += (newPos["X"]%2);
											newPos["X"] -= 1
										}
										if(direction === 5){
											//dir5 = x%2 ? X-1 : X-1 Y-1
											newPos["X"] -= 1
											newPos["Y"] -= (newPos["X"]%2);
										}
										beam = !(newPos["X"] >= global["energizer"]["X"] || newPos["X"] < 0 || newPos["Y"] >= global["energizer"]["Y"] || newPos["Y"] < 0)
										if(beam){
											const iPos = newPos["Y"] * global["energizer"]["X"] + newPos["X"];
											let iTile = newState["grid"][iPos];
											const iInfo = iTile.module;
											used[iPos] = used[iPos] ?? global["energizer"].sizeArr;
											iTile["beam"][(direction+3)%6] += 1;
											//let targetType = target["type"] || false;
											let iTileDir = iTile["dir"];
											if(iTile.filled){
												if(iInfo.stopper !== true){
													if(iInfo.dirType === "turn"){
														let valid = false;
														for(let k=iTileDir.length;k>0;k--){
															let dir = (direction+k)%6
															if(iTileDir[dir] && !used[iPos][dir] && !(iInfo.noBack && (dir+3)%6 === direction)){
																used[iPos][dir] = true;
																valid = true;
																direction = dir;
																break;
															}
														}
														if(!valid && iInfo.stopper === "empty"){
															beam = false;
														}
													}
													else if(iInfo.marker){
														let dir = iTile["markDir"];
														if(!used[iPos][dir] && !(iInfo.noBack && (dir+3)%6 === direction)){
															direction = dir;
															used[iPos][dir] = true;
														}
														else if(iInfo.stopper === "empty"){
															beam = false;
														}
													}
													else if(iInfo.dirType === "random"){
														let dir = ((direction) =>
															used[iPos].map((entry, index) => {return index})
															.filter((entry, index) => iTileDir[index] && !used[iPos][index] && !(iInfo.noBack && (index+3)%6 === direction))
														)(); //no-loop-func warning avoidance. https://stackoverflow.com/questions/70336584/function-declared-in-a-loop-contains-unsafe-references-to-variables
														//let dir = used[iPos].map((index, entry) => {return entry}).filter((index) => !used[iPos][index] && (index+2)%4 !== direction);
														if(dir.length>0){
															dir = dir[Math.floor(Math.random()*dir.length)];
															direction = dir;
															used[iPos][dir] = true;
														}
														else if(iInfo.stopper === "empty"){
															beam = false;
														}
													}
												}
												else{
													beam = false;
												}
												if(iInfo.activate){
													result[iInfo.activate] += (beamPower || 0) * iInfo.basePower;
												}
											}
											if(beam){
												iTile["beam"][direction] += 1;
											}
										}
										if(storedDirection !== direction){
											if(tile.stats.turnPower){
												beamPower += tile.stats.turnPower;
											}
											storedDirection = direction;
										}
										loop++;
										if(loop >= 100){
											beam = false;
											throw Error("energizer loop too long");
										}
									}
								}
							}
						}
					}
				}
			}
		}
		else{ //energizer is not unlocked, default to to power.
			result["power"] += 1;
		}
		if(result["power"] || true){
			result["power"] += newState["store"]["power"]; //add stored power
			newState["store"]["showpower"] = result["power"]; //power shown on screen happens before modulo
			newState["store"]["power"] = result["power"] % 1; //store excess power
			result["power"] = Math.floor(result["power"]); //round down excess power
			powerTick({amount:result["power"]}); //gain power once for every time the bar is filled
		}
		if(result["garden"] || true){
			result["garden"] += newState["store"]["garden"];
			newState["store"]["showgarden"] = result["garden"];
			newState["store"]["garden"] = result["garden"] % 1;
			result["garden"] += Math.floor(newState["store"]["garden"]);
			gardenTick({amount:result["garden"]}); //advance garden once for every time the bar is filled
		}
		if(result["dungeon"] || true){
			result["dungeon"] += newState["store"]["dungeon"];
			newState["store"]["showdungeon"] = result["dungeon"];
			newState["store"]["dungeon"] = result["dungeon"] % 1;
			result["dungeon"] += Math.floor(newState["store"]["dungeon"]);
			dungeonTick({amount:result["dungeon"]}); //advance dungeon once for every time the bar is filled
			//dungeonTick({amount:result["dungeon"]});
		}
		global["states"].setEnergizer(newState);
	};
	const powerTick = (action) => {
		let resources = global["resources"];
		let amount = action.amount || 0;
		resources["power"].add(global.statList.stat("tickPower") * amount);
		//global["states"].setTimer({ type: "power" });
		resourcesHandler();
	};
	const gardenTick = (action) => {
		//global["states"].setTimer({ type: "garden" });
		//let spawnMult = (action.spawnMult || 1);
		let garden = global["garden"];
		//let screen = garden["screens"][0]
		let amount = action.amount || 0;
		//let effects = global["effects"];
		//grow plants and apply permaura effects
		for(let [index, entry] of garden["screens"].entries()){
			if(entry.active){
				for (const [, entry2] of Object.entries(entry["grid"])) { //entry2 = each garden tile in garden
					if (entry2["plant"]) {
						if (entry2["plant"]["permAura"]) { //permaura happens before growth
							let tiles = entry2.surroundingTiles();
							for (const [, entry3] of Object.entries(tiles)) { //entry3 = each garden tile surrounding a garden tile that has a perm aura
								for (const [index4, entry4] of Object.entries(entry2["plant"]["permAura"])) { //entry4 = mult/add lists of perm aura of plant on selected tile
									for (const [index5, entry5] of Object.entries(entry4)) { //entry5 = stat lists of mult/add list of perm aura of plant on selected tile
										if (!(index5 in entry3["permEffects"][index4])) {
											entry3["permEffects"][index4][index5] = 0;
										}
										let diff = entry5 - entry3["permEffects"][index4][index5];
										let total = Math.min(Math.max(diff / 100 * Math.pow(amount, 1 - 1/100), entry5 / 10000 * amount), Math.max(diff, 0));
										//add 1% of the difference between the current and max tile aura. Or 0.01% of tile aura stat, whichever is higher. Can not go below 0, can't go above the difference between the current and max.
										if(total){
											entry3["permEffects"][index4][index5] += total;
											entry["change"] = true;
										}
									}
								}
							}
						}
						//grow plant
						const growth = Math.min(entry2["plant"]["maxGrowth"] - entry2["plant"]["growth"], (1*amount));
						if(growth){
							entry2["plant"]["growth"] += growth;
							entry["change"] = true;
						}
					}
				}
				func.updateEffects("garden"); //recalculate stats to determine plant new plant availabillity.
				//chance for a garden plant to spawn. Usually done by moving the mouse.
				let total = global.statList.stat("gardenPlantChance") + 1 * amount;
				let chance = func.random(1, 1);
				if (total >= chance) {
					if (garden.spawnPlant(index, "basic")) {
						entry["change"] = true;
						func.updateEffects("garden"); //new plant appeared. Recalculate stats.
					}
				}
			}
		}
		global["states"].setGarden(func.objClone(global["garden"]));
	};
	const dungeonTick = (action) =>{
		let amount = action.amount || 0;
		global["dungeon"] = global["states"]["dungeon"]
		global["dungeon"].advance(amount);
		func.updateEffects("dungeon");
		//global["dungeon"] = global["states"]["dungeon"];
		//newState.advance();
		//let newState = func.objClone(global["dungeon"]);
		global["states"].setDungeon(func.objClone(global["dungeon"]));
	};
	const resourcesHandler = () => {
		const newState = global["resources"];
		global["states"].setResources(func.objClone(newState));
	};
	const useGlobalState = (stateName, stateDefault) => {
		if (global["states"][stateName]) {
			//throw Error("State " + stateName + " already exists.");
		}

		const [state, setState] = useState(stateDefault);
		global["states"][stateName] = state;
		global["states"]["set" + stateName.charAt(0).toUpperCase() + stateName.slice(1)] = setState;
	}
	const useGlobalReducer = (stateName, reducer, stateDefault) => {
		const [state, setState] = useReducer(reducer, stateDefault);
		global["states"][stateName] = state;
		global["states"]["set" + stateName.charAt(0).toUpperCase() + stateName.slice(1)] = setState;
	}
	let timers = {};
	for (let [index, entry] of Object.entries(global["timer"])) {
		timers[index] = now + entry;
	}
	/*const [feature, selectFeature] = useState("welcome");
  	const [timer, setTimer] = useReducer(timerHandler, timers);
  	const [shop, setShop] = useState(global["shop"]);
  	const [shopBuyAmount, setShopBuyAmount] = useState(1);
  	const [energizer, setEnergizer] = useReducer(energizerReducer, {clicks:false, moves:false, keys:false});
  	const [garden, setGarden] = useState(global["garden"]);
  	const [resources, setResources] = useState(global["resources"]);
	const [gardenMode, setGardenMode] = useState("garden");
  	global["states"] = {...global["states"], timer:timer, setTimer:setTimer};*/
	//const draggable = new classes.draggable(useRef());
	useGlobalReducer("feature", featureHandler, "welcome");
	useGlobalReducer("timer", timerHandler, timers);
	useGlobalReducer("popupBox", popupBoxHandler, {});
	useGlobalState("style", "standard");
	useGlobalState("shop", global["shop"]);
	useGlobalState("shopBuyAmount", 1);
	useGlobalState("resources", global["resources"]);
	useGlobalState("energizer", global["energizer"]);
	useGlobalState("garden", global["garden"]);
	useGlobalState("gardenScreen", "garden");
	useGlobalState("gardenMode", "harvest");
	useGlobalState("compendium", global["compendium"]);
	useGlobalState("compendiumPlant", false);
	useGlobalState("energizerMode", "energizer");
	useGlobalState("dungeonMode", "dungeon");
	useGlobalState("dungeon", global["dungeon"]);
	useGlobalReducer("invScreen", invScreenHandler, [1, {left:0}]);
	useGlobalReducer("invShowMode", invShowModeHandler, 0);
	useGlobalReducer("invRarityMode", invRarityModeHandler, -1);
	useGlobalState("stars", global["stars"]);
	useGlobalState("starsAscension", false);
	useGlobalState("starsDrag", false);
	useGlobalState("mouseElem", document.createElement("div"));
	useGlobalReducer("starsScreen", starsScreenHandler, -1);
	useEffect(() => { //global timer
		const interval = setInterval(() => {
			//<div id="starLine" style={{background:"#888888", height:25, width:50, opacity:0.5, position:"absolute", top:"50%", left:"50%", transform:"rotate(90deg) translate(50%)"}}/>
			const now = new Date().getTime();
			if(now > global["states"]["timer"]["activator"] + (global["timer"]["activator"] * 5)){
				global["states"].setTimer({type:"activator", custom:now-global["timer"]["activator"]});
			}
			if (now > global["states"]["timer"]["activator"]) {
				activatorTick({amount:1});
				global["states"].setTimer({type: "activator"});
			}
		}, 100);
		return () => clearInterval(interval);
	});
	//}, []);
	const handleMouse = (action) =>{
		const e = action.e || window.e;
		if(action.type === "down"){
			global["store"]["mouse"]["startX"] = e.clientX;
			global["store"]["mouse"]["startY"] = e.clientY;
			global["store"]["mouse"]["X"] = e.clientX;
			global["store"]["mouse"]["Y"] = e.clientY;
			global["store"]["mouse"]["dist"] = 0;
			global["store"]["mouse"]["down"] = true;

		}
		if(action.type === "up"){
			global["store"]["mouse"]["startX"] = 0;
			global["store"]["mouse"]["startY"] = 0;
			global["store"]["mouse"]["dist"] = 0;
			global["store"]["mouse"]["down"] = false;
		}
		if(action.type === "move"){
			if(global["store"]["mouse"]["down"]){
				global["store"]["mouse"]["dist"] += Math.abs(global["store"]["mouse"]["X"]-e.clientX) + Math.abs(global["store"]["mouse"]["Y"]-e.clientY);
			}
			global["store"]["mouse"]["X"] = e.clientX;
			global["store"]["mouse"]["Y"] = e.clientY;
			global["states"].setMouseElem(document.elementFromPoint(e.clientX, e.clientY));
		}
		if(action.type !== "down"){
			setDraggable(action);
		}
	}
	const draggableHandler = (state, action) => { //setDraggable
		let newState = false;
		if(action.type === "down"){
			const e = action.e;
			newState = func.objClone(state);
			newState["elem"] = action.elem; //drag ghost element
			newState["active"] = e.target; //element that triggered drag
			const rect = e.target.getBoundingClientRect(); //size of element that triggered the drag
			newState["startX"] = e.clientX; //mouse X position on screen
			newState["startY"] = e.clientY; //mouse Y position on screen
			//multiplier (startOffX:1, startOffY:1 means object appears with bottom right corner on cursor)
			newState["startOffX"] = action.Xoffset ?? newState["startX"]-rect.x; //difference between element left corner and mouse X position
			newState["startOffY"] = action.Yoffset ?? newState["startY"]-rect.y; //difference between element top corner and mouse Y position
			newState["info"] = action.info ?? {}; //extra info to be attached to element
			//newState["hover"] = action.hover ?? {}; //extra info to be attached to element (destined to be used for hover, but functionally identical to info)
			newState["dragOff"] = action.dragOff ?? false; //set to true until mouse moved sufficiently far away, can be used to prevent function calls with low mouse movement
			newState["className"] = action.className ?? ""; //class name for drag ghost
			newState["style"] = {...action.style, //style for drag ghost
				left: newState["startX"] - newState["startOffX"],
				top: newState["startY"] - newState["startOffY"],
				/*width: e.target.offsetWidth,
				height: e.target.offsetHeight,*/
				Zindex:9999,
				opacity:0.5,
				visibility:(action.dragOff ? "hidden" : "visible"),
				...action.style
			};
			return newState
		}
		else if(action.type === "move"){ //just moving an element does not update state
			if(state["active"] && dragRef.current){
				const e = action.e;
				let visible = dragRef.current.style.visibility;
				if(e.screenX || e.screenY){
					dragRef.current.style.left = ((action.left ?? e.clientX) - state["startOffX"] - (action.Xoffset ?? 0)) + "px";
					dragRef.current.style.top = ((action.top ?? e.clientY) - state["startOffY"] - (action.Yoffset ?? 0)) + "px";
				}
				const mouseElem = document.elementFromPoint(e.clientX, e.clientY);
				if(mouseElem){
					if(state["dragOff"] && ((state["dragOff"] === true && mouseElem === state["active"]) ||
						(state["dragOff"] !== true && state["dragOff"] > Math.abs(e.clientX-state["startX"]) + Math.abs(e.clientY-state["startY"])))){
						visible = "hidden";
					}
					else{
						visible = "visible";
						if(state["dragOff"]){
							newState = func.objClone(state);
							newState["dragOff"] = false;
						}
					}
					//if(mouseElem.classList.contains("dragValid")){
					if(mouseElem.closest(".dragValid")){
						visible = "hidden";
					}
					dragRef.current.style.visibility = visible;
				}
			}
		}
		else if(action.type === "up"){
			if(state["active"] && false){
				newState = func.objClone(state);
				newState["active"] = false;
			}
			else if(state["active"]){
				//const e = action.e;
				//const mouseElem = document.elementFromPoint(e.clientX, e.clientY);
				newState = func.objClone(state);
				/*if(newState["info"] && newState["info"]["id"] === "energizerTile" && !isNaN(newState["info"]["origin"])){
					if(!mouseElem.closest(".energizerContainer")){
						const coords = newState["info"]["origin"];
						let Estate = func.objClone(global["states"]["energizer"]);
						Estate.tileRemove(coords);
						let Estate = {...global["states"]["energizer"]}
						Estate.findTile(newState["info"]["origin"])["current"] = false;
						global["states"].setEnergizer(Estate);
						func.updateEffects("energizer");
					}
				}*/
				if(!state["dragOff"]){
					if(global["states"]["invScreen"][0] === 0){
						let Dstate = func.objClone(global["states"]["dungeon"]);
						Dstate["selected"] = {id:newState.info.origin, origin:"inventory"};
						global["states"].setDungeon(Dstate);
					}
					else if(global["states"]["dungeon"]["selected"]){
						let Dstate = func.objClone(global["states"]["dungeon"]);
						Dstate["selected"] = undefined;
						global["states"].setDungeon(Dstate);
					}
				}
				newState["elem"] = false;
				newState["active"] = false;
				newState["info"] = false;
				newState["id"] = false;
				newState["visible"] = false;
				newState["startX"] = false;
				newState["startY"] = false;
				newState["startOffX"] = false;
				newState["startOffY"] = false;
				newState["className"] = "";
				newState["style"] = {};
				//newState["hover"] = {};
			}
		}
		else if(action.type === "info"){
			newState = func.objClone(state);
			if(action.clear){
				newState["info"] = action.info;
			}
			else{
				newState["info"] = {...newState["info"], ...action.info};
			}
		}
		/*else if(action.type === "hover"){
			newState = func.objClone(state);
			if(action.clear){
				newState["hover"] = action.info;
			}
			else{
				newState["hover"] = {...newState["hover"], ...action.info};
			}
		}*/
		else{
			throw Error("invalid action state " + action.type);
		}
		return newState || state;
		//newState["id"] = action.id || newState["id"] || false;
	}
	
	const [draggable, setDraggable] = useReducer(draggableHandler, {elem:false, active:false, style:{}, info:{}, hover:undefined, id:false, visible:false, startX:false, startY:false, startOffX:false, startOffY:false});
	
	const states = global["states"];
	const dev = (args = false) => {
		if (states["feature"] === "shop") {
			for (let [, entry] of Object.entries(global["resources"])) {
				entry.add(entry["amount"]+100);
				resourcesHandler();
			}
		}
		if (states["feature"] === "garden") {
			if(states["gardenScreen"] === "compendium"){
				global["resources"]["knowledge"].add(4);
				resourcesHandler();
			}
			else{
				global["garden"].spawnPlant(0, "basic");
				gardenTick({amount:1});
			}
		}
		if (states["feature"] === "energizer") {
			if(states["energizerMode"] === "energizer"){
				activatorTick({amount:1});
			}
			if(states["energizerMode"] === "modules"){
				let newState = global["energizer"];
				for(const [, entry] of Object.entries(newState["allModules"])){
					entry["currModifiers"] = Math.min(entry["maxModifiers"], entry["currModifiers"]+1);
				}
				states.setEnergizer(func.objClone(newState));
			}
		}
		if (states["feature"] === "dungeon") {
			if(states["dungeonMode"] === "dungeon"){
				if(global["dungeon"]["inCombat"]){
					global["dungeon"]["inCombat"]["enemy"]["health"] = 0;
					dungeonTick({amount:1});
				}
				else{
					while(!global["dungeon"]["inCombat"]){
						dungeonTick({amount:1});
					}
				}
			}
			else if(states["dungeonMode"] === "inventory"){
				global["dungeon"].lootEquipment("weapon1");
			}
		}
		func.updateEffects();
	}
	useEffect(() => {
		const mouseDown = window.addEventListener('mousedown', (e) => handleMouse({type:"down", e:e}));
		const mouseMove = window.addEventListener('mousemove', (e) => handleMouse({type:"move", e:e}));
		const mouseUp = window.addEventListener('mouseup', (e) => handleMouse({type:"up", e:e}));
		return () => { //to remove double-assigned event listener.
			window.removeEventListener('mousedown', mouseDown);
			window.removeEventListener('mousemove', mouseMove);
			window.removeEventListener('mouseup', mouseUp);
		}
	}, []);
	return (
		<>
			{!states["popupBox"].visible || <PopupBox {...states["popupBox"]}/>}
			<div className={c("main")} style={{'--invTileSize':`${invTileSize}px`}}>
				<div className={c("features")}>
					<RsDisplay>
						<>
							{states["feature"] === "garden" ? 
								<div className={c("layerBar")} style={{width:`${(states["energizer"]["store"]["garden"] || 1) * 100}%`, background:"#666699"}}></div>
							:states["feature"] === "dungeon" ?
								<div className={c("layerBar")} style={{width:`${(states["energizer"]["store"]["dungeon"] || 1) * 100}%`, background:"#666699"}}></div>
							:
								<div className={c("layerBar")} style={{width:`${(states["energizer"]["store"]["shop"] || 1) * 100}%`, background:"#666699"}}></div>
							}
							
						</>
						<span style={{zIndex:1}}>{`Power: ${Math.floor(states["resources"]["power"]["amount"])}`}</span>
					</RsDisplay>
					<mainContext.Provider value={{feature:states["feature"], selectFeature:states["setFeature"]}}>
						<MainButton to={"shop"}>{"Shop"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["energizer"]["bought"]} to={"energizer"}>{"Energizer"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["garden"]["bought"]} to={"garden"}>{"Garden"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["dungeon"]["bought"]} to={"dungeon"}>{"Dungeon"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["telescope"]["bought"]} to={"stars"} style={{backgroundColor:'#AAAACC'}}>{"Stars"}</MainButton>
						<MainButton to={"stats"}>{"Stats"}</MainButton>
						<MainButton >{"Options"}</MainButton>
						<MainButton >{"Help"}</MainButton>
						<MainButton to={"test"}>{"Test"}</MainButton>
						<MainButton onClick={() => saveGame()}>{"Save"}</MainButton>
						<MainButton onClick={() => loadGame()} >{"Load"}</MainButton>
						<MainButton style={{background:'#000000', color:'#DDDDDD'}} onClick={() => dev()}>{"Dev"}</MainButton>
						<MainButton style={{fontSize: '12px'}} onClick={() => states.setStyle(states.style === "standard" ? "index" : "standard")}>{"Activate!"}</MainButton>
					</mainContext.Provider>
				</div>
				<dragContext.Provider value={{draggable:draggable, setDraggable:setDraggable}}>
				<mainContext.Provider value={{resources:global["resources"], shop:global["shop"], energizer:global["energizer"], garden:global["garden"], compendium:global["compendium"], dungeon:global["dungeon"], stars:global["stars"], store:global["store"], values:global["values"], states:global["states"], statList:global["statList"]}}>
				<stateContext.Provider value={{mouseElem:global["states"]["mouseElem"]}}>
					<SubMenu type={states["feature"]}/>
					<FeatureMenu type={states["feature"]} invTileSize={invTileSize}/>
				</stateContext.Provider>
				</mainContext.Provider>
				</dragContext.Provider>
				{/*if (Game.OnAscend) //cookie clicker ascension starry background for reference.
					{
						Timer.clean();
						//starry background on ascend screen
						var w=Game.Background.canvas.width;
						var h=Game.Background.canvas.height;
						var b=Game.ascendl.getBounds();
						var x=(b.left+b.right)/2;
						var y=(b.top+b.bottom)/2;
						Game.Background.globalAlpha=0.5;
						var s=1*Game.AscendZoom*(1+Math.cos(Game.T*0.0027)*0.05); //zoom with scroll wheel, the screen also moves over time.
						//Game.AscendOffX and Game.AscendOffY are dragged position on the canvas. (starts at 0, goes below 0 when moving right/down)
						Game.Background.fillPattern(Pic('starbg.jpg'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);
						Timer.track('star layer 1');
						if (Game.prefs.fancy)
						{
							//additional star layer
							Game.Background.globalAlpha=0.5*(0.5+Math.sin(Game.T*0.02)*0.3);
							var s=2*Game.AscendZoom*(1+Math.sin(Game.T*0.002)*0.07);
							//Game.Background.globalCompositeOperation='lighter';
							Game.Background.fillPattern(Pic('starbg.jpg'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s); //second background star pattern
							//Game.Background.globalCompositeOperation='source-over';
							Timer.track('star layer 2');
							
							x=x+Game.AscendOffX*Game.AscendZoom;
							y=y+Game.AscendOffY*Game.AscendZoom;
							//wispy nebula around the center
							Game.Background.save();
							Game.Background.globalAlpha=0.5;
							Game.Background.translate(x,y);
							Game.Background.globalCompositeOperation='lighter';
							Game.Background.rotate(Game.T*0.001);
							s=(600+150*Math.sin(Game.T*0.007))*Game.AscendZoom;
							Game.Background.drawImage(Pic('heavenRing1.jpg'),-s/2,-s/2,s,s); //nebula in middle of the screen
							Game.Background.rotate(-Game.T*0.0017);
							s=(600+150*Math.sin(Game.T*0.0037))*Game.AscendZoom;
							Game.Background.drawImage(Pic('heavenRing2.jpg'),-s/2,-s/2,s,s); //second nebula part in middle of the screen
							Game.Background.restore();
							Timer.track('nebula');
							
							//Game.Background.drawImage(Pic('shadedBorders.png'),0,0,w,h);
							//Timer.track('border');
						}
					}*/
					/*{
						if (Game.keys[37]) Game.AscendOffXT+=16*(1/Game.AscendZoomT); //arrow keys
						if (Game.keys[38]) Game.AscendOffYT+=16*(1/Game.AscendZoomT);
						if (Game.keys[39]) Game.AscendOffXT-=16*(1/Game.AscendZoomT);
						if (Game.keys[40]) Game.AscendOffYT-=16*(1/Game.AscendZoomT);
						
						if (Game.AscendOffXT>-Game.heavenlyBounds.left) Game.AscendOffXT=-Game.heavenlyBounds.left; //do not go out of bounds
						if (Game.AscendOffXT<-Game.heavenlyBounds.right) Game.AscendOffXT=-Game.heavenlyBounds.right;
						if (Game.AscendOffYT>-Game.heavenlyBounds.top) Game.AscendOffYT=-Game.heavenlyBounds.top;
						if (Game.AscendOffYT<-Game.heavenlyBounds.bottom) Game.AscendOffYT=-Game.heavenlyBounds.bottom;
						Game.AscendOffX+=(Game.AscendOffXT-Game.AscendOffX)*0.5; //move quickly but not instanteneously
						Game.AscendOffY+=(Game.AscendOffYT-Game.AscendOffY)*0.5;
						Game.AscendZoom+=(Game.AscendZoomT-Game.AscendZoom)*0.25;
						if (Math.abs(Game.AscendZoomT-Game.AscendZoom)<0.005) Game.AscendZoom=Game.AscendZoomT;
						if (Math.abs(Game.AscendOffXT-Game.AscendOffX)<0.005) Game.AscendOffX=Game.AscendOffXT;
						if (Math.abs(Game.AscendOffYT-Game.AscendOffY)<0.005) Game.AscendOffY=Game.AscendOffYT;
						
						if (Game.mouseDown && !Game.promptOn) //cookie clicker drag function for reference.
						{
							if (!Game.AscendDragging)
							{
								Game.AscendDragX=Game.mouseX;
								Game.AscendDragY=Game.mouseY;
							}
							Game.AscendDragging=1;
							
							if (!Game.SelectedHeavenlyUpgrade)
							{
								Game.AscendOffXT+=(Game.mouseX-Game.AscendDragX)*(1/Game.AscendZoomT);
								Game.AscendOffYT+=(Game.mouseY-Game.AscendDragY)*(1/Game.AscendZoomT);
							}
							Game.AscendDragX=Game.mouseX;
							Game.AscendDragY=Game.mouseY;
						}
					}*/
					}
			</div>
			<dragContext.Provider value={{draggable:draggable, setDraggable:setDraggable}}>
				<DragElem ref={dragRef}></DragElem>
			</dragContext.Provider>
			<Tooltip id="my-tooltip" opacity={1} disableStyleInjection={false} style={{zIndex:9999}}/>
		</>
		);
}

export default App;
