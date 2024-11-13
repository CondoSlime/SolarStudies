
import {global} from '../App.js';
import * as func from './functions.js';
import {loc, ts} from './functions.js';
ts()
export class resources{

}

export class resource{
    constructor(id, name=id, amount=0) {
        this.id = id; this.name = name; this.amount = amount;
    }
	add(amount) {
		this.amount += amount
	}
	sub(amount) {
		this.amount -= amount
	}
	set(amount) {
		this.amount = amount
	}
}

export class statList{
	constructor(){
		this.list = {};
		this.stats = {total:{}, combine:{}};
		this.ignoreId = {};
		this.ignoreName = {};
		for(let [index] of Object.entries(global.statTemplate)){
			this.stats["total"][index] = {add:0, mult:1, total:0}
		}
		//list[/*name identifier of stat*/][/*id identifier of stat (additive with other ID's)*/][/*"add" or "mult"*/][/*stat name (tickPower, armor, etc)*/][/*"base", "extra" or "mult"*/]
		//stats[/*stat name (tickPower, armor, etc)*/][/*add, mult or total*/]
		//how stats work:
		//for each ID, if there's an base stat present. Base, extra and mult are added together, otherwise the stat is always 0 (or 1 for multiplicative stats)
		//for each name, all stats of all IDs are added together (after calculating the stats for the associated ID)
		//mult stats from different names are compounding with each other, mult stats from the same name but a different ID only apply to itself and are thus not multiplicative with different ID stats.
		//combining multiple stats into one belonging to the same stat/id is optionally multiplicative.
		//stats IDs or names can have an ignore tag which makes them unable to be calculated into the stats object.
		//name ignore takes priority over ID ignore.
	}
	set(name, id, stats=false, mods={}, statMods={}){ //sets or alters a stat in the statlist. Only affects stats that are present in the stats value.
		//stats: if false, loops through all stats and applies the associated modifiers. If stats is set, loops just through the values set in that object instead.
		//mods:
		// set: sets the existing stats to new stats from the "stats" value.
		// combine: combines the current stat with the new one instead of overwriting the stat.
		// combineAdd: combines the stats. Adds the second value to a property of the first value. (["base", stat(6)])
		// combineMult: same as combineAdd but multiplies instead.
		// stacks: multiply the base by the specified value.
		// func: same as stacks. But is set to a function, so the result can be different each time.
		// extra: multiply the total multiplier by the specified value.
		// highest: set the result to the higher of the two numbers. (can mix/match. example: select the base of number 1 and the mult of number 2)
		// nototal: does not update total stat of result
		// view: does not update stat. Just returns the value of what the number looks like after the modifiers.
		//statMods are modifiers that are only applied to the values in the stats value.
		this.ignoreId[name] = this.ignoreId[name] || {}; //set ignore stat to be present.
		this.list[name] = this.list[name] || {};
		stats = stats ? stats : this.list[name][id];
		let modCopy = func.objClone(mods);
		const loop = (base={}, stats) =>{
			let result = base;
			if(typeof(stats) === "object"){
				for(let [index, entry] of Object.entries(stats)){
					if(typeof(entry) !== "object"){
						let newStat = statList.modifyStat(entry, statMods);
						//new stat(entry, "base")).modify({...statMods, view:true}); //view:true is important, as otherwise it will change referred values.
						let canChange = false;
						for(let index of ["set", "add", "mult", "max"]){
							if(mods[index] === true){
								modCopy[index] = newStat;
								canChange = true;
							}
						}
						//let canChange = ["set", "add", "mult", "max"].some((index) => mods.includes(index) && );
						if(!canChange){ //default behavior is setting the old stat to the new one.
							modCopy["set"] = newStat;
						}
						result[index] = statList.modifyStat(result[index] || 0, modCopy);
					}
					else{
						result[index] = loop(result[index] || {}, entry);
					}
				}
			}
			return result;
		}
		this.list[name][id] = loop(this.list[name][id], stats);
		return this.list[name][id];
	}
	static modifyStat(stat, mods={}){
		let result;
		if(mods.set !== undefined){
			result = mods.set;
		}
		else{
			result = stat;
		}
		if(mods.add !== undefined){
			if(typeof(mods.add) === "function"){
				result += mods.add();
			}
			else{
				result += mods.add;
			}
		}
		if(mods.mult !== undefined){
			if(typeof(mods.mult) === "function"){
				result *= mods.mult();
			}
			else{
				result *= mods.mult;
			}
		}
		if(mods.max !== undefined){
			result = Math.max(result, mods.max);
			//result["multExtra"] = Math.max(result["multExtra"], mods.highest.multExtra);
		}
		/*if(!isNaN(mods.stacks)){
			result *= mods.stacks;
		}*/
		return result;
	}
	clear(name){
		if(name){
			this.list[name]={};
		}
		else{
			this.list = {};
		}
	}
	setIgnoreName(name, ignore){ //sets the ignore value of a name. Ignored stats are still present but not calculated in the total. Leave ignore empty to flip the value.
		this.ignoreName[name] = typeof ignore === "undefined" ? !this.ignoreName[name] : ignore;
		return this.ignoreName[name];
	}
	setIgnoreId(name, id, ignore){ //sets the ignore value of an ID. Ignored stats are still present but not calculated in the total. Leave ignore empty to flip the value.
		this.ignoreId[name] = this.ignoreId[name] || {};
		this.ignoreId[name][id] = typeof ignore === "undefined" ? !this.ignoreId[name][id] : ignore;
		return this.ignoreId[name][id];
	}
	get(name, id){
		return this.list[name] && this.list[name][id] ? this.list[name][id] : {};
	}
	stat(stat){
		return this.stats["total"][stat]["total"];
	}
	update(...names){ //setting stats is disconnected from calculation to allow calculating stats without actually making them actual too.
		//names, [array]: A list of stat names to include. Leave empty to include all.
		this.stats = this.calc(...names);
	}
	calc(...names){
		//names, [array]: A list of stat names to include. Leave empty to include all.
		//let result = {};
		//combine the stats for each id set for each stat into one value (nameResult);

		//this.list[name][id][index][index2]
		//combine ID stats of each name into one.
		let result = func.objClone(this.stats);
		for(let index of Object.keys(global.statTemplate)){ //index = tickPower, armor, etc
			result["total"][index] = {};
			for(let index2 of global.values.effects){ //index2 = add or mult
				if(index2 === "base"){
					result["total"][index][index2] = 0;
				}
				else if(index2 === "mult"){
					result["total"][index][index2] = 1;
				}
			}
		}
		const loop = (base={}, stats) =>{
			let result = base;
			for(let [index, entry] of Object.entries(stats)){
				/*if(entry instanceof stat){
					result[index] = (result[index] || new stat()).modify({combineAdd:["base", entry]});
				}
				else */
				if(typeof(entry) === "object"){
					result[index] = loop(result[index] || {}, entry);
				}
				else{
					result[index] = statList.modifyStat(result[index] || 0, {add:entry});
					//throw Error("Non-Stat found", stats);
				}
			}
			return result;
		}
		//["add"]["test"]["tickPower"] => ["tickpower"]["add"]["test"]
		//turn last index into first index. Set value to total stat of last index.
		/*{
			base:{
				test:{
					tickPower:stat,
					armor:stat
				}
			},
			mult:{
				test:{
					tickPower:stat
				}
			}
		}*/
		/*{
			tickPower:{
				base:{
					test:stat
				},
				mult:{
					test:stat
				}
			},
			armor:{
				mult:{
					test:stat
				}
			}
		}*/
		
		const loop2 = (stats, result={}, basePath=[], nested=0) =>{
			for(let [index, entry] of Object.entries(stats)){
				/*if(entry instanceof stat){
					if(nested){
						result[index] = result[index] || {};
						let innerPath = result[index];
						for(let i=0;i<nested-1;i++){
							innerPath = innerPath[basePath[i]] = innerPath[basePath[i]] || {};
						}
						innerPath[basePath[nested-1]] = entry;
					}
					else{
						result[index] = entry;
					}
					//result[index] = (result[index] || new stat()).combine(entry);
				}
				else */
				if(typeof(entry) === "object"){
					let copy = [...basePath];
					copy[nested] = index;
					result = loop2(entry, result, copy, nested+1);
				}
				else{
					if(nested){
						result[index] = result[index] || {};
						let innerPath = result[index];
						for(let i=0;i<nested-1;i++){
							innerPath = innerPath[basePath[i]] = innerPath[basePath[i]] || {};
						}
						innerPath[basePath[nested-1]] = entry;
					}
					else{
						result[index] = entry;
					}
				}
			}
			return result;
		}
		/*nameresult = 
		add: 
			equipmentMax:1
			gardenTile: 3
			tickPower: 3
		mult: 
			tickPower: 0.04
		*/
		for(let index of names.length ? names : Object.keys(this.list)){ //index = list name ids
			if(this.ignoreName[index] || !this.list[index]){
				continue;
			}
			let nameResult = {};
			for(let [index2, entry2] of Object.entries(this.list[index])){ //index2 = list ids
				if(this.ignoreId && this.ignoreId === index2){
					continue;
				}
				nameResult = loop(nameResult, entry2);
			}
			/*result[index] = {};
			for(let [index2, entry2] of Object.entries(nameResult)){
				for(let [index3, entry3] of Object.entries(entry2)){ //index3 = tickPower, armor, etc
					result[index][index3] = result[index][index3] || {};
					result[index][index3][index2] = entry3["total"] || 0;
					if(result["total"][index3]){
						result["total"][index3][index2] += (entry3["total"] || 0);
					}
				}
			}*/
			result[index] = loop2(nameResult);
			result["combine"] = loop(result["combine"], nameResult);
			for(let [index2, entry2] of Object.entries(result[index])){ //index2 = tickPower, armor, etc
				if(result["total"][index2]){
					if(entry2["base"]){
						result["total"][index2]["base"] += entry2["base"];
					}
					if(entry2["mult"]){
						result["total"][index2]["mult"] += entry2["mult"];
					}
				}
					/*for(let [index3, entry3] of Object.entries(entry2["base"])){ //index3 = add, mult
						if(result["total"][index2] && result["total"][index2][index3] !== undefined){
							result["total"][index2][index3] += (entry3["total"] || 0);
						}
					}
				}*/
			}
		}
		//combine all stats into a total value.
		for(let [index, entry] of Object.entries(result["total"])){ //index = tickPower, armor, etc
			result["total"][index]["total"] = entry["base"] * entry["mult"];
		}
		return result;
	}
}

export class shop {
    constructor(){
        this.upgrades = {}; this.order = [];
    }
	add(upgrade) { //upgrade = new classes.upgrade()
		this["upgrades"][upgrade["id"]] = upgrade;
		this["order"].push(upgrade);
	}
	find (id) { //find a shop upgrade based on id, returns order if the id is a number.
		if (this["upgrades"].includes(id)) {
			return this["upgrades"][id]
		}
		else if (this["order"][id]) {
			return this["order"][id]
		}
		else {
			return false
		}
	}
}

export class upgrade{
    constructor(id, name, descr, price, type="shop", cap=-1, stats={}, unlock=()=>(true), visible=()=>(true)){
        this.id = id; this.name = name; this.descr = descr; this.type=type; this.price = price; this.bought=0; this.cap = cap; this.stats = stats;
        this.unlockCondition = unlock;
		this.visibleCondition = visible;
        this.unlocked = false;
        this.visible = false;
        this.capped = () => (this.bought >= this.cap && this.cap !== -1);
		this.stats = stats;
    }
	attemptUnlock() {
		if(!this.unlocked || !this.visible){
			if(this.type === "stars"){ //only for star upgrades
				this["unlocked"] = this["unlocked"] || global["debug"]["starsAllUnlocked"] || this.unlockCondition();
				this["visible"] = this["visible"] || global["debug"]["starsAllUnlocked"] || this.visibleCondition();
				return this["visible"] + (this["unlocked"]*2) //returns 0 if not visible/unlocked, 1 if ["visible"], 2 if unlocked, 3 if both
			}
			else if(this.type === "shop"){
				this["unlocked"] = this["unlocked"] || global["debug"]["shopAllUnlocked"] || this.unlockCondition();
				this["visible"] = this["visible"] || global["debug"]["shopAllUnlocked"] || this.visibleCondition();
				return this["visible"] + (this["unlocked"]*2) //returns 0 if not visible/unlocked, 1 if visible, 2 if unlocked, 3 if both
			}
		}
	}
	getPrice(amount=1, start=undefined, rounded=false, ignoreRes=false, test=false) {
		//global resources, BNClass
		/*returns the price for purchasing an upgrade an amount of times equal to 'amount'
		amount can be a number, "cap" or "max"
		can return a higher number than you're able to afford unless amount contains "max" in which case it picks the highest amount you can afford with current resources.
		price caps out if attempting to purchase above the cap (this["cap"])
		start contains the amount of times an upgrade has been purchased. Higher purchase means higher price scaling and lower amount left to buy if there's a cap.
		upgrades can have multiple prices. You need all resources at the same time to successfully purchase. Having a lower amount of one resources lowers the amount of upgrades you can purchase.
		*/
		if(!start && isNaN(start)){
			start = this.bought;
		}
        let invested = 0;
        if (start >= 1) { //retrieve the invested resources of all bought levels of the upgrade.
            invested = this.getPrice(start, 0, undefined, true)["price"];
        }
        let result = {};
        if (typeof(amount) === "string" || (this["cap"] !== -1 && amount + start > this["cap"])) { //purchase as many of an upgrade as possible
            amount = this["cap"];
            if(!ignoreRes || this["cap"] === -1){
                for (const [index, entry] of Object.entries(this["price"])) {
                    //let entry = this["price"][index].toString(); //indexOf does not work on ints
                    let resource = func.deepClone(global["resources"][index]["amount"]) //get current required resource amount
                    if (invested) {
                        resource += invested[index] //add invested resources to current amount to simulate already having the previous upgrades bought
                    }
                    //[price:20, "+5"]
                    //bought = 8
                    //20*8+(5*36) = 340
                    //8+7+6+5+4+3+2+1 = 36
                    let priceVar;
                    let currAmount;
                    if (entry.toString().includes("+")) {
                        //a price let looks like this ["10+5"] this means the price starts at 10 base and increases by a flat amount of 5 for every upgrade purchased
                        priceVar = entry.split("+").map(Number);
                        //priceVar = [10, 1];
                        //resource = 0;
                        currAmount = (Math.pow(Math.pow(priceVar[1] - 2*priceVar[0], 2) + 8*priceVar[1]*resource, 0.5) - (2*priceVar[0]) + priceVar[1]) / (2*priceVar[1]);
                        //currAmount = BNClass.solve("{1}-(2*{2})^2+(8*{1}*{3})^0.5-(2*{2})+{1}/(2*{1})", priceVar[2], priceVar[1], resource).n
                    }
                    else if (entry.toString().includes("*")) {
                        //["10*1.2"] 10 start price * 1.2 for every purchase
                        priceVar = entry.split("*").map(Number);
                        //return BN(log(this.n) / log(BN(number).n))
                        currAmount = Math.log((priceVar[1]-1) *resource/priceVar[0] +1) / Math.log(priceVar[1]);
                        //currAmount = BNClass.solve("{1}-1*{2}/{3}+1", priceVar[2], resource, priceVar[1]).BNbaseLog(priceVar[2]).n
                    }
                    else if (entry.toString().includes("^")) {
                        console.log("power for prices not yet implemented");
                        //TODO
                    }
                    else { //static price
                        currAmount = resource / entry;
                    }
                    amount = (amount === -1 ? currAmount : Math.min(amount, currAmount));
                }
            }
            amount -= start
        }
        amount = Math.floor(amount);
        if (rounded && (this["cap"] > amount + start || this["cap"] === -1)) {
            let firstTwo = parseInt(Math.floor(amount + start).toString().slice(0, 2));
            if(firstTwo > 0){
                if (firstTwo < 12) {
    
                }
                else if (firstTwo < 24) {
                    firstTwo -= firstTwo % 2;
                }
                else if (firstTwo < 40) {
                    firstTwo -= firstTwo % 5;
                }
                else {
                    firstTwo -= firstTwo % 10;
                }
                let log = Math.max(Math.floor(Math.log10(amount)-1), 0);
                amount = firstTwo * Math.pow(10, log);
                amount = Math.max(amount-start, 0);
            }
        }
        if (amount > 0) { //calcute price
            let max = amount + start;
            for (const [index, entry] of Object.entries(this["price"])) {
                result[index] = 0;
                let priceVar;
                if (entry.toString().includes("+")) {
                    priceVar = entry.split("+").map(Number);
                    result[index] += priceVar[0]*max + (priceVar[1]*func.triangle(max-1));
                }
                else if (entry.toString().includes("*")) {
                    priceVar = entry.split("*").map(Number);
                    result[index] += priceVar[0]* (Math.pow(priceVar[1], max) -1) / (priceVar[1]-1);
                    //result[index].n += BNClass.solve("{1}*({2}^({3}+{4})-1)/({2}-1)", priceVar[1], priceVar[2], amount, start).n
                }
                else if (entry.toString().includes("^")) {
                    console.log("power for prices not yet implemented");
                    //TODO
                }
                else {
                    result[index] += entry * max;
                }
                if (invested && index in invested) {
                    result[index] -= invested[index]
                }
                result[index] = Math.round(result[index]);
            }
        }
        else {
            for (let [index] of Object.entries(this["price"])) {
                result[index] = 0;
            }
        }
		//msgbox amount.gt(0) ", " string(amount)
		//(price * (-1 + mult) * (-1 + mult^(1 + amount)) + mult * (1 - (1 + amountBNClass) * mult**amount + amount * mult**(1 + amount)) * increase)/(-1 + mult)**2
		//(a (-1 + y) (-1 + y^(1 + n)) + y (1 - (1 + n) y^n + n y^(1 + n)) z)/(-1 + y)^2
		return {amount:amount, price:result}
	}
	canPurchase(amount, test=false) { //returns true if a specified amount of an upgrade can be purchased with current resources. Returns false if it's too expensive or goes higher than the cap.
		//does not work with "round" or "max"
		if (this["bought"] + amount > this["cap"] && this["cap"] !== -1){
			return false //attempt to purchase more than the cap
		}
		let max = this.getPrice("max", this["bought"], undefined, test);
		if (max["amount"] < amount) {
			return false //not enough resources to purchase the specified amount
		}
		return true
	}
	/*tryPurchase(amount, test=false) { //actually attempts to purchase an upgrade. Subtracting resources and increasing amount bought. Accepts a number, the string "max" or "round"
		//returns the amount of levels purchased.
		//global resources, BNClass
		let price;
		let canBuy = false;
		if (amount > 0) {
			if (this["cap"] !== -1 && this["bought"] + amount > this["cap"]) {
				amount = this["cap"] - this["bought"] //lower amount purchased to the cap if attempting to purchase more than the cap
			}
			if (amount !== 0 && this.canPurchase(amount, test)) {
				price = this.getPrice(amount, this["bought"], undefined, test);
				canBuy = true;
			}
		}
		else if (amount === "max" || amount === "round") {
			price = this.getPrice("max", this["bought"], amount === "round" ? 1 : 0, undefined, test);
			if (amount !== 0 && this.canPurchase(price["amount"], test)) {
				canBuy = true;
			}
		}
		if(canBuy){
			for (const [index, entry] of Object.entries(price["price"])) {
				global["resources"][index].sub(entry)
			}
			this["bought"] += price["amount"];
			return price["amount"];
		}
		return false
	}*/
	addLevel(amount) { //adds levels for free to an upgrade without spending anything. Still can't go above the cap
		if (amount === "max" || (this["cap"] !== -1 && this["bought"] + amount >= this["cap"])) {
			if (this["cap"] === -1) {
				this["bought"] = 9999;
			}
			else {
				this["bought"] = this["cap"];
			}
		}
		else {
			this["bought"] += amount;
			if (this["cap"] !== -1 && this["bought"] >= this["cap"]) {
			}
		}
	}
	description() {
		let descr = "";
		descr += this["name"];
		//descr += "<br>Bought " + this["bought"] + (this["cap"] >= 0 ? " out of " + this["cap"] : "") + " times.";
		descr += "<br>" + this["descr"];
        for (const [index, entry] of Object.entries(this["stats"]["add"])) {
			descr += "<br>" + loc(index) + " + " + entry;
		}
		return descr;
	}
}

export class energizer{
	static sides = 6;
	static sideArr = Array(this.sides).fill(false);
	constructor(X, Y, features){
		this.unlocked = false;
		this.X = X; this.Y = Y; this.allModules = {}; this.moduleOrder = []; this.allModifiers = {}; this.modifierOrder = []; this.grid = []; this.hover = undefined;
		this.features = features;
		this.store = {};
		for(let i=0;i<features.length;i++){
			this.store[features[i]] = 0;
			this.store[`show${features[i]}`] = 0;
		}
		for(let i=0;i<this.X*this.Y;i++){
			this.grid[i] = new this.tile();
		}
	}
	addModule(id, name, args, price, unlock=()=>(true), visible=()=>(true)){
		this["allModules"][id] = new this.module(id, name, args, price, unlock, visible);
		this["moduleOrder"].push(id);
	}
	addModuleUpgrade(id, name, descr, price, cap=-1, stats={}, unlock=()=>(true), visible=()=>(true)){
		this["allModules"][id]["upgrades"].push(new upgrade(id, name, descr, price, "energizer", cap, stats, unlock, visible));
	}
	placeTile(module, coords){
		coords = (typeof(coords) === "number" ? coords : this.gridToCoords(coords["X"], coords["Y"]));
		let selected = module;
		if(typeof(module) === "object"){
			selected = module.id;
		}
		if(this["allModules"][selected]){
			selected = this["allModules"][selected];
		}
		else{
			throw Error("invalid module:", selected);
		}
		//let beam = this["grid"][coords]["beam"];
		if(selected["count"] < selected["max"] || 0 > selected["max"] || this["grid"][coords]["id"] === selected["id"]){
			this["grid"][coords].fill(selected, typeof(module) === "object" ? module : undefined);
			//this["grid"][coords] = this.copyModule(selected.id, typeof(module) === "object" ? module : undefined);
			//this["grid"][coords]["beam"] = beam;
			return true;
		}
		return false;
	}
	swapTile(coords, origin){
		[this["grid"][coords], this["grid"][origin]] = [this["grid"][origin], this["grid"][coords]]; //swap two values one-liner
		[this["grid"][coords]["beam"], this["grid"][origin]["beam"]] = [this["grid"][origin]["beam"], this["grid"][coords]["beam"]]; //beams are not swapped
	}
	addModifier(id, name, effect){
		this["allModifiers"][id] = new this.modifier(id, name, effect);
		this["modifierOrder"].push(id);
	}
	coordsToGrid(i){
		return {X:i % this.X, Y:Math.floor(i/this.X)};
	}
	gridToCoords(X, Y){
		return X + (Y*this.X);
	}
	size(){
		return this.X * this.Y;
	}
	update(){ //keep track how many of each module there is and update effective stats.
		for(const [, entry] of Object.entries(this["allModules"])){
			entry["count"] = 0;
		}
		for(const [, entry] of Object.entries(this["grid"])){
			entry["stats"] = {};
			if(entry["filled"]){
				const module = entry["module"]; //contains the module (class object) that a tile is referring to
				module["count"]++;
				entry["stats"]["power"] = module["basePower"];
				for(const index2 of module["modifiers"]){
					if(index2 && this["allModifiers"][index2]["effect"]){
						for(const [index3, entry3] of Object.entries(this["allModifiers"][index2]["effect"])){
							entry["stats"][index3] = entry["stats"][index3] || 0;
							entry["stats"][index3] += entry3;
						}
					}
				}
			}
		}
	}
	module = class{
		constructor(id, name, args={}, price={}, visible=()=>(true), unlock=()=>(true)){
			if(id === undefined){
				console.log(args);
				throw new Error("No ID given to energizer module.");
			}
			if(args.dir && args.dir.length !== 6){
				console.log(args);
				throw new Error(`Energizer should have ${6} directions, has ${args.dir.length}`);
			}
			this.id = id;
			this.name = (name ?? id);
			this.stopper = (args.stopper ?? true);
			this.noBack = (args.noBack ?? true);
			this.activator = (args.activator ?? false);
			this.dirType = (args.dirType ?? false);
			this.marker = ["cycle"].includes(this.dirType);
			this.markDir = -1;
			this.activate = (args.activate ?? false);
			this.dirCount = (args.dirCount ?? -1);
			this.basePower = (args.power ?? 1);
			this.baseDir = (args.dir ?? func.deepClone(energizer.sideArr));
			this.amount = (args.amount ?? 0);
			this.count = 0;
			this.max = (args.max ?? -1);
			this.maxModifiers = (args.modifiers ?? 6);
			this.currModifiers = (func.random(1, args.modifiers ?? 6));
			this.modifiers = (args.modifiers ?? []);
			this.price = price;
			this.bought = !Object.keys(price).length;
			this.visible = false;
			this.visibleCondition = visible;
			this.unlocked = false;
			this.unlockCondition = unlock;
			this.upgrades = [];
			if(this.marker){
				this.markDir = (args.markDir ?? this.baseDir.findIndex((index) => index));
			}
		}
	}
	tile = class{
		constructor(beam=false, dir=false){
			this.init(beam, dir);
		}
		init(beam=false, dir=false){ //call init to empty a filled tile
			this.module = {};
			this.beam = beam || this.beam || func.deepClone(energizer.sideArr).fill(0);
			this.dir = dir || func.deepClone(energizer.sideArr);
			this.stats = {};
			this.filled = false;
		}
		fill(module, args={}){
			if(typeof(args) !== "object"){
				return new Error("Energizer tile args not set to object");
			}
			if(!module){
				return new Error("Energizer tile ID referrence not an existing module");
			}
			this.module = module;
			this.dir = args.dir ?? module.baseDir;
			this.markDir = args.markDir ?? module.markDir;
			this.beam = args.beam ?? this.beam;
			this.filled = true;
		}
		currentMarkDir(){ //returns current direction as array of booleans
			//example, markDir = 2 = [false, false, true, false, false, false]
			return this.dir.map((entry, index) => index === this.markDir);
		}
		setNextMarkDir(){
			//advances a cycling module to the next direction based on current and active directions
			//example markDir = 2, dir = [true, false, true, false, false, true] dir 3 and 4 is false so markDir is set to 5
			if(this["filled"] && this["markDir"] > -1){
				this["markDir"] = (
					(this["markDir"] + 
						this.dir.slice(this["markDir"]+1)
						.concat(this.dir.slice(0, this["markDir"]+1))
						.findIndex((index, entry) => index)
					)+1 || false
				) % this.dir.length;
			}
		}
		/*setDirection(direction){ //attempts to set the direction array. Does not change if it's invalid. (more directions than allowed on element)
			//direction = array of directions (like [false, true, false, false, true, true]);
			if(this.filled && this.module.dirCount >= this.dirCount(direction) || this.module.dirCount === -1){
				this.dir = direction;
				return true;
			}
			return false;
		}*/
		toggleDirection(direction){ //toggles a direction in the direction array. Does not change if it's invalid. (more directions than allowed on element)
			//direction = integer in direction array to toggle (0-5)
			if(this.dirCount()+(this.dir[direction] ? 0 : 1) >= this.module.dirCount){
				this.dir[direction] = !this.dir[direction];
				return true;
			}
			return false;
		}
		dirCount(direction=false){ //returns amount of active directions as integer
			return (direction || this.dir || this.baseDir).filter(Boolean).length
		}
		resetBeam(){ //reset the beam value to all zeroes
			this.beam = this.beam.fill(0);
		}

	}
	modifier = class{
		constructor(id, name, effect){
			this.id = id;
			this.name = name;
			this.effect = effect;
		}
	}
}

export class garden{
	constructor(X, Y){
		this.allPlants = {}; this.order = []; this.screens = []; this.pools={all:[]};
		this.unlocked = function(){
			return global["shop"]?.["upgrades"]["garden"]["bought"] >= 1
		}
		this["screens"][0] = new garden.screen(this, 0, X, Y, true, false);
		this["screens"][1] = new garden.screen(this, 1, X, Y, false, true);
		/*for(let i=0;i<this["Y"];i++){
			for(let j=0;j<this["X"];j++){
				this["garden"][0].push(new this.tile(this, j, i, 0));
				this["garden"][1].push(new this.tile(this, j, i, 1));
				this["garden"][1][i*this["X"] +j]["unlocked"] = true;
			}
		}*/
	}
	static screen = class screen{
		constructor(ref, id, X, Y, active=false, unlocked=false){
			this.X = X;
			this.Y = Y;
			this.id = id;
			this.ref = ref;
			this.active = active; //set to true if the screen can grow plants and apply their stats.
			this.change = true; //set to true if something changed in this screen and the stats should be recalculated
			this["grid"] = [];
			for(let i=0;i<X*Y;i++){
				this["grid"][i] = new garden.tile(i, id, this);
				this["grid"][i].unlocked = unlocked;
			}
		}
		coordsToGrid(i){
			return {X:i % this.X, Y:Math.floor(i/this.X)};
		}
		gridToCoords(X, Y){
			return X + (Y*this.X);
		}
		square(startX=0, endX=this.X-1, startY=0, endY=this.Y-1) {
			/*
			[[[1,1], [1,2], [1,3]],
			[[2,1], [2,2], [2,3]],
			[[3,1], [3,2], [3,3]]]
			compact= true = [[1,1], [2,1], [3,1], [2,1], [2,2], [2,3], [3,1], [3,2], [3,3]]
			does not return tiles with an X lower than startX or higher than endX, same for startY and endY
			will not return tiles that don't exist, like startX=-1 won't return tiles with X=-1, same with endX higher than gardenCapX
			*/
			let list = [];
			for(let Y=startY;Y<=endY; Y++){
				for(let X=startX;X<=endX; X++){
					let coords = this.gridToCoords(X, Y);
					if (X >= 0 && Y >= 0 && X <= this.X && Y <= this.Y && this["grid"][coords]) { //do not go out of bounds
						list.push(this["grid"][coords]);
					}
				}
			}
			return list
		}
		emptySort(addLocked=0) {
			//return all tiles that do not have a plant
			//Locked tiles are excluded even if empty, set addLocked to true to ignore this.
			let list = [];
			for (const [, entry] of Object.entries(this["grid"])) {
				if (!entry["plant"] && (addLocked || entry["unlocked"])) {
					list.push(entry);
				}
			}
			return list;
		}
		unlockSort() {
			//garden tiles are unlocked in the pattern shown down here. This ensures that you unlock tiles neighboring other tiles first.
			/*
				X:2, Y:4
				[[[1], [2], [5]],
				[[3], [4], [6]],
				[[7], [8], [9]],
				[[10], [11], [12]],
				[[13], [14], [15]]]
				returns [[1,1], [2,1], [1,2], [2,2], [3,1], [3,2], [1,3], [2,3], [3,3], [1,4], [2,4], [3,4], [1,5], [2,5], [3,5]]
			
				X:1, Y:4
				[[[1], [2]],
				[[3], [4]],
				[[5], [6]],
				[[7], [8]],
				[[9], [10]]]
				returns [[1,1], [2,1], [1,2], [2,2], [1,3], [2,3], [1,4], [2,4], [1,5], [2,5]]
			
				X:4, Y:2
				[[[1], [2], [5], [10], [13]],
				[[3], [4], [6], [11], [14]],
				[[7], [8], [9]], [12], [15]]]
				returns [[1,1], [2,1], [1,2], [2,2], [3,1], [3,2], [1,3], [2,3], [3,3], [4,1], [4,2], [4,3], [5,1], [5,2], [5,3]]
			
				X:4, Y:1
				[[[1], [2], [5], [7], [9]],
				[[3], [4], [6], [8], [10]]]
				returns [[1,1], [2,1], [1,2], [2,2], [3,1], [3,2], [4,1], [4,2], [5,1], [5,2]]
			*/
	
			let tiles = this.square();
			let list = [];
			for(let i=0;i<Math.max(this.X, this.Y); i++){
				if (i < this.Y) {
					for(let j=0;j<=Math.min(i, this.X-1); j++){
						list.push(tiles[this.gridToCoords(j, i)]);
					}
				}
				if (i+1 < this.X) {
					for(let j=0;j<=Math.min(i, this.Y-1); j++){
						list.push(tiles[this.gridToCoords(i+1, j)]);
					}
				}
			}
			return list
		}
		/*spawnPlant2(plant, loc, coords){
			this["screens"][loc]["grid"][coords.x][coords.y] = new this.plant();
		}*/
		/*findTile(X, Y, screen="garden", addIndex=0) {
			const result = this[screen][X+(Y*this["X"])];
			if(!result){
				throw Error("There is no garden tile at X:" + X + ", Y:" + Y);
			}
			return (addIndex ? {index:addIndex, entry:result} : result);
		}*/
	}
	static tile = class tile{
		constructor(coords, screen, ref){
			this.unlocked = false; this.plant = false; this.effects = {};
			this.coords = coords;
			this.protected = false;
			this.screen = screen;
			this.ref = ref;
			this.permEffects = {};
			/*for(let index of global.values.effects){
				this.auraEffects[index] = {};
				this.permAuraEffects[index] = {};
				this.totalEffects[index] = {};
			}*/
		}
		/*
		;X = tile position from left to right, starts at 1. Mostly determines tile unlock order and reach of plants with aura effects.
		;Y = tile position from top to bottom, starts at 1. Mostly determines tile unlock order and reach of plants with aura effects.
		;screen = garden screen, 1 for the regular garden, 2+ for storage and extra pages in storage.
		;unlocked = determines whether the tile can be interacted with, if plants there have an effect and if plants can spawn there.
		;plant = false if there is no plant or contains the plant class object if there is a plant in the tile.
		;tempStats = temporary stats added by nearby aura plants.
		; tempstats["add"], stats with the same name as an existing stat on a plant here have the stat and tempstat["add"] added together.
		; tempstats["mult"], stats with the same name as an existing stat on a plant here have the stat multiplied by the tempstat["mult"] value.
		;permStats = permanent stats added by nearby permanent aura plants.
		; same structure as tempStats
		;realStats = plant stats with tempStats added on top it. Has a different format than plant["stats"] and tempStats.
		*/
		/*surroundingTiles(pattern="square", addLocked=false, includeSelf=false){
			let screen = this.ref;
			//returns an array containing tiles that surround this tile. Can not return tiles outside of the garden border (those with an X/Y below 0 or above the max)
			let result = [];
			if(pattern === "square"){
				let tiles = screen.square(true, this.X-1, this.X+1, this.Y-1, this.Y+1);
				for (let i=0;i<tiles.length;i++) {
					let entry = tiles[i];
					if((includeSelf || entry.X !== this.X || entry.Y !== this.Y) && (entry["unlocked"] || addLocked)){
						result.push(entry);
					}
				}
			}
			return result
		}*/
		harvest(){
			let resources = global["resources"];
			if(this["plant"]){
				//let plant = func.deepClone(this["plant"]);
				const harvest = this["effects"]["harvest"];
				this["plant"] = false;
				let result = {}
				if(harvest){
					for(const [index] of Object.entries(harvest)){
						if(resources[index]){
							resources[index].add(harvest[index]["total"]);
							result[index] = harvest[index]["total"];
						}
					}
				}
				return result;
			}
			return false
		}
	}
	static plant = class plant{
		constructor(id, name, icon, BG, color, descr, growth, stats={}) {
			this.id = id; this.name = name; this.icon = icon; this.BG = BG; this.color = color; this.descr = descr; this.maxGrowth = growth;
			this.pools = []; this.growth = 0;
			//["permAura", "aura", ...effects, "harvest"]
			this.stats = stats;
		}
		growMult(){ //plant efficiency reduced if not fully grown.
			let mult = this["growth"] / this["maxGrowth"]
			mult *= (0.5 > mult ? 0.5 : 1); //efficiency halved if below 50% growth
			return mult
		}
		growStage(){ //1 for 0-33%, 2 for 33-66%, 3 for 66-99%, 4 for 100%
			return Math.floor(this.growth / this.maxGrowth * 3) + 1;
		}
		/*clone(){
			return new this.plant(this["id"], this["name"], this["icon"], this["BG"], this["color"], this["descr"], this["maxGrowth"], this["know"], this, this["stats"]);
		}*/
	}
	/*
	;unlocked = whether the garden is available to to user
	;plants = map object containing all existing plants with plant ID as index
	;allCombos = map object containing all existing combos with combo ID as index
	;compendium = map object containing the order that all compendium plants should be as well as a map object containing a boolean of all plants that are present in the compendium
	;garden = array containing all plants in the garden. Left to right, top to bottom
	;storage = array containing a set of arrays containing all plants in the storage. Left to right, top to bottom.
	;pools = map object containing a list of different pools, each containing a list of plants. Pools can be used to spawn specific plants.
	;comboPools = map object containing a list of different pools, each containing a list of spawn conditions of plants. Pools can be used to spawn specific plants.
	*/
	addNewPlant(id, name, icon, BG, color, descr, growth, knowledge, stats={}) {

		/*for(let index of ["harvest", "aura", "permAura"]){
			if(stats[index]){
				stats[index] = stat.fix(stats[index], "base");
			}
		}*/
		let statCheck = [stats["main"],
		...[stats["aura"] ? stats["aura"]["main"] : []],
		...[stats["permAura"] ? stats["permAura"]["main"] : []]];
		for(let [, entry] of Object.entries(statCheck)){
			if(entry){
				entry["mult"] = entry["mult"] || {};
				for(let [index2, entry2] of Object.entries(entry)){
					if(!entry2["mult"] && index2 !== "mult"){
						entry["mult"][index2] = entry2;
						delete entry[index2];
					}
				}
			}
		}
		this["allPlants"][id] = {pools:[]};
		this["allPlants"][id].id = id;
		this["allPlants"][id].name = name;
		this["allPlants"][id].icon = icon;
		this["allPlants"][id].BG = BG;
		this["allPlants"][id].color = color;
		this["allPlants"][id].descr = descr;
		this["allPlants"][id].maxGrowth = growth;
		this["allPlants"][id].knowledge = knowledge;
		this["allPlants"][id].stats = stats;
		//let plant = new garden.plant(id, name, icon, BG, color, descr, growth, stats);
		//constructor(id, name, icon, BG, color, descr, growth, knowledge, stats={}) {
		this["order"].push(id);
		global["compendium"].newPlant(id, name, icon, BG, color, descr, growth, knowledge, stats);
	}
	addToPool(pool, result, weight, condition) {
		condition = (condition || false);
		if(!this["pools"][pool]){
			this["pools"][pool] = [];
		}
		if(this["allPlants"][result]){
			result = this["allPlants"][result];
		}
		//condition = statList.fixStats(condition, "total");
		let final = {result:result, weight:weight, condition:condition};
		this["pools"][pool].push(final);
		this["pools"]["all"].push(final);
		this["allPlants"][result["id"]]["pools"].push({pool:pool, weight:weight, condition:condition});
		global["compendium"]["plants"][result["id"]]["pools"].push({pool:pool, weight:weight, condition:condition});
	}
	spawnPlant(screen=0, pool="basic", type="random", loc="random") {
		/*
		set pool to change from which list plants will be picked (only if type is random) Set pool to an array to pick from multiple pools
		set type to select a specific non-random plant. Otherwise it picks a random plant for a certain pool
		set location to pick a specific spot for plants to appear, can override other plants, random location never overrides other plants.
		a plant will try to appear in the garden.
		*/
		let emptyTiles = this["screens"][screen].emptySort();
		if (!emptyTiles.length || !this.unlocked) {
			return false //garden is full and no plant is able to spawn. Or garden is unavailable.
		}
		if (loc === "random") {
			loc = emptyTiles[func.random(0, emptyTiles.length-1)];
		}
		else {
			loc = this["screens"][screen]["grid"][loc];
		}
		let plant;
		if (type === "random") {
			let targets = [];
			let allPossible = [];
			let possibleWeight = 0;
			if (typeof(pool) === "object") { //multiple different pools to pick from
				for (const [, entry] of Object.entries(pool)) {
					for (const [, entry2] of Object.entries(this["pools"][entry])) {
						targets.push(entry2); //multiple pools can contain the same plant, which gets added to the total multiple times.
					}
				}
			}
			else if (pool === "possible" || pool === "any") { //possible pool contains all plants that can spawn on the specified tile. Any pool contains all plants regardless of special conditions.
				targets = this["pools"]["all"];
			}
			else {
				targets = this["pools"][pool];
				//plant = this["pools"][pool][random(1, garden["pools"][pool].length)]
			}
			if(!targets){
				throw Error("No possible targets in pool " + func.ts(pool));
			}
			//garden.addNewPlant(plantClass("Plant4", "plant 4", 4, "#00FFFF", "#000000", Map("harvest",Map("power",500), Map("add",Map("clickPower",4)))))
			let coords = this["screens"][screen].coordsToGrid(loc.coords);
			let nearbyTiles = this["screens"][screen].square(coords.X-1, coords.X+1, coords.Y-1, coords.Y+1); //3x3 surrounding the tile 
			let nearbyStats = this.combinedStats(nearbyTiles);
			//allPossible = allPossible.concat(this["pools"]["all"]);
			//{add:{clickPower:1}});
			for (const [, entry] of Object.entries(targets)) {
				let possible = true;
				if(entry["condition"]){
					const verify = (stats={}, condition) =>{
						for(let [index, entry] of Object.entries(condition)){
							if(typeof(entry) === "object"){
								if(!verify(stats[index] || {}, entry)){
									return false;
								}
							}
							else{
								if(!stats[index] || entry > stats[index]){
									return false;
								}
								/*for(let [index2, entry2] of Object.entries(entry)){
									const stat = stats[index] ? stats[index][index2] : false;
									if(entry2 > stat){
										return false
									}
								}*/
							}
						}
						return true;
					}
					possible = verify(nearbyStats, entry["condition"]);
				}
				if (possible) {
					allPossible.push(entry);
					possibleWeight += entry["weight"];
				}
			}
			if (allPossible.length) {
				let weight = func.random(1, possibleWeight);
				let j=0;
				for(let i=0;j<weight;i++){
					j += allPossible[i]["weight"];
					plant = allPossible[i]["result"];
				}
				if(!plant){
					throw Error("Plant invalid. " + j + ", " + weight + ", " + func.ts(allPossible) + ", " + possibleWeight);
				}
				//plant = allPossible[random(0, allPossible.length-1)];
			}
		}
		else {
			plant = this["allPlants"][type];
		}
		if (plant) {
			//new statList().set(plant["stats"], {set:1})
			plant = new garden.plant(plant["id"], plant["name"], plant["icon"], plant["BG"], plant["color"], plant["descr"], plant["maxGrowth"], plant["stats"]);
			//plant = plant.clone();
			loc["plant"] = plant;
			return true;
		}
		return false;
	}
	findPlant(num) { //returns a plant based on numerical order.
		let i=0;
		for (const [, entry] of Object.entries(this["allPlants"])) {
			if (i === num) {
				return entry
			}
			i++;
		}
	}
	findTile(screen, coords){
		return this["screens"][screen]["grid"][coords];
	}
	findOrder(id) { //returns the order of a plant.
		return this["order"].indexOf(id);
	}
	
	swap(from, to){ //move a plant from a tile to another. Can move between screens, Can swap the location of two tiles. Optionally can interact with locked tiles. Can delete plants if needed.
		//from: {object}, should contain a screen and coords (not grid coords) and optionally an ignoreLocked value that ignores whether tiles are unlocked.
		//to: {object}, same as from. Can be empty in order to remove the "from" plant.
		let tile1 = this["screens"][from["screen"]]["grid"][from["coords"]];
		let tile2 = false;
		if(to){
			tile2 = this["screens"][to["screen"]]["grid"][to["coords"]];
		}
		if((tile1.unlocked || from.ignoreLocked) && (!tile2 || tile2.unlocked || to.ignoreLocked)){
			if(!tile2){
				tile1["plant"] = false;
			}
			else{
				tile1["plant"] = [tile2["plant"], tile2["plant"] = tile1["plant"]][0];
			}
		}
	}
	update(screen=0) {
		//this["unlocked"] = global["shop"]["upgrades"]["garden"]["bought"] + global["shop"]["upgrades"]["garden2"]["bought"] + global["shop"]["upgrades"]["garden3"]["bought"];
		let tiles = global.statList.stat("gardenTile");
		let list = this["screens"][screen].unlockSort();
		for (const [index, entry] of Object.entries(list)) {
			if (tiles <= index) {
				entry["unlocked"] = false;
			}
			else {
				entry["unlocked"] = true;
			}
		}
	}
	combinedStats(tiles) { //returns the combined stats of an array of tiles.
		let result = {};
		let list = new statList();
		
		/*entry["effects"] = {aura:statsInfo.get(`garden-${screen}`, `aura-${coords}`),
			auraEffects:statsInfo.get(`garden-${screen}`, `auraEffects-${coords}`),
			harvest:statsInfo.get(`garden-${screen}`, `harvest-${coords}`),
			permAura:statsInfo.get(`garden-${screen}`, `permAura-${coords}`),
			permAuraEffects:statsInfo.get(`garden-${screen}`, `permAuraEffects-${coords}`),
			total:stats.get("garden", coords)
		}*/
		//todo: Do not count ignored plants.
		for(const [, entry] of Object.entries(tiles)){
			if(entry["plant"]){ //empty tiles can not contribute, even if they have stats.
				for(const [index2, entry2] of Object.entries(entry["effects"])){
					if(index2 !== "total"){
						list.set(index2, 0, entry2, {add:true});
					}
				}
			}
		}
		/*for (const [index , entry] of Object.entries(tiles)) {
			if(entry["plant"]){
				for(const index2 of global.values.plantEffects){ //index2 = harvest, aura, permAura
					if(entry["plant"][index2]){
						list.set(index2, index, {index2:entry["plant"][index2]}, {stacks:entry["plant"].growMult(), combine:true});
					}
				}
				list.set("stats", index, {stats:entry["plant"]["stats"]}, {stacks:entry["plant"].growMult(), combine:true});
			}
			list.set("stats", index, entry["tempEffects"], {combine:true});
			list.set("stats", index, entry["permEffects"], {combine:true});
		}*/
		//todo: return base, extra, mult, total stats instead of just total.
		for(let index of Object.keys(list.list)){
			result[index] = list.calc(index)[index];
		}
		return result;
	}
}

export class compendium{ //compendium may not just be for garden but for other things too like dungeon equipment or even shop upgrades?
	constructor(){
		this.plants = {};
		this.plantOrder = [];
	}
	newPlant(id, name, icon, BG, color, descr, growth, knowledge, stats){ //plants are currently disconnected from the garden and can vary in just about everything if needed.
		this.plants[id] = {};
		let plant = this.plants[id];
		plant.id = id;
		plant.name = name || id;
		plant.icon = icon;
		plant.BG = BG;
		plant.color = color;
		plant.descr = descr;
		plant.maxGrowth = growth;
		plant.stats = stats;
		plant.unlocked = false;
		plant.knowledge = 0;
		plant.knowCap = knowledge;
		plant.pools = [];
		this.plantOrder.push(plant);
	}
	addPlant(id){
		this.plants[id]["unlocked"] = true;
	}
	addKnowledge(target, id, amount, free=false){
		const knowledge = global["resources"]["knowledge"]["amount"];
		if(amount > knowledge || amount > this[target][id]["knowCap"]-this[target][id]["knowledge"]){
			throw Error("Knowledge added is too much!");
		}
		this[target][id]["knowledge"] += amount;
		return amount;
	}
}

export class dungeon {
	constructor(){
		this.floor = {}; this.inCombat = false; this.equipOrder = []; this.allEquipment = {}; this.equipSlotTypes = {head:{type:"head", icon:"H"}, chest:{type:"chest", icon:"C"}, arms:{type:"arms", icon:"A"}, legs:{type:"legs", icon:"L"}};
		this.trinketCount = 4; this.weaponCount = 4; this.allEnemies = {}; this.enemyOrder = []; this.allRarities = {}; this.rarityOrder = [];
		this.selected = undefined;
		this.invMode = 1;
		this.unlocked = function(){
			return global["shop"]?.["upgrades"]["dungeon"]["bought"] >= 1
		}
		this.player = {icon:"@", name:"@", equipment:{}, color:"#CCCCCC", pos:0, maxHealth:100, maxStress:100, damage:1, activeWeapon:0};
		for(const [index] of Object.entries(this["equipSlotTypes"])) {
			this["player"]["equipment"][index] = false;
		}
		for(let i=0;i<this.weaponCount;i++){ //accessesories are usually used for misc abillities and non-combat stats.
			this["equipSlotTypes"]["weapon" + i] = {type:"weapon", icon:"I"};
			this["player"]["equipment"]["weapon" + i] = false;
		}
		for(let i=0;i<this.trinketCount;i++){ //accessesories are usually used for misc abillities and non-combat stats.
			this["equipSlotTypes"]["trinket" + i] = {type:"trinket", icon:"O"};
			this["player"]["equipment"]["trinket" + i] = false;
		}
		//equipment:
		//this.allEquipment = {} all equipment in the game at 100% stats.
		//this.equipOrder = [] list of ids of all equipment
		//this.inv = {} all obtained equipment at varying percentage of stats.
		//this.player.equipment = {} list of ids of equipment that are currently equipped on the player
	}
	newFloor(level, X, Y) {
		if(!X){
			X = (4 + Math.min(func.random(0.07, 0.01) * level, 1) * Math.random(4, 6));
		}
		if(!Y){
			Y = (4 + Math.min(func.random(0.07, 0.01) * level, 1) * Math.random(4, 6));
		}
		this["floor"] = {X:X, Y:Y, level:level, tiles:[]};
		this["player"]["pos"] = 0;
		for(let i=0;i<X*Y;i++){
			this["floor"]["tiles"].push(new dungeonTile(i));
			if ((!func.random(0, 4) && i) || i===X*Y-1) {
				let drop = false;
				if(!func.random(0, 0)){
					drop = {bias:5, item:this["equipOrder"][func.random(0, this["equipOrder"].length-1)]};
				}
				this["floor"]["tiles"][i].spawnEnemy("random", undefined, level-1, drop);
			}
		}
	}
	size(){
		return this["floor"]["X"] * this["floor"]["Y"];
	}
	currentTile(){
		return this.getTile(this["player"]["pos"])
	}
	getTile(coords) {
		return this["floor"]["tiles"][coords] || {}
	}
	coordsToGrid(i){
		return {X:i % this.floor.X, Y:Math.floor(i/this.floor.X)};
	}
	gridToCoords(coords){
		return coords["X"] + (coords["Y"]*this.floor.X);
	}
	advance(amount) {
		let tile = this.currentTile();
		if(!this["unlocked"] && false){
			return false;
		}
		for(let i=0;i<amount;i++){
			if (!this["inCombat"]) {
				this["player"]["pos"]++;
				tile = this.currentTile();
				if (tile["enemy"]) {
					this.enterCombat(tile["enemy"]);
				}
				else if (this["player"]["pos"] >= this.size()) {
					this.newFloor(this["floor"]["level"] + 1);
				}
			}
			else if (this["inCombat"]) {
				//let garden = global["garden"];
				//let effects = global["effects"];
				//let equipment = this["inCombat"]["player"]["equipment"];
				let enemy = this["inCombat"]["enemy"];
				let damage = this.calcDamage("player");
				let enemyDamage = this.calcDamage("enemy");
				damage = func.random(damage[0], damage[1]);
				enemyDamage = func.random(enemyDamage[0], enemyDamage[1]);
				let stressDamage = enemy["stress"];
				this["inCombat"]["enemy"]["health"] -= Math.floor(damage);
				this["inCombat"]["player"]["health"] -= Math.floor(enemyDamage);
				this["inCombat"]["player"]["stress"] += Math.floor(stressDamage);
				this["inCombat"]["player"]["activeWeapon"] = (this["inCombat"]["player"]["activeWeapon"]+1)%4; //cycle between weapons.
				if (this["inCombat"]["player"]["health"] <= 0) { //player health reaches 0. (a tie causes the player to lose.)
					this["inCombat"] = false;
					this.newFloor(func.random(7, 10), func.random(7, 10), 1);
				}
				else if (enemy["health"] <= 0) { //opponent health reaches 0.
					if(enemy["loot"]){
						this.lootEquipment(enemy["loot"]["item"], undefined, enemy["loot"]["bias"]);
						//let equipment = this["allEquipment"][enemy["loot"]["item"]];
						//let invEquipment = this["inv"][enemy["loot"]["item"]];
						//let message = "You found " + equipment["name"] + ". It now does " + Math.round(invEquipment["totalStats"]["damage"], 3) + " damage.";
						/*for(const [index, entry] of Object.entries(loot["stats"])){
							if("damage" in entry){
								//message += " (<span style='color:" + this["rarities"][index]["color"] + ";'>" + Math.round(invEquipment["stats"][index]["damage"] * 100) + "%</span>)"
							}
						}*/
						
						//new customTooltip(message, undefined, "devEquipment");
					}
					this["inCombat"] = false;
					delete tile["enemy"];
					//garden.spawnPlant("dungeon");
				}
			}
		}
	}
	enterCombat(enemy) {
		const player = this["player"];
		this["inCombat"] = {enemy: func.deepClone(enemy), player:func.deepClone(this["player"])};
		this["inCombat"]["enemy"] = {...this["inCombat"]["enemy"], health:func.deepClone(enemy["maxHealth"]), stress:0, maxStress:100};
		this["inCombat"]["player"] = {...this["inCombat"]["player"], health:func.deepClone(player["maxHealth"]), stress:0, maxStress:player["maxStress"], equipment:func.deepClone(this["player"]["equipment"])};
	}
	calcDamage(type, weaponSlot){
		let baseDamage = this.baseDamage(type, weaponSlot);
		if(type === "player"){
			baseDamage[0] *= global.statList.fullStat("damage")["mult"];
			baseDamage[1] *= global.statList.fullStat("damage")["mult"];
		}
		if(type === "enemy"){
			baseDamage[0] /= 1 + global.statList.stat("armor"); //every 100 armor reduces enemy damage by /1
			baseDamage[1] /= 1 + global.statList.stat("armor");
		}
		baseDamage[0] = Math.floor(baseDamage[0]);
		baseDamage[1] = Math.floor(baseDamage[0]);
		return baseDamage;
	}
	baseDamage(type, weaponSlot){
		let damage = [0, 0];
		if(type === "player"){
			let currWeapon;
			damage = [1, 1];
			if(this["inCombat"]){
				if(isNaN(weaponSlot)){
					weaponSlot = this["inCombat"]["player"]["activeWeapon"];
				}
				currWeapon = this["inCombat"]["player"]["equipment"][`weapon${weaponSlot}`];
			}
			else{
				if(isNaN(weaponSlot)){
					weaponSlot = this["player"]["activeWeapon"];
				}
				currWeapon = this["player"]["equipment"][`weapon${weaponSlot}`];
			}
			if (currWeapon && currWeapon["totalStats"]["weapon"]) {
				const weapon = currWeapon["totalStats"]["weapon"];
				if(weapon["minDamage"]){
					damage[0] += weapon["minDamage"];
				}
				if(weapon["maxDamage"]){
					damage[1] += weapon["maxDamage"];
				}
				if(damage[0] > damage[1]){
					damage[0] = damage[1]; //min damage can not go above max damage.
				}
			}
			return damage;
		}
		else if(type === "enemy"){
			if(this["inCombat"]){
				return [this["inCombat"]["enemy"]["damage"], this["inCombat"]["enemy"]["damage"]];
			}
			else{
				return [0, 0];
			}
		}
	}
	addEquipment(id, name, icon, color, eqType) {
		let equip = new equipment(id, name, icon, color, eqType);
		this["allEquipment"][id] = equip
		this["equipOrder"].push(id);
		return equip;
	}
	addRarity(id, name, color){
		this["allRarities"][id] = {id:id, name:name, color:color};
		this["rarityOrder"].push(id);
	}
	lootEquipment(id="random", rarity="random", bias=1, stats=false, max=1, unlock=true) {
		//loot a new copy of an equipment piece. Type, rarities and stats are randomized but can be pre-chosen.
		//equipment can also be unlocked for use
		//id: "random" picks a random equipment
		//id: "string" picks a specific equipment piece
		//id: [array] picks randomly from the list
		//rarities "random" picks a random rarity. Can pick multiple
		//rarities "string" picks a specific rarity
		//rarities: [array] pick all rarities from the list
		//stats: {object} (optional) direct stats the equipment should have. Ignores rarities if stats is set
		//bias: number, higher bias means more likely to pick a lower stat
		//max: number, the maximum stat range that and equipment has (default: 1) (1 = 100%)
		//unlock: boolean, whether the equipment is unlocked for use or not. (can not re-lock equipment)
		if (id === "random") {
			id = this["equipOrder"][func.random(0, this["equipOrder"].length-1)];
		}
		else if(typeof(id) === "object"){
			id = id[func.random(0, id.length-1)];
		}
		const equipment = this["allEquipment"][id];
		if (!equipment) {
			throw Error("Error. Invalid equipment: " + func.ts(id));
		}
		const baseRarity = equipment["baseStats"];
		if(rarity === "random"){
			rarity = [];
			for(let [index] of Object.entries(baseRarity)){
				if(!func.random(0, 3) || index === "common" || true){
					rarity.push(index);
				}
			}
		}
		else if(typeof(rarity) === "string"){
			rarity = [rarity];
		}
		const list = new statList();
		if(!stats){
			stats = {};
			for(const index of rarity){
				//let rarity = rarity[i];
				if (!baseRarity[index]) {
					throw Error("Invalid Rarity on equipment: " + id + "<br>Rarity: " + func.ts(rarity));
				}
				stats[index] = list.set("dungeon", index, baseRarity[index], {set:1}, {set:1, mult:() =>{return func.random(0.2, max, false, bias)}});
			}
		}
		equipment.combineEquipment(stats);
		equipment.unlocked = unlock || equipment.unlocked;
		return {id:id, stats:stats}
	}
	addEnemy(id, name, icon, color, hp, damage, stress, effects=false) {
		this["allEnemies"][id] = new enemy(id, name, icon, color, hp, damage, stress, effects=false);
		this["enemyOrder"].push(id);
	}
	equip(itemId, slotId) { //attempt to equip equipment onto player
		if(this["allEquipment"][itemId]["type"] === this["equipSlotTypes"][slotId]["type"]){ //can only equip equipment to slots of the same type.
			for(let [index, entry] of Object.entries(this["player"]["equipment"])){ //unequip all copies of the same equipment
				if(entry["id"] === itemId){
					this["player"]["equipment"][index] = false;
				}
			}
			this["player"]["equipment"][slotId] = func.objClone(this["allEquipment"][itemId]);
		}
		else{
			return false
		}
		return true
	}
}
class equipment{
	//equipment can be found randomly in the dungeon and equipped to the player where their effect will be active.
	//weapons only provide their stats when attacking with them, and when attacked afterwards.
	//equipment works in rarities, like common, uncommon, rare, etc.
	//equipment can have multiple rarities at the same time, the stats of each rarity are added on top of each other to produce a final result.
	//each rarity has its own range of stats, it's possible for a higher rarity to have lower stats than a more common variant.
	//finding multiple copies of the same equipment combines them, keeping the highest stats of the two. This is the way to add multiple rarities onto a single equipment.
	//stats work in a percentage base, by default it ranges from 0.2 to 1 (but is likely to go higher than that at some point), most equipment tends to have a bias towards lower values.
	//each equipment has a table of info corresponding to what stats each stat on each rarity should have which is located in dungeonClass["allEquipment"]. The stat is multplied by the percentage base of that stat, which becomes the final result.
	//example:
	//allEquipment[equipmentId] = {stats:{common:{damage:7}, uncommon:{damage:3}}}
	//inv[equipmentId] = {common:{damage:0.5}, uncommon:{damage:0.92}}
	//
	//The final stats of this equipment is calculated as follows
	//damage = (7 * 0.5) + (3 * 0.92) = 6.28
	//these calculated stats are provided in this["totalStats"]
	constructor(id, name, icon, color, eqType) {
		//example: dungeon["allEquipment"] = {id:"weapon1", name:"weapon 1", icon:"W1", color:"#000000", type:"weapon", stats:{common:{damage:4}, rare:{damage:2}}}
		//these are equipment templates. These are static values that determine an equipment's stat ranges.
		//these templates are not looted, put in the inventory or equipped and are just used as refferences towards equipment stats
		//Stats are calculated by taking the stat of the template and multiplying it by the same stat in the inventory.
		this.id = id; this.name = name; this.icon = icon; this.color = color; this.type = eqType; this.unlocked = false;
		this.baseStats = {}; //base 100% stats of equipment. Can not be changed
		this.stats = {}; //current stats of equipment, is multiplied by the base stat to get the actual stat
		this.totalStats = {}; //combined current stat of all rarities added together
		this.maxStats = {}; //combined base 100% stats of all rarities added together
	}
	addStats(rarity, stats) { //Equipment should always have at least one rarity. it does not have to be common.
		this["baseStats"][rarity] = stats;
		this["stats"][rarity] = {};

		/*
		//this["baseStats"][rarity]["stats"] = stat.fix({...stats["add"], ...stats["mult"]}, "base");
		//this["baseStats"][rarity]["weapon"] = stat.fix({...stats["weapon"]}, "base");
		
		let statCheck = [stats["main"]];
		for(let [, entry] of Object.entries(statCheck)){
			if(entry){
				entry["mult"] = entry["mult"] || {};
				for(let [index2, entry2] of Object.entries(entry)){
					if(!entry2["mult"] && index2 !== "mult"){
						entry["mult"][index2] = entry2;
						delete entry[index2];
					}
				}
			}
		}*/
		let maxStats = new statList();
		for (const [, entry] of Object.entries(this["baseStats"])) { //index = common, rare, common, etc
			maxStats.set(`equipment`, 0, entry, {add:true});
		}
		this["maxStats"] = maxStats.get(`equipment`, 0);
	}
	stat(stat, rarity){ //return the current stat of a single rarity. To return the combined stats of all rarity. Use this["totalStats"][stat] instead
		const stats = this["stats"][rarity][stat];
		return stats
	}
	combineEquipment(stats){ //combines the current equipment with a set of stats. Highest of the existing or new stats are chosen;
		let list = new statList();
		list.set("dungeon", "B", this["stats"], {set:true});
		list.set("dungeon", "B", stats, {max:true});
		const listValue = list.get("dungeon", "B");
		this["stats"] = listValue;
		this.calcTotal();
		//basestats, stats, totalStats, maxStats
		//this["baseStats"] = rarity:{statIDs:{statName:(base)}}
		//this["stats"] = rarity:{statIDs:{statName:(percentage)}}
		//this["totalStats"] = statIDs:{statName: (base * percentage) added for each rarity}
		//this["maxStats"] = statIDs:{statName:(base) added for each rarity}
	}
	calcTotal(set=true){
		let list = new statList();
		for (const [index, entry] of Object.entries(this["stats"])) { //index = common, uncommon, rare, etc
			list.set("dungeon", index, this["baseStats"][index]);
			list.set("dungeon", index, entry, {mult:true});
		}
		let result = list.calc("dungeon")["combine"];
		if(set){
			this["totalStats"] = result;
		}
		return result;
	}
	description() {
		let descr = this["name"];
		descr += "<br>Type: " + this["type"];
		if (this["totalStats"].count) {
			descr += "<br>Stats:";
			descr += ts(this["totalStats"]);
		}
		return descr
	}
}

class enemy{
	constructor(id, name, icon, color, hp, damage, stress, effects=false){
		this.id = id; this.name = name; this.icon = icon; this.color = color; this.hp = hp; this.damage = damage; this.stress = stress; this.effects = effects;
	}
}
class dungeonTile{
	constructor(id){
		this.id = id;
	}
	spawnEnemy(type="random", pool, level, loot=false, damageMod, healthMod){
		const values = global["values"];
		damageMod = (damageMod ? damageMod * values["baseDamage"] : values["baseDamage"]);
		healthMod = (healthMod ? healthMod * values["baseHealth"] : values["baseHealth"]);
		let enemy;
		const dungeon = global["dungeon"];
		if(type === "random"){
			let id = dungeon["enemyOrder"][func.random(0, dungeon["enemyOrder"].length-1)];
			enemy = func.deepClone(dungeon["allEnemies"][id]);
		}
		else{
			enemy = type;
		}
		enemy["damage"] = Math.floor(damageMod * Math.pow(values["damageScale"], level));
		enemy["maxHealth"] = Math.floor(healthMod * Math.pow(values["healthScale"], level));
		if(loot){
			enemy["loot"] = loot;
		}
		this.enemy = enemy;
	}
}

export class starsMain{
	constructor(){
		this.unlocked = function(){
			return global["shop"]?.["upgrades"]["telescope"]["bought"] >= 1
		}
		this.main = {}; this.upgrades = {}; this.connects = {};
	}
	addMain(id, X, Y, color){
		this["main"][id] = {id:id, X:X, Y:Y, color:color};
		this["upgrades"][id] = {};
		this["connects"][id] = {};
	}
	addUpgrade(mainId, upgrId, name, descr, X, Y, size=40, img="star", price, cap, stats, unlock, visible){
		this["upgrades"][mainId][upgrId] = new upgrade(upgrId, name, descr, price, "stars", cap, stats, unlock, visible);
		this["upgrades"][mainId][upgrId] = Object.assign(this["upgrades"][mainId][upgrId], {mainId:mainId, X:X, Y:Y, size:size, img:img});
	}
	addConnection(mainId, fromId, toId, color){
		this["connects"][mainId][fromId] = this["connects"][mainId][fromId] || [];
		this["connects"][mainId][fromId].push([toId, color]);
	}
}