import React, { useState, useEffect, createContext, useReducer, useRef, useCallback} from 'react';
import { Tooltip } from 'react-tooltip';
import './index.css';
import { MainButton, MenuButton, ShopUpgradeButton, EnergizerElem, ModifierElem, EnergizerTile, FakeEnergizerTile, EnergizerModifier,
	MenuModeButton, GardenTile, CompendiumTile, CompendiumKnowledgeBar, CompendiumPlantList, CompendiumStats, AddKnowledgeButton, DungeonTile,
	PlayerPanel, EnemyPanel, InventoryEquipSlot, WeaponDiamond, InventorySlot, RsDisplay, DragElem, EquipOptionButton, ForgeDisplay, CenterStar,
	CenterStarLine, MainStar, StarsUpgrade, StarUpgradeLine} from './components/comps';
import {ShopSideMenu} from './components/shop';
import * as classes from './components/classes';
import {saveGame, loadGame, softReset, hardReset} from './components/save';
import * as func from './components/functions';
import { ts } from './components/functions';
import * as img from './images/index';
//import App from './App';
//import reportWebVitals from './reportWebVitals';

func.ts(); //temp remove "defined but never used" warning.
if(img){}

export const mainContext = createContext(undefined); //context for menubuttons
export const dragContext = createContext({});
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
	global["store"] = { focus: "welcome", test: { 1: 0, 2: 0, 3: 0 }, shop: { items: {}, buyAmount: 1 }, compendium: { plantId: 0 }, treasury: {}, dungeon: { screen: "dungeon", invSelect: 0, showCombatEquipment: 0}, stars: {baseScreenX:0, baseScreenY:0, screenX:0, screenY:0}, stats: { screen: "main", breakdown: "none" },
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
	
	global["timer"] = { activator:1000};
	global["cheats"] = {shopAllUnlocked:false, starsAllUnlocked:false};
	global["resources"] = new classes.resources();
	global["states"] = {};
	let resources = global["resources"];
	resources["power"] = new classes.resource("power", undefined, 10);
	for(let i=0;i<starColors.length;i++){
		resources[`${starColors[i]}Power`] = new classes.resource(`${starColors[i]}Power`);
	}
	resources["knowledge"] = new classes.resource("knowledge");
	resources["shards"] = new classes.resource("shards");
	global["statList"] = new classes.statList();
	global["statsInfo"] = new classes.statList();
	//global["stats"].setIgnoreName("unused", true);
	global.stat = function(name) { //return the current value of an existing stat with all modifiers.
		return this["statList"]["stats"]["total"][name]["total"];
	}
	global.fullStat = function(name) { //return the current value of an existing stat with all modifiers.
		return this["statList"]["stats"]["total"][name];
	}
	global["shop"] = new classes.shop();
	let shop = global["shop"];
	//new classes.upgrade("TP1", "tbd", "Power generation 1", { power: "5+5" }, "shop", 10, {add:{tickPower:1}});
	shop.add(new classes.upgrade("TP1", "tbd", "Power generation 1", { power: "5+5" }, "shop", 10, {base:{tickPower:1}}));
	shop.add(new classes.upgrade("TP2", "tbd", "Power generation 2", { power: "100*1.1" }, "shop", 45, { base: { tickPower: 2 } }, function () { return shop["upgrades"]["energizer"]["bought"] >= 1 && shop["upgrades"]["TP1"]["bought"] >= 1 }));
	shop.add(new classes.upgrade("TP3", "tbd", "Power generation 3", { power: "300*1.15"}, "shop", 50, { mult: { tickPower: 0.04 } }, function () { return shop["upgrades"]["energizer"]["bought"] >= 1 && shop["upgrades"]["TP2"]["bought"] >= 5 }));
	shop.add(new classes.upgrade("energizer", "tbd", "energizer", { power: "15" }, "shop", 1, undefined, function () { return shop["upgrades"]["TP1"]["bought"] >= 1}));
	shop.add(new classes.upgrade("test1", "tbd", "test 1", { power: "10" }, "shop", -1))
	shop.add(new classes.upgrade("test2", "tbd", "test 2", { power: "10+1" }, "shop", -1));
	shop.add(new classes.upgrade("test3", "tbd", "test 3", { power: "10*1.1" }, "shop", -1));
	shop.add(new classes.upgrade("garden", "tbd", "Garden", { power: "1500" }, "shop", 1, { base: { gardenTile: 4 } }, function () { return shop["upgrades"]["energizer"]["bought"] >= 1}));
	shop.add(new classes.upgrade("garden2", "tbd", "Garden tiles", { power: "500+500" }, "shop", 5, { base: { gardenTile: 1 } }, function () { return shop["upgrades"]["garden"]["bought"] >= 1 }));
	shop.add(new classes.upgrade("garden3", "tbd", "More garden tiles", { power: "4000*1.1" }, "shop", 21, { base: { gardenTile: 1 } }, function () { return shop["upgrades"]["garden2"]["bought"] >= 8 }));
	shop.add(new classes.upgrade("dungeon", "tbd", "Dungeon", { power: "8000" }, "shop", 1, undefined, function () { return shop["upgrades"]["garden2"]["bought"] >= 5 }));
	shop.add(new classes.upgrade("telescope", "See the stars", "Telescope", { power: "10000" }, "shop", 1, undefined, function () { return resources["power"]["amount"] >= 8000 }));
	shop.add(new classes.upgrade("starPrism", "Create some star power", "Star Prism", { power: "10000*10" }, "shop", -1, {base:{starPower:1}}, function () { return shop["upgrades"]["telescope"]["bought"] >= 1 }));

	global["energizer"] = new classes.energizer(global["values"]["energizerX"], global["values"]["energizerY"], ["power", "garden", "dungeon"]);
	let energizer = global["energizer"];
	//useGlobalReducer("energizer", energizerReducer, {activator: false, power: false, garden: false, dungeon: false, redirector:false, redirector2:false, randRedirector:false});
	energizer.addModule("activator", "activator", {max:1, amount:1, activator:true, dirType:"cycle", dir:[false, true, false, false]});
	energizer.addModule("activator2", "spreading activator", {max:1, activator:true, amount:1, power:2, dirCount:2, dirType:"split", dir:[false, false, true, true]});
	energizer.addModule("powerTarget", "power nexus", {max:1, amount:1, power:1, activate:"power"});
	energizer.addModule("gardenTarget", "garden nexus", {max:1, amount:1, power:0.2, activate:"garden"});
	energizer.addModule("dungeonTarget", "dungeon nexus", {max:1, amount:1, power:1, activate:"dungeon"});
	energizer.addModule("redirector", "redirector", {dirType:"turn", amount:2, stopper:false, dir:[false, true, false, false], noBack:false});
	energizer.addModule("redirector2", "cycling redirector", {dirType:"cycle", stopper:false, dir:[false, true, true, false]});
	energizer.addModule("redirector3", "randomizer", {dirType:"random", stopper:"empty", dir:[true, true, true, true]});

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
	garden.addToPool("basic", "plant4", 100, {base:{tickPower:4}, harvest:{power:300}});

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
		shop["upgrades"]["starPrism"].addLevel(1);
		/*shop["upgrades"]["energizer"].addLevel(1);
		shop["upgrades"]["garden"].addLevel(1);
		shop["upgrades"]["garden2"].addLevel(2);
		shop["upgrades"]["dungeon"].addLevel(2);

		energizer.placeModule("activator", {X:0, Y:0});
		energizer.placeModule("powerTarget", {X:3, Y:0});
		let module = energizer.copyModule("activator2");
		module.setDirection([1, 1, 0, 0]);
		energizer.placeModule(module, {X:0, Y:2});
		energizer.placeModule("gardenTarget", {X:0, Y:1});
		energizer.placeModule("dungeonTarget", {X:3, Y:2});

		dungeon.lootEquipment("weapon1", "random", 5);
		dungeon.lootEquipment("weapon3", "random", 5);
		dungeon.lootEquipment("helm1", "random", 5);
		dungeon.lootEquipment("trinket1", "random", 5);
		dungeon.lootEquipment("trinket2", "random", 5);*/
	}
	loadGame();
	func.updateEffects();
}



export function App() {
	const dragRef = useRef(undefined);
	const starBackgroundContainerRef = useRef(undefined);
	const starBackgroundRef = useRef(undefined);
	const starUpgradeRef = useRef(undefined);
	const invTileSize = 70;
	const featureHandler = (state, action) =>{ //setFeature
		global["store"]["stars"]["screenX"] = 0;
		global["store"]["stars"]["screenY"] = 0;
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
		let amount = action.amont || 1;
		const stats = global["statList"];
		const tickPower = stats.stat("tickPower");
		for(let i=0;i<newState.size();i++){
			let tile = newState["grid"][i];
			tile["beam"] = [0, 0, 0, 0];
			if(tile.info){
				//const info = tile.info;
				const markDir = tile["markDir"];
				//newState[i]["beam"] = [0, 0, 0, 0];
				if(!isNaN(markDir)){
					let dir = tile["dir"];
					/*let dir = newState[i]["direction"];
					let dirArr2 = dir.map((entry, index) => {return index})
					let dirArr = dirArr2.slice(markDir).concat(dirArr2.slice(0, markDir)).filter((index) => dir[index]);
					//let start = dirArr[0];
					let dirAmount = dirArr.length;
					//let turnMult = mult % dirAmount;
					let turnMult = 1;
					newState[i]["markDirection"] = (dirArr.find(function(entry, index){return index >= turnMult})) % 4;
					//newState[i].cycle();*/
	
					//newState[i]["current"]["markDir"] = (
					tile["markDir"] = (
						(tile["markDir"] + 
							dir.slice(markDir+1)
							.concat(dir.slice(0, markDir+1))
							.findIndex(function(index, entry){return index})
						)+1 || false
					) % 4;
				}
			}
		}
		for(let i=0;i<newState.size();i++){
			const tile = newState["grid"][i];
			if(tile.info){
				const info = tile.info;
				if(info.activator){
					let actiDir;
					if(info.marker){
						actiDir = tile.currentMarkDir();
						//actiDir = tile.markDir;
					}
					else if(info.dirType === "split"){
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
									if(direction === 0){
										newPos["Y"] -= 1
									}
									if(direction === 1){
										newPos["X"] += 1
									}
									if(direction === 2){
										newPos["Y"] += 1
									}
									if(direction === 3){
										newPos["X"] -= 1
									}
									beam = !(newPos["X"] >= global["energizer"]["X"] || newPos["X"] < 0 || newPos["Y"] >= global["energizer"]["Y"] || newPos["Y"] < 0)
									if(beam){
										const iPos = newPos["Y"] * global["energizer"]["X"] + newPos["X"];
										let iTile = newState["grid"][iPos];
										const iInfo = iTile.info;
										used[iPos] = used[iPos] ?? [false, false, false, false];
										iTile["beam"][(direction+2)%4] += 1;
										//let targetType = target["type"] || false;
										let iTileDir = iTile["dir"];
										if(iTile){
											if(iInfo.stopper !== true){
												if(iInfo.dirType === "turn"){
													let valid = false;
													for(let k=iTileDir.length;k>0;k--){
														let dir = (direction+k)%4
														if(iTileDir[dir] && !used[iPos][dir] && !(iInfo.noBack && (dir+2)%4 === direction)){
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
													if(!used[iPos][dir] && !(iInfo.noBack && (dir+2)%4 === direction)){
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
														.filter((entry, index) => iTileDir[index] && !used[iPos][index] && !(iInfo.noBack && (index+2)%4 === direction))
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
												result[iInfo.activate] += (beamPower || 0) * iInfo.power;
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
		if(result["power"] || true){
			result["power"] += newState["store"]["power"]*tickPower;
			newState["store"]["power"] = result["power"] % 1;
			result["power"] = Math.floor(result["power"]);
			powerTick({amount:result["power"]});
		}
		if(result["garden"] || true){
			result["garden"] += newState["store"]["garden"];
			newState["store"]["garden"] = result["garden"] % 1;
			result["garden"] += Math.floor(newState["store"]["garden"]);
			gardenTick({amount:Math.floor(result["garden"])});
		}
		if(result["dungeon"] || true){
			result["dungeon"] += newState["store"]["dungeon"];
			newState["store"]["dungeon"] = result["dungeon"] % 1;
			result["dungeon"] += Math.floor(newState["store"]["dungeon"]);
			dungeonTick({amount:Math.floor(result["dungeon"])});
			//dungeonTick({amount:result["dungeon"]});
		}
		global["states"].setEnergizer(newState);
	}
	const powerTick = (action) => {
		let resources = global["resources"];
		let amount = action.amount || 0;
		resources["power"].add(global.stat("tickPower") * amount);
		//global["states"].setTimer({ type: "power" });
		resourcesHandler();
	}
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
				let total = global.stat("gardenPlantChance") + 1 * amount;
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
	}
	const dungeonTick = (action) =>{
		let amount = action.amount || 0;
		global["dungeon"] = global["states"]["dungeon"]
		global["dungeon"].advance(amount);
		func.updateEffects("dungeon");
		//global["dungeon"] = global["states"]["dungeon"];
		//newState.advance();
		//let newState = func.objClone(global["dungeon"]);
		global["states"].setDungeon(func.objClone(global["dungeon"]));
	}
	const shopBuyAmountHandler = (mode) => {
		let amounts = [1, 10, "max", "round"];
		for (let i = 0; i < amounts.length; i++) {
			if (i + 1 >= amounts.length) {
				global["states"].setShopBuyAmount(amounts[0]);
				return
			}
			else if (mode === amounts[i]) {
				global["states"].setShopBuyAmount(amounts[i + 1]);
				return
			}
		}
	}
	const resourcesHandler = () => {
		const newState = global["resources"];
		global["states"].setResources(func.objClone(newState));
	}
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
	useGlobalReducer("starsScreen", starsScreenHandler, -1);
	useEffect(() => { //global timer
		const interval = setInterval(() => {
			//<div id="starLine" style={{background:"#888888", height:25, width:50, opacity:0.5, position:"absolute", top:"50%", left:"50%", transform:"rotate(90deg) translate(50%)"}}/>
			const now = new Date().getTime();
			if(now > global["states"]["timer"]["activator"] + (global["timer"]["activator"] * 5)){
				global["states"].setTimer({type:"activator", custom:now-global["timer"]["activator"]});
			}
			if (now > global["states"]["timer"]["activator"]) {
				//activatorTick({amount:1});
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
		}
		if(action.type !== "down"){
			setDraggable(action);
		}
		if(global["states"]["starsDrag"] && action.type === "move"){
			//tars: {screenX:0, screenY:0
			
			/*//starry background on ascend screen
			var w=Game.Background.canvas.width;
			var h=Game.Background.canvas.height;
			var b=Game.ascendl.getBounds();
			var x=(b.left+b.right)/2;
			var y=(b.top+b.bottom)/2;
			Game.Background.globalAlpha=0.5;
			var s=1*Game.AscendZoom*(1+Math.cos(Game.T*0.0027)*0.05); //zoom with scroll wheel, the screen also moves over time.
			//Game.AscendOffX and Game.AscendOffY are dragged position on the canvas. (starts at 0, goes below 0 when moving right/down)
			Game.Background.fillPattern(Pic('starbg.jpg'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);*/


			if(starBackgroundRef.current && starBackgroundContainerRef.current){ //background size = 25%/3 = 8.333%
				
				global["store"]["stars"]["screenX"] = global["store"]["stars"]["baseScreenX"] + (e.clientX - global["store"]["mouse"]["startX"]);
				global["store"]["stars"]["screenY"] = global["store"]["stars"]["baseScreenY"] + (e.clientY - global["store"]["mouse"]["startY"]);
				let posX = ((global["store"]["stars"]["screenX"] / 1.8) % (starBackgroundRef.current.offsetWidth/12)) - (starBackgroundRef.current.offsetWidth/2);
				let posY = ((global["store"]["stars"]["screenY"] / 1.8) % (starBackgroundRef.current.offsetHeight/12)) - (starBackgroundRef.current.offsetHeight/2);
				//posX = - (starBackgroundRef.current.offsetWidth/2);
				//posY = - (starBackgroundRef.current.offsetHeight/2);
				//todo: Change zooming the screen to move the background relative to its position, so it never shows parts that are out of bounds.
				/*global["store"]["stars"]["screenX"] = Math.min(global["store"]["stars"]["screenX"], -starBackgroundContainerRef.current.offsetWidth/2);
				global["store"]["stars"]["screenX"] = Math.max(global["store"]["stars"]["screenX"], -starBackgroundRef.current.offsetWidth + (starBackgroundContainerRef.current.offsetWidth/2));
				global["store"]["stars"]["screenY"] = Math.min(global["store"]["stars"]["screenY"], -starBackgroundContainerRef.current.offsetHeight/2);
				global["store"]["stars"]["screenY"] = Math.max(global["store"]["stars"]["screenY"], -starBackgroundRef.current.offsetHeight + (starBackgroundContainerRef.current.offsetHeight/2));*/
				starBackgroundRef.current.style.left = `${posX}px`;
				starBackgroundRef.current.style.top = `${posY}px`;
				posX = global["store"]["stars"]["screenX"];
				posY = global["store"]["stars"]["screenY"];
				starUpgradeRef.current.style.left = `${posX}px`;
				starUpgradeRef.current.style.top = `${posY}px`;
			}
		}
		if(action.type === "up"){
			global["store"]["stars"]["baseScreenX"] = global["store"]["stars"]["screenX"];
			global["store"]["stars"]["baseScreenY"] = global["store"]["stars"]["screenY"];
			global["states"].setStarsDrag(false);
		}
	}
	const draggableHandler = (state, action) => { //setDraggable
		let newState = false;
		if(action.type === "down"){
			const e = action.e;
			newState = func.objClone(state);
			newState["elem"] = action.elem;
			newState["active"] = e.target;
			const rect = e.target.getBoundingClientRect();
			newState["startX"] = e.clientX;
			newState["startY"] = e.clientY;
			newState["startOffX"] = action.Xoffset ?? newState["startX"]-rect.x;
			newState["startOffY"] = action.Yoffset ?? newState["startY"]-rect.y;
			newState["info"] = action.info ?? false;
			newState["hover"] = action.hover ?? undefined;
			newState["dragOff"] = action.dragOff ?? false;
			newState["className"] = action.className ?? "";
			newState["style"] = {...action.style,
				left: newState["startX"] - newState["startOffX"],
				top: newState["startY"] - newState["startOffY"],
				width: e.target.offsetWidth,
				height: e.target.offsetHeight,
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
				const e = action.e;
				const mouseElem = document.elementFromPoint(e.clientX, e.clientY);
				newState = func.objClone(state);
				if(newState["info"] && newState["info"]["id"] === "energizerTile" && !isNaN(newState["info"]["origin"])){
					if(!mouseElem.closest(".energizerContainer")){
						const coords = newState["info"]["origin"];
						let Estate = func.objClone(global["states"]["energizer"]);
						Estate.tileRemove(coords);
						/*let Estate = {...global["states"]["energizer"]}
						Estate.findTile(newState["info"]["origin"])["current"] = false;*/
						global["states"].setEnergizer(Estate);
						func.updateEffects("energizer");
					}
				}
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
				newState["hover"] = undefined;
			}
		}
		else if(action.type === "info"){
			newState = func.objClone(state);
			newState["info"] = action.info;
		}
		else if(action.type === "hover"){
			newState = func.objClone(state);
			newState["hover"] = action.info;
		}
		else{
			throw Error("invalid action state " + action.type);
		}
		return newState || state;
		//newState["id"] = action.id || newState["id"] || false;
	}
	
	const [draggable, setDraggable] = useReducer(draggableHandler, {elem:false, active:false, style:{}, info:false, hover:undefined, id:false, visible:false, startX:false, startY:false, startOffX:false, startOffY:false});
	const handleCompendium = (action, e) =>{
		if(action === "hover"){
			if(draggable){
			}
		}
		else if(action === "release"){
			if(draggable.info.id === "gardenTile" && draggable.info.args.plant.id){
				global["compendium"]["plants"][draggable.info.args.plant.id].unlocked = true;
				let newState = global["compendium"];
				global["states"].setCompendium(func.objClone(newState));
				global["states"].setCompendiumPlant(draggable.info.args.plant.id);
			}
		}
	}
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
	const ascend = (star) =>{
		if(global["states"]["starsAscension"]){
			let color = star["color"];
			let power = global["resources"][`${color}Power`];
			let amount = global.stat("starPower") - power.amount;
			if(amount > 0){
				power.add(amount);
			}
			softReset();
			global["states"].setStarsAscension(false);
		}
	}

	const starBackgroundCallback = useCallback((node) => {
		if(node !== null){
			let posX = ((global["store"]["stars"]["screenX"] / 1.8) % (node.offsetWidth/12)) - (node.offsetWidth/2);
			let posY = ((global["store"]["stars"]["screenY"] / 1.8) % (node.offsetHeight/12)) - (node.offsetHeight/2);
			node.style.left = `${posX}px`;
			node.style.top = `${posY}px`;
		}
	}, [])
	
	const starUpgradesCallback = useCallback((node) => {
		if(node !== null){
			let posX = global["store"]["stars"]["screenX"];
			let posY = global["store"]["stars"]["screenY"];
			starUpgradeRef.current.style.left = `${posX}px`;
			starUpgradeRef.current.style.top = `${posY}px`;
		}
	}, [])
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
			<div id="mainMenu" style={{'--invTileSize':`${invTileSize}px`}}>
				<div id="leftMenu">
					<RsDisplay>
						<div style={{width:"100%", height:"100%", position:"absolute"}}>
							{states["feature"] === "garden" ? 
								<div style={{height:"100%", width:`${(states["energizer"]["store"]["garden"] || 1) * 100}%`, background:"#666699"}}></div>
							:states["feature"] === "dungeon" ?
								<div style={{height:"100%", width:`${(states["energizer"]["store"]["dungeon"] || 1) * 100}%`, background:"#666699"}}></div>
							:
								<div style={{height:"100%", width:`${(states["energizer"]["store"]["shop"] || 1) * 100}%`, background:"#666699"}}></div>
							}
							
						</div>
						<span style={{zIndex:1}}>{`Power: ${Math.floor(states["resources"]["power"]["amount"])}`}</span>
					</RsDisplay>
					<mainContext.Provider value={{feature:states["feature"], selectFeature:states["setFeature"]}}>
						<MainButton to={"shop"}>{"Shop"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["garden"]["bought"]} to={"garden"}>{"Garden"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["energizer"]["bought"]} to={"energizer"}>{"Energizer"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["dungeon"]["bought"]} to={"dungeon"}>{"Dungeon"}</MainButton>
						<MainButton unlock={states["shop"]["upgrades"]["telescope"]["bought"]} to={"stars"} style={{backgroundColor:'#AAAACC'}}>{"Stars"}</MainButton>
						<MainButton to={"Stats"}>{"Stats"}</MainButton>
						<MainButton >{"Options"}</MainButton>
						<MainButton >{"Help"}</MainButton>
						<MainButton onClick={() => saveGame()}>{"Save"}</MainButton>
						<MainButton onClick={() => loadGame()} >{"Load"}</MainButton>
						<MainButton style={{background:'#000000', color:'#DDDDDD'}} onClick={() => dev()}>{"Dev"}</MainButton>
						<MainButton style={{fontSize: '12px'}}>{"Activate!"}</MainButton>
						<div>{Math.random(0, 1).toFixed(5)}</div>
					</mainContext.Provider>
				</div>
				<div id="middleMenu">
					<dragContext.Provider value={{draggable:draggable, setDraggable:setDraggable}}>
					{states["feature"] === "shop" ? <>
						<ShopSideMenu shopBuyAmountHandler={shopBuyAmountHandler} /*states={{resources:states["resources"], shopBuyAmount:states["shopBuyAmount"]}}*//>
					</>
					: states["feature"] === "energizer" ? <>
						<mainContext.Provider value={{mode: states["energizerMode"], setMode: states.setEnergizerMode}}>
							<MenuModeButton mode={"energizer"} style={{fontSize: '12px'}}>{"Energizer"}</MenuModeButton>
							<MenuModeButton mode={"modules"} style={{fontSize: '12px'}}>{"Modules"}</MenuModeButton>
							<div style={{height:10, borderTop:"1px solid black", marginTop:10}}/>
							{states.energizerMode === "energizer" ? 
								Object.entries(states["energizer"]["allModules"]).map(([index, entry]) => (
									<EnergizerElem key={index} item={entry}>{states["energizer"]["allModules"][index]["name"]}</EnergizerElem>
								))
							:states.energizerMode === "modules" ?
								Object.entries(states["energizer"]["allModifiers"]).map(([index, entry]) => (
									<ModifierElem key={index} item={entry}>{entry.name}</ModifierElem>
								))
							: <></>}
						</mainContext.Provider>
					</>
					: states["feature"] === "garden" ? <>
						<mainContext.Provider value={{mode: states["gardenScreen"], setMode: states.setGardenScreen}}>
							<MenuModeButton mode={"garden"} gardenButtonHover={"garden"} style={{ background: "#228822", height:60}}>{"Garden"}</MenuModeButton>
							<MenuModeButton mode={"storage"} gardenButtonHover={"storage"} style={{ background: "#886644", height:60}}>{"Storage"}</MenuModeButton>
							<MenuModeButton mode={"compendium"} gardenButtonHover={"compendium"} style={{ background: "#664422", height:60}}>{"Compendium"}</MenuModeButton>
						</mainContext.Provider>
						<div style={{height:30}}></div>
						<mainContext.Provider value={{mode: states["gardenMode"], setMode: states.setGardenMode}}>
							<MenuModeButton mode={"inspect"}>{"Inspect"}</MenuModeButton>
							<MenuModeButton mode={"harvest"}>{"Harvest"}</MenuModeButton>
							<MenuModeButton mode={"protect"} style={{backgroundColor:"#662266"}}>{"Protect"}</MenuModeButton>
						</mainContext.Provider>
					</>
					: states["feature"] === "dungeon" ? <>
						<RsDisplay>{`Floor: ${states["dungeon"]["floor"]["level"]}`}</RsDisplay>
						<mainContext.Provider value={{mode: states["dungeonMode"], setMode: states.setDungeonMode}}>
							<MenuModeButton mode={"dungeon"}>{"Dungeon"}</MenuModeButton>
							<MenuModeButton mode={"inventory"}>{"Inventory"}</MenuModeButton>
						</mainContext.Provider>
					</>
					: states["feature"] === "stars" ? <>
						<RsDisplay>{`Star Power: ${func.floor(global.stat("starPower"), 0)}`}</RsDisplay>
						{global["states"]["starsScreen"] === -1 ?
							global["values"]["starColors"].map((entry, index) => {
								let resName = `${entry}Power`;
								let res = global["resources"][resName];
								return <RsDisplay key={index}>{`${entry} Power: ${func.floor(res.amount, 0)}`}</RsDisplay>
							})
						:
							(() => {
								let color = global["states"]["stars"]["main"][global["states"]["starsScreen"]].color;
								let res = global["resources"][`${color}Power`];
								console.log(color, res);
								return <RsDisplay>{`${color} Power: ${func.floor(res.amount, 0)}`}</RsDisplay>
							})()
						}
					</>
					:
						<></>}
					</dragContext.Provider>
				</div>
				<div id="rightMenu">
					{states["feature"] === "shop" ? <div className="display">
						<mainContext.Provider value={{buyAmount:states["shopBuyAmount"]}}>
							<div className="shopContainer">
								{states["shop"].order.map((entry, index) => (
									<ShopUpgradeButton key={entry["id"]} upgrade={entry} />
								))}
							</div>
						</mainContext.Provider>
					</div>
					: states["feature"] === "energizer" ? <div className="display">
						<mainContext.Provider value={{energizer:states["energizer"], setEnergizer:states.setEnergizer, draggable:draggable, setDraggable:setDraggable}}>
							{states.energizerMode === "energizer" ? 
								<div className="energizerContainer">
									{[...Array(global["energizer"]["Y"])].map((entry, index) => (
										<div className='energizerRow' key={index}>
											{[...Array(global["energizer"]["X"])].map((entry2, index2) => {const i=states["energizer"].gridToCoords(index2, index);
												return <EnergizerTile key={index2} id={i} />
											})}
										</div>
									))}
								</div>
							:states.energizerMode === "modules" ?
								Object.entries(states["energizer"]["allModules"]).map(([index, entry]) => (
									/*<EnergizerElem key={entry["id"]} item={entry}></EnergizerElem>*/
									<div key={entry["id"]} style={{display:"flex", height:"20vh"}}>
										<FakeEnergizerTile key={index}>{entry.name}</FakeEnergizerTile>
										<div style={{display:"flex", height:"10vh"}}>
											{[...Array(Math.ceil(entry.currModifiers/2))].map((entry2, index2) => (
												<div key={index2} style={{flexDirection:"column"}}>
												{[...Array(Math.min(entry.currModifiers-(index2*2), 2))].map((entry3, index3) => (
													<EnergizerModifier key={index3} id={(index2*2+index3)} item={entry} />
												))}
												</div>
											))}
										</div>
										<div>{"Amount:" + (entry.max === -1 ? entry.amount : entry.amount + "/" + entry.max)}</div>
										<div>{` Power: ${Math.round(entry.power*100)}%`}</div>
									</div>
								))
							:
								<></>
							}
						</mainContext.Provider>
					</div>
					: states["feature"] === "garden" ? <div className="display">
						<mainContext.Provider value={{draggable:draggable, setDraggable:setDraggable, garden:states["garden"], setGarden:states.setGarden, gardenMode:states["gardenMode"]}}>
							{states["gardenScreen"] === "garden" ? <div className="gardenContainer">
								{[...Array(states["garden"]["screens"][0]["Y"])].map((entry, index) => (
									<div className='gardenRow' key={index}>
										{[...Array(states["garden"]["screens"][0]["X"])].map((entry2, index2) => {
											let coords = states["garden"]["screens"][0].gridToCoords(index2, index);
											return <GardenTile key={index2} coords={{screen:0, X:index2, Y:index, coords:coords}} tile={states["garden"]["screens"][0]["grid"][coords]} />
										})}
									</div>
								))}
							</div>
							: states["gardenScreen"] === "storage" ? <div className="gardenStorage gardenContainer">
								{[...Array(states["garden"]["screens"][1]["Y"])].map((entry, index) => (
									<div className='gardenRow' key={index}>
										{[...Array(states["garden"]["screens"][1]["X"])].map((entry2, index2) => {
											let coords = states["garden"]["screens"][1].gridToCoords(index2, index);
											return <GardenTile key={index2} coords={{screen:1, X:index2, Y:index, coords:coords}} tile={states["garden"]["screens"][1]["grid"][coords]} />
										})}
									</div>
								))}
							</div>
							: states["gardenScreen"] === "compendium" ? 
							<div className="full" style={{display:"flex", flexDirection:"column"}}
							onMouseOver={(e) => handleCompendium("hover", e)} onMouseUp={(e) => handleCompendium("release", e)}>
								<mainContext.Provider value={{garden:states["garden"], compendium:states["compendium"], setCompendium:states.setCompendium, compendiumPlant:states["compendiumPlant"], setCompendiumPlant:states.setCompendiumPlant}}>
									<RsDisplay>
										{`Knowledge: ${Math.floor(states["resources"]["knowledge"]["amount"])}`}
									</RsDisplay>
									<div className="" style={{}}>
										<div className="" style={{paddingTop:5}}>{"Drag unknown plants here to discover them."}</div>
									</div>
									<div className={"full"} style={{display:"flex"}}>
										<div className="compendiumPlantList scroll1">
											{states["compendium"]["plantOrder"].map((entry2, index2) => (
												<React.Fragment key={entry2.id}>
													<CompendiumPlantList plant={entry2} />
												</React.Fragment>
											))}
										</div>
										<div className="compendiumPlantDisplay full">
											<div style={{display:"flex", justifyContent:"flex-start"}}>
												<div style={{display:"flex", flexDirection:"column"}}>
													<CompendiumTile />
													<div className={"centerText"}>{states["compendiumPlant"] ? states["compendium"]["plants"][states["compendiumPlant"]].name : ""}</div>
												</div>
												<div style={{display:"flex", flexDirection:"column"}}>
													<CompendiumKnowledgeBar />
													<div style={{display:"flex", justifyContent:"space-between"}}>
														<AddKnowledgeButton amount={1}>{"add 1 knowledge"}</AddKnowledgeButton>
														<AddKnowledgeButton amount={"max"}>{"add all knowledge"}</AddKnowledgeButton>
													</div>
												</div>
											</div>
											<div className="full">
												<CompendiumStats />
											</div>
										</div>
									</div>
								</mainContext.Provider>
							</div>
							: false ? <div id="compendiumSelectionScreen" className="gardenContainer" style={{ flexDirection: 'row' }}>
								<div id="compendiumPlantDisplay" className="compendiumLeft">
									<div id="compendiumSelectedTile" className="compendiumTile V2">
										<div className="GTBackground" />
										<div className="GTInner" />
										<div className="GTInnerBackground noPointer" />
										<div className="GTPlant noPointer" />
										<div className="GTText" />
									</div>
									<hr />
									<div className="progressBar">
										<div className="progressBarInner">
											<span className="textSmall">0%</span>
										</div>
									</div>
									<span id="compendiumKnowledgeText" className="textSmall">0</span>
									<hr />
									<div id="compendiumAddAllKnowledge" className="compendiumKnowledgeButton">Add all (0) Knowledge</div>
									<div id="compendiumAdd1Knowledge" className="compendiumKnowledgeButton">Add 1 Knowledge</div>
								</div>
								<div id="compendiumPlantDescription" className="compendiumRight" />
							</div>
							: <></>}
						</mainContext.Provider>
					</div>
					: states["feature"] === "dungeon" ? <div className="display">
						<mainContext.Provider value={{draggable:draggable, setDraggable:setDraggable, dungeon:states["dungeon"], setDungeon:states.setDungeon}}>
							{states["dungeonMode"] === "dungeon" ?
								states["dungeon"]["inCombat"] ? <div className="combatDisplay">
									<WeaponDiamond style={{width:"7%", top:"25%", left:"5%", transform:"translate(calc((1% * sqrt(2) - 1%) * 50), -50%) rotate(45deg)"}}>
										{[...Array(states.dungeon.weaponCount)].map((entry, index) => {
											const player = states["dungeon"]["inCombat"]["player"];
											const icon = player["equipment"][`weapon${index}`] ? player["equipment"][`weapon${index}`]["icon"] : "";
											const weaponId = player["activeWeapon"];
											return (
												<React.Fragment key={index}>
													<div style={{border:"1px solid black", background:(weaponId === index ? "#666699" : "")}}>
														<span>{icon}</span>
													</div>
												</React.Fragment>)
											//left:invTileSize*(Math.sqrt(2)-1), top:invTileSize*(Math.sqrt(2)-1)
										})}
									</WeaponDiamond>
									
									{/*(()=>{})()*/}
									<PlayerPanel unit={states["dungeon"]["inCombat"]["player"]} healthColor={"#AA0000"} stressColor={"#223322"} />
									<EnemyPanel unit={states["dungeon"]["inCombat"]["enemy"]} healthColor={"#AA0000"} stressColor={"#223322"} />
								</div>
								: <div className="dungeonScreen">
									{[...Array(states.dungeon.floor.Y)].map((entry, index) => (
										<div className='dungeonRow' key={index}>
											{[...Array(states.dungeon.floor.X)].map((entry2, index2) => {const i=index*states.dungeon.floor.X+index2;
												return <DungeonTile key={index2} dungeon={states.dungeon} tile={states.dungeon.floor.tiles[i]} />
											})}
										</div>
									))}
								</div>
							: states["dungeonMode"] === "inventory" ?  <>
								<mainContext.Provider value={{draggable:draggable, setDraggable:setDraggable, invTileSize:invTileSize, invShowMode:states["invShowMode"], invRarityMode:states["invRarityMode"], dungeon:states["dungeon"], setDungeon:states.setDungeon}}>
									<><div className="invUpper" style={{height:"47.5%", ...states["invScreen"][1], transition:`all 100ms ease-in-out`}}>
										<div className="equipment" style={{backgroundColor: '#555555'}}>
											<WeaponDiamond style={{width:(invTileSize*2), height:(invTileSize*2)}}>
											{[...Array(states.dungeon.weaponCount)].map((entry, index) => (
												<React.Fragment key={index}>
													<InventoryEquipSlot type="weapon" id={`weapon${index}`} />
												</React.Fragment>
												//left:invTileSize*(Math.sqrt(2)-1), top:invTileSize*(Math.sqrt(2)-1)
											))}
											</WeaponDiamond>
											{/*<div className="weapons">
												{[...Array(states.dungeon.weaponCount)].map((entry, index) => (
													<React.Fragment key={index}>
													<InventoryEquipSlot style={index === 1 ? {float:"none"} : {}} type="weapon" id={`weapon${index}`} /></React.Fragment>
												))}
											</div>*/}
											<div className="armor">
												<InventoryEquipSlot type="head" id="head" />
												<InventoryEquipSlot type="chest" id="chest" />
												<InventoryEquipSlot type="arms" id="arms" />
												<InventoryEquipSlot type="legs" id="legs" />
											</div>
											<div className="trinkets">
												{[...Array(states.dungeon.trinketCount)].map((entry, index) => (
													<React.Fragment key={index}>
														<InventoryEquipSlot type="trinket" id={`trinket${index}`} />
													</React.Fragment>
												))}
											</div>
										</div>
										<div style={{backgroundColor: '#555555', display:"flex", overflowX:"scroll"}}>
											<ForgeDisplay type="main" />
											{global["dungeon"]["rarityOrder"].map((entry, index) => (
												<ForgeDisplay key={entry} type={entry} />
											))}
											{/*<div className="forgeEquipment">
												<div id="forgeEquipmentIcon" className="forgeEquipmentIcon" />
												<div className="forgeEquipmentText" />
											</div>
											<div id="forgeDisplay" class="forgeDisplay">
												<div id="forgeInner">
													<div class='forgeEquipment'>
														<div id='forgeEquipmentIcon' class='forgeEquipmentIcon'></div>
														<div class='forgeEquipmentText'></div>
													</div>
													<!--<div class="forgeInner" tile='[common]'>
														<div id="forgeEquipmentText" class="forgeEquipmentText"></div>
													</div>-->
												</div>
											</div>*/}
										</div>
									</div></>
									<div className="equipOptions" style={{height:"5%"}}>
										<EquipOptionButton onClick={() => (states.setInvScreen({type:(states["invScreen"][0] === 0 ? "inventory" : "compendium")}))}>{states["invScreen"][0] ? "To compendium ->" : "<- To inventory"}</EquipOptionButton>
										<EquipOptionButton>Show combat equipment</EquipOptionButton>
										<EquipOptionButton onClick={() => (states.setInvShowMode({type:states["invShowMode"]}))}>{
											states["invShowMode"] === 0 ? 
												"Showing default stats"
											:
												"Showing maximum stats"
										}</EquipOptionButton>
										<EquipOptionButton onClick={() => (states.setInvRarityMode({type:states["invRarityMode"]}))}>{
											states["invRarityMode"] === -1 ? 
												"Showing all rarities"
											:
												`Showing ${states["dungeon"]["allRarities"][states["dungeon"]["rarityOrder"][states["invRarityMode"]]].name} rarity`
										}</EquipOptionButton>
									</div>
									<div className="inventory" style={{height:"47.5%"}}>
										{[...Array(global.values.invH)].map((entry, index) => (
											<div key={index}>
												{[...Array(global.values.invW)].map((entry2, index2) => {
													const i=index*global.values.invW+index2;
													const dungeon = states["dungeon"];
													const id = dungeon["equipOrder"][i];
													return (<React.Fragment key={index2}>
														<InventorySlot id={id} item={dungeon["allEquipment"][id]} />
													</React.Fragment>)
												})}
											</div>
										))}
									</div>
								</mainContext.Provider>
							</>
							: <></>}
						</mainContext.Provider>
					</div>
					: states.feature === "stars" ?
						<div className="display">
							{global["states"]["starsScreen"] === -1 ?
								<div className="mainStars">
									<CenterStar />
									{global["states"]["starsAscension"] ? <CenterStarLine /> : <></>}
									{Object.entries(states["stars"]["main"]).map(([index, entry]) => (
										<MainStar key={index} star={entry} onClick={() => ascend(entry)}/>
									))}
								</div>
							: global["states"]["starsScreen"] > -1 ?
								<mainContext.Provider value={{draggable:draggable, setDraggable:setDraggable}}>
									<div ref={starBackgroundContainerRef} style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"move"}} onMouseDown={(e) => global["states"].setStarsDrag(true)}>
										
										{/*<img src={img["starBackground"]} style={{width:100, height:100}}/>*/}
										{<div className="starsBack" style={{position:"absolute", top:0, left:0, zIndex:3, background:"#888888", border:"1px solid black", margin:4, padding:"10px 20px", cursor:"pointer"}} onClick={(e) => global["states"].setStarsScreen(-1)}>Back</div>}
										<div style={{width:0, height:0, position:"relative"}}>
											{<div ref={node => {starBackgroundRef.current = node
												starBackgroundCallback(node)}} className="starBackground">
												{<div style={{position:"absolute", left:"50%", top:"50%", background:"white", color:"black"}}></div>}
											</div>}
											{/*<Canvas className="starBackgroundCanvas" propRef={starBackgroundRef} draw={{img:"starBackground",W:"100%",H:"100%",iW:10,iH:10}} />*/}
											<div ref={node =>{starUpgradeRef.current = node
												starUpgradesCallback(node)}} className="starUpgrades">
												{Object.entries(global["stars"]["upgrades"][global["states"]["starsScreen"]]).map(([index, entry]) =>{
													return (<StarsUpgrade key={index} upgrade={entry} />)
												})}
												{Object.entries(global["stars"]["connects"][global["states"]["starsScreen"]]).map(([index, entry]) =>{
													return (entry.map((entry2, index2) =>{
														let upgrades = global["stars"]["upgrades"][global["states"]["starsScreen"]];
														/*let Xdist = upgrades[entry2[0]]["X"] - upgrades[index]["X"];
														let Ydist = upgrades[entry2[0]]["Y"] - upgrades[index]["Y"];
														let length = (Math.abs(Xdist)**2 + Math.abs(Ydist)**2)**0.5;
														let rot = (Xdist < 0 ? -180 : 0);
														if(Ydist){
															rot += Math.atan(Ydist/Xdist) * (180/Math.PI)
														}*/
														if(global["stars"]["upgrades"][global["states"]["starsScreen"]][index].visible && global["stars"]["upgrades"][global["states"]["starsScreen"]][entry2[0]].visible){
															return <StarUpgradeLine key={`${index}-${index2}`} coords={{startX:upgrades[index]["X"], startY:upgrades[index]["Y"], endX:upgrades[entry2[0]]["X"], endY:upgrades[entry2[0]]["Y"]}} style={{background:entry2[1]}}/>
														}
														else{
															return <React.Fragment key={`${index}-${index2}`}/>;
														}
														
													}))
												})}
											</div>
										</div>
									</div>
								</mainContext.Provider>
							:
								<></>
							}
						</div>
					:
						<></>}
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
			</div>
			<dragContext.Provider value={{draggable:draggable, setDraggable:setDraggable}}>
				<DragElem ref={dragRef}></DragElem>
			</dragContext.Provider>
			<Tooltip id="my-tooltip" opacity={1} disableStyleInjection={false} style={{zIndex:9999}}/>
		</>
		);
}

export default App;
