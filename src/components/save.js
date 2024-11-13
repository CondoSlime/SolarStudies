import {global} from '../App.js';
import * as classes from './classes.js';
import * as lzString from 'lz-string';
import * as func from './functions.js';

export function saveGame(){
    let save = {resources:{}, shop:{}, energizer:{}, garden:{}, dungeon:{}};
    for(let [index, entry] of Object.entries(global["resources"])){
        save["resources"][index] = entry["amount"];
    }
    for(let [index, entry] of Object.entries(global["shop"]["upgrades"])){
        save["shop"][index] = entry["bought"];
    }
    save["energizer"]["grid"] = [];
    for(let i=0;i<global["energizer"]["grid"].length;i++){
        save["energizer"]["grid"][i] = [];
        for(let j=0;j<global["energizer"]["grid"][i].length;j++){
            let tile = global["energizer"]["grid"][i][j];
            save["energizer"]["grid"][i][j] = {id:tile["id"], dir:tile["dir"]}
        }
    }
    save["energizer"]["modifiers"] = {};
    for(let [index, entry] of Object.entries(global["energizer"]["allModules"])){
        save["energizer"]["modifiers"][index] = entry["modifiers"];
    }
    save["garden"]["screens"] = [];
    for(let i=0;i<global["garden"]["screens"].length;i++){
        save["garden"]["screens"][i] = {grid:[]};
        for(let j=0;j<global["garden"]["screens"][i]["grid"].length;j++){
            save["garden"]["screens"][i]["grid"][j] = [];
            for(let k=0;k<global["garden"]["screens"][i]["grid"][j].length;k++){
                let tile = global["garden"]["screens"][i]["grid"][j][k];
                save["garden"]["screens"][i]["grid"][j][k] = {permEffects:tile["permEffects"], plant:tile["plant"]}
            }
        }
    }
    save["dungeon"]["equipStats"] = {};
    save["dungeon"]["unlocked"] = [];
    for(let [index, entry] of Object.entries(global["dungeon"]["allEquipment"])){
        for(let [index2, entry2] of Object.entries(entry["stats"])){
            if(Object.keys(entry2).length){
                save["dungeon"]["equipStats"][index2] = entry2;
            }
        }
        if(entry["unlocked"]){
            save["dungeon"]["unlocked"].push(index);
        }
    }
    save["dungeon"]["floor"] = global["dungeon"]["floor"];
    save["dungeon"]["equipment"] = global["dungeon"]["player"]["equipment"];
	window.localStorage.setItem("solarStudies", lzString.compressToBase64(JSON.stringify(save)));
}

export function loadGame(){
    const save = JSON.parse(lzString.decompressFromBase64(window.localStorage.getItem("solarStudies")) || "[]");
    if(save["resources"]){
        for(let [index, entry] of Object.entries(save["resources"])){
            if(global["resources"][index]){
                global["resources"][index]["amount"] = entry;
            }
            else{
                console.log("Warning. Resource", `"${index}"`, "doesn't exist.");
            }
        }
    }
    if(save["shop"]){
        for(let [index, entry] of Object.entries(save["shop"])){
            if(global["shop"]["upgrades"][index]){
                global["shop"]["upgrades"][index]["bought"] = entry;
            }
            else{
                console.log("Warning. Upgrade", `"${index}"`, "doesn't exist.");
            }
        }
    }
    if(save["energizer"]){
        for(let i=0;i<save["energizer"]["grid"].length;i++){
            for(let j=0;j<save["energizer"]["grid"][i].length;j++){
                let tile = save["energizer"]["grid"][i][j];
                if(tile["id"]){
                    let module = global["energizer"].copyModule(tile["id"]);
                    if(tile["dir"]){
                        module.setDirection(tile["dir"]);
                    }
                    global["energizer"].placeTile(module, {X:i, Y:j});
                }
            }
        }
    }
    if(save["garden"]){
        for(let i=0;i<save["garden"]["screens"].length;i++){
            for(let j=0;j<save["garden"]["screens"][i]["grid"].length;j++){
                let tile = save["garden"]["screens"][i]["grid"][j];
                global["garden"]["screens"][i]["grid"][j]["permEffects"] = tile["permEffects"];
                if(tile["plant"]){
                    global["garden"]["screens"][i]["grid"][j]["plant"] = new classes.garden.plant();
                    for(let [index, entry] of Object.entries(tile["plant"])){
                        global["garden"]["screens"][i]["grid"][j]["plant"][index] = entry;
                    }
                    //console.log(global["garden"]["screens"][i]["grid"][j][k]["plant"], global["garden"]["screens"][i]["grid"][j][k]["plant"].growStage())
                }
            }
        }
    }
    if(save["dungeon"]){
        for(let [index, entry] of Object.entries(save["dungeon"]["equipStats"])){
            global["dungeon"]["allEquipment"][index]["stats"] = entry;
        }
        for(let index of save["dungeon"]["unlocked"]){
            global["dungeon"]["allEquipment"][index]["unlocked"] = true;
        }
        global["dungeon"]["floor"] = save["dungeon"]["floor"];
        global["dungeon"]["player"]["equipment"] = save["dungeon"]["equipment"];
    }
}

export function softReset(){
    let resState = func.objClone(global["resources"]);
    resState["power"]["amount"] = 0;
    for(let [index, entry] of Object.entries(global["shop"]["upgrades"])){
        if(index === "telescope"){
            entry["bought"] = Math.min(entry["bought"], 1);
        }
        else{
            entry["bought"] = 0;
        }
    }
    for(let i=0;i<global["energizer"]["grid"].length;i++){
        global["energizer"].removeTile(i);
    }
    for(let i=0;i<global["garden"]["screens"].length;i++){
        for(let j=0;j<global["garden"]["screens"][i]["grid"].length;j++){
            let tile = global["garden"]["screens"][i]["grid"][j];
            global["garden"]["screens"][i]["grid"][j]["permEffects"] = 0; //todo: add upgrade that keeps perm effects.
            if(tile["plant"]){
                global["garden"]["screens"][i]["grid"][j]["plant"] = false; //todo: add upgrade that lowers plants to growth stage 0 instead of removing them.

                //global["garden"]["screens"][i]["grid"][j]["plant"]["growth"] = 0;
            }
        }
    }
    global["dungeon"].newFloor(0); //todo: unsure on how to handle floors in dungeon.
    global["states"].setResources(resState);
    global["states"].setShop(global["shop"]);
    global["states"].setEnergizer(global["energizer"]);
    global["states"].setGarden(global["garden"]);
    global["states"].setDungeon(global["dungeon"]);
    func.updateEffects();
}
export function hardReset(){

}