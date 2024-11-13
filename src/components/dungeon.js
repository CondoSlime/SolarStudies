
import React, {memo, useContext} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as func from './functions.js';
import {c} from './functions.js';
import {mainContext, dragContext} from '../App.js';
import {MenuModeButton, RsDisplay} from './comps';

export const DungeonSub = memo((props) =>{
	const {states} = useContext(mainContext);
	const dungeonMode = states["dungeonMode"];
	const setDungeonMode = states.setDungeonMode;
	return (<>
		<RsDisplay>{`Floor: ${states["dungeon"]["floor"]["level"]}`}</RsDisplay>
		<MenuModeButton set={"dungeon"} mode={dungeonMode} setMode={setDungeonMode}>{"Dungeon"}</MenuModeButton>
		<MenuModeButton set={"inventory"} mode={dungeonMode} setMode={setDungeonMode}>{"Inventory"}</MenuModeButton>
	</>)
}, func.jsonEqual);


export const DungeonMain = memo((props) =>{
	const {dungeon, states, values} = useContext(mainContext);
	const invTileSize = props.invTileSize;
	return (
		states["dungeonMode"] === "dungeon" ?
			states["dungeon"]["inCombat"] ? 
				<div className={c("combatDisplay")}>
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
					<PlayerPanel unit={states["dungeon"]["inCombat"]["player"]} healthColor={"#AA0000"} stressColor={"#223322"} />
					<EnemyPanel unit={states["dungeon"]["inCombat"]["enemy"]} healthColor={"#AA0000"} stressColor={"#223322"} />
				</div>
			: <div className={c("dungeonScreen")}>
				{[...Array(states.dungeon.floor.Y)].map((entry, index) => (
					<div className={c("dungeonRow")} key={index}>
						{[...Array(states.dungeon.floor.X)].map((entry2, index2) => {const i=index*states.dungeon.floor.X+index2;
							return <DungeonTile key={index2} dungeon={states.dungeon} tile={states.dungeon.floor.tiles[i]} />
						})}
					</div>
				))}
			</div>
		: states["dungeonMode"] === "inventory" ?  <>
			<><div className={c("invUpper")} style={{height:"47.5%", ...states["invScreen"][1], transition:`all 100ms ease-in-out`}}>
				<div className={c("equipment")} style={{backgroundColor: '#555555'}}>
					<WeaponDiamond style={{width:(invTileSize*2), height:(invTileSize*2)}}>
					{[...Array(states.dungeon.weaponCount)].map((entry, index) => (
						<React.Fragment key={index}>
							<InventoryEquipSlot type="weapon" id={`weapon${index}`} invTileSize={invTileSize} />
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
					<div className={c("armor")}>
						<InventoryEquipSlot type="head" id="head" />
						<InventoryEquipSlot type="chest" id="chest" />
						<InventoryEquipSlot type="arms" id="arms" />
						<InventoryEquipSlot type="legs" id="legs" />
					</div>
					<div className={c("trinkets")}>
						{[...Array(states.dungeon.trinketCount)].map((entry, index) => (
							<React.Fragment key={index}>
								<InventoryEquipSlot type="trinket" id={`trinket${index}`} />
							</React.Fragment>
						))}
					</div>
				</div>
				<div style={{backgroundColor: '#555555', display:"flex", overflowX:"scroll"}}>
					<ForgeDisplay type="main" />
					{dungeon["rarityOrder"].map((entry, index) => (
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
			<div className={c("equipOptions")} style={{height:"5%"}}>
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
			<div className={c("inventory")} style={{height:"47.5%"}}>
				{[...Array(values.invH)].map((entry, index) => (
					<div key={index}>
						{[...Array(values.invW)].map((entry2, index2) => {
							const i=index*values.invW+index2;
							const dungeon = states["dungeon"];
							const id = dungeon["equipOrder"][i];
							return (<React.Fragment key={index2}>
								<InventorySlot id={id} item={dungeon["allEquipment"][id]} invTileSize={invTileSize} />
							</React.Fragment>)
						})}
					</div>
				))}
			</div>
		</>
		: <></>
	)
}, func.jsonEqual);

function DungeonTile(props) {
	return (
		<div className={c("dungeonTile")}>
			{props.dungeon.player.pos === props.tile.id ? 
				props.dungeon.player.icon
			: props.tile.enemy ?
				props.tile.enemy.icon
			: <></>}
		</div>
	)
}

function PlayerPanel(props){
	const {dungeon} = useContext(mainContext);
	const unit = (props.unit || (dungeon["incombat"] ? dungeon["incombat"]["player"]["equipment"] : dungeon["player"]["equipment"]));
	//const weapon = (unit.activeWeapon ? unit["equipment"][`weapon${unit.activeWeapon}`] : false);
	let damage = [1, 1];
	if(!isNaN(unit.activeWeapon)){
		damage = dungeon.calcDamage("player", unit.activeWeapon);
	}
	return (
		<div className={c("combatInfo")}>
			<div className={c("combatInfoInner")}>
				<span className={c("centerText")}>{unit.name}</span>
				{unit.maxHealth ?
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.healthColor, width:(unit.health/unit.maxHealth*100) + "%"}}></div>
						<div className={c("healthBarText")}>{`${unit.health}/${unit.maxHealth}`}</div>
					</div>
				: 
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.healthColor, width:0}}></div>
						<div className={c("healthBarText")}>{`0/0`}</div>
					</div>
				}
				{unit.maxStress ?
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.stressColor, width:(unit.stress/unit.maxStress*100) + "%"}}></div>
						<div className={c("healthBarText")}>{`${unit.stress}/${unit.maxStress}`}</div>
					</div>
				:
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.stressColor, width:0}}></div>
						<div className={c("healthBarText")}>{`0/0`}</div>
					</div>
				}
				<div className={c("healthBar")}>
					<div className={c("healthBarText")}>{`${func.round(damage[0], 1)} - ${func.round(damage[1], 1)}`}</div>
				</div>
			</div>
		</div>
	)
}

function EnemyPanel(props){
	const {dungeon} = useContext(mainContext);
	const unit = (props.unit || (dungeon["incombat"] ? dungeon["incombat"]["enemy"] : {}));
	let damage = dungeon.baseDamage("enemy");
	/*playerHealth.getElementsByClassName("healthBarInner")[0].style.width = (Math.max(combat["player"]["health"], 0) / combat["player"]["maxHealth"] * 100) + "%"
	playerStress.getElementsByClassName("healthBarInner")[0].style.width = (Math.max(combat["player"]["stress"], 0) / combat["player"]["maxStress"] * 100) + "%"
	enemyHealth.getElementsByClassName("healthBarInner")[0].style.width = (Math.max(combat["enemy"]["health"], 0) / combat["enemy"]["maxHealth"] * 100) + "%"
	playerHealth.getElementsByClassName("healthBarText")[0].innerHTML = round(combat["player"]["health"], 1) + "/" + round(combat["player"]["maxHealth"], 1);
	playerStress.getElementsByClassName("healthBarText")[0].innerHTML = round(combat["player"]["stress"], 1) + "/" + round(combat["player"]["maxStress"], 1);
	enemyHealth.getElementsByClassName("healthBarText")[0].innerHTML = round(combat["enemy"]["health"], 1) + "/" + round(combat["enemy"]["maxHealth"], 1);*/
	return (
		<div className={c("combatInfo")}>
			<div className={c("combatInfoInner")}>
				<span className={c("centerText")}>{props.unit.name}</span>
				{unit.maxHealth ?
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.healthColor, width:(unit.health/unit.maxHealth*100) + "%"}}></div>
						<div className={c("healthBarText")}>{`${unit.health}/${unit.maxHealth}`}</div>
					</div>
				: 
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.healthColor, width:0}}></div>
						<div className={c("healthBarText")}>{`0/0`}</div>
					</div>
				}
				{unit.maxStress ?
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.stressColor, width:(unit.stress/unit.maxStress*100) + "%"}}></div>
						<div className={c("healthBarText")}>{`${unit.stress}/${unit.maxStress}`}</div>
					</div>
				:
					<div className={c("healthBar")}>
						<div className={c("healthBarInner")} style={{backgroundColor:props.stressColor, width:0}}></div>
						<div className={c("healthBarText")}>{`0/0`}</div>
					</div>
				}
				<div className={c("healthBar")}>
					<div className={c("healthBarText")}>{`${func.round(damage[0], 1)} - ${func.round(damage[1], 1)}`}</div>
				</div>
			</div>
		</div>
	)
}

function InventorySlot(props){
	const {draggable, setDraggable} = useContext(dragContext);
	const {dungeon, states /*invTileSize, invShowMode, invRarityMode, dungeon, setDungeon*/} = useContext(mainContext);
	//invmode 0 = forge, 1 = inventory
	const invTileSize = props.invTileSize;
	const content = props.item;
	const selected = dungeon["selected"];

	const handleClick = (e) => {
		//const elem = e.target;
		if (draggable.dragOff) { //todo: remove selected when leaving the inventory.
			let newState = dungeon;
			newState["selected"] = (newState["selected"] && newState["selected"]["id"] === props.id ? undefined : {id:props.id, origin:"inventory"});
			states.setDungeon(func.objClone(newState));
		}
	}
	const handleDrag = (e) => {
		setDraggable({ elem: <div className={c("centerText")}>{props.item.icon}</div>, style:{border:"1px solid black", opacity:0.9, width:invTileSize, height:invTileSize}, Xoffset:invTileSize/2, Yoffset:invTileSize/2, e:e, className:(props.item.type === "weapon" ? "diamond" : ""), dragOff:true, type:"down", info:{args:content, id:"inventory", origin:props.id}});
	}
	const handleDragLeave = () =>{
		
	}
	if(!props.item || !props.item.unlocked){
		return (<div className={c("inventorySlot")}></div>)
	}
	else{
		let tooltip = renderToStaticMarkup(<EquipmentDescr equipment={props.item} settings={{invShowMode:states["invShowMode"], invRarityMode:states["invRarityMode"]}} dungeon={dungeon} />);
		return (<div className={c(`inventorySlot${(draggable.active && draggable.info.id === "inventory" && draggable.info.origin === props.item.id && !draggable.dragOff) ||
		((!draggable.active || draggable.dragOff) && selected && selected["origin"] === "inventory" && selected.id === props.item.id) ? " dragged" : ""}`)} 
		onClick={(e) => handleClick(e)} onMouseDown={(e) => handleDrag(e)} onMouseUp={(e) => handleDragLeave(e, true)}
		data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={tooltip}>{props.item.icon}</div>)
	}
}

function InventoryEquipSlot(props){
	const {draggable, setDraggable} = useContext(dragContext);
	const {dungeon, states /*invTileSize, invShowMode, invRarityMode, dungeon, setDungeon*/} = useContext(mainContext);
	//const {draggable, setDraggable, invTileSize, invShowMode, invRarityMode, dungeon, setDungeon} = useContext(mainContext);
	//props.item
	const item = dungeon["player"]["equipment"][props.id] || false; //item equipped in current equipment slot
	const itemType = dungeon["equipSlotTypes"][props.id]["type"]; //type of equipment slot (like weapon, helm, trinket, etc)
	const dragItem = draggable.info.args || false; //currently dragged equipment slot
	const hoverElem = draggable["hover"];
	const hoverType = hoverElem ? dungeon["equipSlotTypes"][hoverElem]["type"] : false; //type of equipment slot under the mouse.
	const validDrag = draggable.info.id ? ["inventory", "equipment"].includes(draggable.info.id) : false;
	const selected = dungeon["selected"];
	const invTileSize = props.invTileSize;

	const handleClick = (e) => {
		if(selected){
			let newState = dungeon;
			newState.equip(selected["id"], props.id);
			if(item){
				newState.equip(item.id, selected["slot"]);
			}
			newState["selected"] = undefined;
			states.setDungeon(func.objClone(newState));
		}
		else if (draggable.dragOff && item) {
			let newState = dungeon;
			newState["selected"] = (newState["selected"] && newState["selected"]["id"] === item.id ? undefined : {id:item.id, slot:props.id, origin:"equipment"});
			states.setDungeon(func.objClone(newState));
		}
	}

	const handleDrag = (e) => {
		if(dungeon["player"]["equipment"][props.id]){
			const args = dungeon["player"]["equipment"][props.id];
			setDraggable({ elem: <div className={c("centerText")}>{args.icon}</div>, style:{border:"1px solid black", opacity:0.9, width:invTileSize, height:invTileSize}, e:e, className:(itemType === "weapon" ? "diamond" : ""), dragOff:true, Xoffset:invTileSize/2, Yoffset:invTileSize/2, type:"down", info:{args:args, id:"equipment", origin:props.id}});
		}
	}
	const handleDragLeave = (e, release = false) => {
		if (validDrag && !draggable.dragOff && draggable.info.id !== props.id) {
			let newState = dungeon;
			if(release){
				if(validDrag){
					newState.equip(dragItem.id, props.id);
					if(item.id && draggable.info.id === "equipment"){
						newState.equip(item.id, draggable.info.origin);
					}
				}
			}
			setDraggable({type:"hover", info:false})
			states.setDungeon(func.objClone(newState));
		}
	}
	const handleDragOver = (e) =>{
		if (draggable.info.args && validDrag && (!draggable.dragOff || draggable.active !== e.target)){
			setDraggable({type:"hover", info:props.id});
		}
	}
	const current = (hoverElem === props.id && props.type === dragItem.type ? //dragging an element and hovering over another element and the types of the element are the same?
		dragItem.icon //show hovering element instead of current element.
	: draggable.info.id === "equipment" && draggable.info.origin === props.id && props.type === hoverType ? //current element being dragged and hovered over another element and the types are the same?
		dungeon["player"]["equipment"][hoverElem] ? //hovered-over element is currently equipped?
			dungeon["player"]["equipment"][hoverElem].icon //show hovered-over element instead of current element.
		:
			false //show nothing on current element
	: item && draggable.info && item["id"] === draggable.info.args.id && props.type === hoverType ?
		false
	/*: draggable.info.id === "inventory" && hoverElem && draggable.info.origin === props.id && hoverElem !== props.id && false ? //current element being dragged and hovered over another element and the types are the same?
		false //show nothing on current element*/
	:
		item["icon"] || false) //show currently equipped item
	let tooltip = renderToStaticMarkup(<EquipmentDescr equipment={item} settings={{invShowMode:states["invShowMode"], invRarityMode:states["invRarityMode"]}} dungeon={dungeon} />);
	return (
		<div className={c(`equipSlot ${draggable.active && draggable.info.args.type === itemType ? "dragValid" : ""} 
		${(draggable.active && draggable.info.id === "equipment" && draggable.info.origin === props.id && !draggable.dragOff) ||
			((!draggable.active || draggable.dragOff) && selected && selected["origin"] === "equipment" && selected["slot"] === props.id) ? "dragged" : ""}`)} 
		style={props.style} type={props.type} 
		onClick={(e) => handleClick(e)} onMouseDown={(e) => handleDrag(e)} onMouseOver={(e) => handleDragOver(e)} onMouseLeave={(e) => handleDragLeave(e)} onMouseUp={(e) => handleDragLeave(e, true)}
		data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={tooltip}>
			<span>
				{current || ""}
			</span>
		</div>)
}

function WeaponDiamond(props){
	/*let transform = `${props.style.transform || ""} translate(calc((1% * sqrt(2) - 1%) * 50), calc((1% * sqrt(2) - 1%) * 50)) rotate(45deg)` ;
	let style = props.style;
	if(style.transform){
		delete style.transform;
	}
	*/
	return <div className={c(`weaponDiamond ${props.className || ""}`)} style={{...props.style/*, transform:transform*/}}>
		{props.children}
	</div>
}

function EquipOptionButton(props){
	return <div className={c("menuButton2")} onClick={props.onClick}>{props.children}</div>
}

function EquipmentDescr(props){
	//invShowmode = 0 show current stats. (mult stats * max stats)
	//invshowMode = 1 show max stats (max stats)
	//invShowMode = 2 show breakdown current stats (common mult stat, uncommon mult stat, etc)
	//invShowMode = 3 show breakdown current stats (common mult stat * max mult stat, uncommon mult stat * uncommon mult stat, etc)
	const equipment = props.equipment;
	if(equipment){
		const settingRarity = props.settings.invRarityMode > -1 ? [props.dungeon["allRarities"][props.dungeon["rarityOrder"][props.settings.invRarityMode]]["id"]] : Object.keys(equipment.stats);
		const showMax = (props.settings.invShowMode%2);
		const colorLine = (equipment, basePath, rarities, showMax) =>{
			if(true){
				return <></>
			}
			return (
				<div style={{display:"block"}}>
					<span style={{width:0, minWidth:"100%", height:"100%", left:0, top:0, position:"absolute", display:"flex", flexDirection:"column"}}>
						{Object.entries(equipment).map(([index, entry]) => { //index = common, uncommon, etc
							let stat = entry;
							if(rarities.includes(index)){
								for(let i=0;i<basePath.length;i++){
									stat = stat[basePath[i]];
								}
							}
							return (<span key={index} style={{width:`${showMax ? 100 : (stat ? stat.total : 0) * 100}%`, height:"100%", backgroundColor:props.dungeon["allRarities"][index]["color"]}}/>)
		
						})}
					</span>
				</div>)
		}
		//let allStats = {};
		//if(props.settings.invShowMode === 0){
		//	allStats = itemStats(equipment["totalStats"]);
		//}
		//props.settings.invRarityMode
		let statCheck = {};
		if(props.settings.invRarityMode === -1){
			statCheck = (showMax ? equipment["maxStats"] : equipment["totalStats"]) || {};
		}
		else{
			let rarity = props.dungeon["rarityOrder"][props.settings.invRarityMode];
			statCheck = (showMax ? equipment["baseStats"][rarity] : equipment["stats"][rarity]) || {};
		}
		//const statCheck = showMax ? equipment["maxStats"] : equipment["totalStats"];
		let allStats = [];
		if(statCheck["weapon"]){
			let ind = "weapon";
			allStats[ind] = [];
			if(statCheck["weapon"]["minDamage"] || statCheck["weapon"]["maxDamage"]){
				allStats[ind].push(<span>{'Base damage: '}</span>);
				let minDamage = statCheck["weapon"]["minDamage"] || 0;
				let maxDamage = Math.max(statCheck["weapon"]["maxDamage"] || 0, minDamage);
				allStats[ind].push(<span style={{position:"relative"}}>
					<span style={{zIndex:1}}>{`${func.round(minDamage, 2)} - ${func.round(maxDamage, 2)}`}</span>
				</span>)
				/*if(statCheck["weapon"]["maxDamage"]){
					allStats["weapon"].push(<>
						<span style={{color:props.dungeon["allRarities"][index]["color"]}}>{`\u00A0(`}</span>
							{`${props.settings.invShowMode === 2 ?
								func.round(entry["weapon"]["maxDamage"].total * 100, 0) + "%"
							:
								func.round(entry["weapon"]["minDamage"].total, 2)
							}`}
						<span style={{color:props.dungeon["allRarities"][index]["color"]}}>{")"}</span>
					</>)
				}
				}
				if(equipment["totalStats"]["weapon"]["maxDamage"]){
					allStats["weapon"].push(<span>{'maxDamage:'}</span>);
					for(let [index, entry] of Object.entries(statCheck)){ //index = common, uncommon, etc
						if(entry["weapon"] && entry["weapon"]["maxDamage"]){
							allStats["weapon"].push(<>
								<span style={{color:props.dungeon["allRarities"][index]["color"]}}>{`\u00A0(`}</span>
									{`${props.settings.invShowMode === 2 ?
										func.round(entry["weapon"]["maxDamage"].total * 100, 0) + "%"
									:
										func.round(entry["weapon"]["maxDamage"].total, 2)
									}`}
								<span style={{color:props.dungeon["allRarities"][index]["color"]}}>{")"}</span>
							</>)
						}
					}
					allStats["weapon"].push(<br/>);
				}*/
			}
		}
		if(statCheck["base"]){
			let ind = "base";
			allStats[ind] = [];
			for(let [index, entry] of Object.entries(statCheck["base"])){ //index = add, mult
				allStats[ind].push(<div key={index} style={{position:"relative"}}>
					<span style={{zIndex:1, display:"block"}}>
						{colorLine(equipment["stats"], ["base", index], settingRarity, showMax)}
						{`${index}: +${func.round(entry, 2)}`}
					</span>
				</div>)
			}
		}
		if(statCheck["mult"]){
			let ind = "mult";
			allStats[ind] = [];
			for(let [index, entry] of Object.entries(statCheck["mult"])){ //index = add, mult
				allStats[ind].push(<div key={index} style={{position:"relative"}}>
					<span style={{zIndex:1, display:"block"}}>
						{colorLine(equipment["stats"], ["mult", index], settingRarity, showMax)}
						{`${index}: +${func.round(entry*100, 2)}%`}
					</span>
				</div>)
			}
		}
		return (
			<div>
				<div>{`${equipment.name}`}</div>
				<div>{`Type: ${equipment.type}`}</div>
				<div>{`Stats:`}</div>
				<div style={{backgroundColor:`#509050`, border:'1px solid #306030', color:"black"}}>

					{Object.entries(allStats).map(([index, entry]) => (
						Object.entries(entry).map(([index2, entry2]) => {
							return <React.Fragment key={index2}>{entry2}</React.Fragment>
						})
					))}
				</div>
			</div>
		)
	}
	else{
		return <></>
	}
}

function ForgeDisplay(props){
	const {draggable} = useContext(dragContext);
	const {dungeon} = useContext(mainContext);
	const selected = dungeon["selected"] ? dungeon["selected"]["id"] : false;
	
	const currentId = draggable["hover"] ? draggable.info.args.id : selected || "";
	const item = currentId ? dungeon["allEquipment"][currentId] : false;
	if(props.type !== "main"){
		if(item && item["stats"][props.type]){
			let info = item ? Object.entries(item["stats"][props.type]).map(([index]) => (
				<div key={index}>{`${index} : ${Math.round(item.stat(index, props.type))}`}</div>
			)) : "";
			return (
				<div className={c("forgeDisplay")} style={{borderColor:dungeon["allRarities"][props.type]["color"]}}>
					{info}
				</div>
			)
		}
		else{
			return <></>;
		}
	}
	else{
		let info = item ? Object.entries(item.totalStats).map(([index, entry]) => (
			<div key={index}>{`${index} : ${Math.round(entry)}`}</div>
		)) : "";
		return (
			<div className={c("forgeDisplay")}>
				{item ?
					<><div>{item.name}</div>
					<div>{"total stats"}</div></>
				: <></>}
				{/*<div className="equipSlot dragValid" onClick={(e) => handleClick(e)} onMouseOver={(e) => handleDragOver(e)} onMouseLeave={(e) => handleDragLeave(e)} onMouseUp={(e) => handleDragLeave(e, true)}><span>
					{current}
				</span></div>*/}
				{info}
			</div>
		)
	}
}