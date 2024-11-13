import React, {memo, useContext} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as func from './functions.js';
import {c} from './functions.js';
import {mainContext, dragContext} from '../App.js';
import * as img from '../images';
import {MenuModeButton, RsDisplay, DragGhost, itemStats} from './comps';

export const GardenSub = memo((props) =>{
	const {states} = useContext(mainContext);
	const {draggable} = useContext(dragContext);
	const screenMode = states["gardenScreen"];
	const setScreenMode = states.setGardenScreen;
    const gardenMode = states["gardenMode"];
    const setGardenMode = states.setGardenMode;
    const screenFunc = (mode) => {
		if(draggable.info && draggable.info.id === "gardenTile"){
			console.log("!");
			setScreenMode(mode);
		}
	};
    return (<>
		<RsDisplay>
			{`Knowledge: ${Math.floor(states["resources"]["knowledge"]["amount"])}`}
		</RsDisplay>
		<MenuModeButton set={"garden"}     mode={screenMode} setMode={setScreenMode} gardenButtonHover={"garden"}     mouseOver={() => screenFunc("garden")} style={{ background: "#228822", height:60}}>{"Garden"}</MenuModeButton>
		<MenuModeButton set={"storage"}    mode={screenMode} setMode={setScreenMode} gardenButtonHover={"storage"}    mouseOver={() => screenFunc("storage")} style={{ background: "#886644", height:60}}>{"Storage"}</MenuModeButton>
		<MenuModeButton set={"compendium"} mode={screenMode} setMode={setScreenMode} gardenButtonHover={"compendium"} mouseOver={() => screenFunc("compendium")} style={{ background: "#664422", height:60}}>{"Compendium"}</MenuModeButton>
		<MenuModeButton set={"inspect"} mode={gardenMode} setMode={setGardenMode} style={{marginTop:30}}>{"Inspect"}</MenuModeButton>
		<MenuModeButton set={"harvest"} mode={gardenMode} setMode={setGardenMode}>{"Harvest"}</MenuModeButton>
		<MenuModeButton set={"protect"} mode={gardenMode} setMode={setGardenMode} style={{backgroundColor:"#662266"}}>{"Protect"}</MenuModeButton>
	</>)
}, func.jsonEqual);

export const GardenMain = memo((props) =>{
	const {compendium, states} = useContext(mainContext);
	const {draggable} = useContext(dragContext);
    const handleCompendium = (action, e) =>{
		if(action === "hover"){
			if(draggable){
			}
		}
		else if(action === "release"){
			if(draggable.info.id === "gardenTile" && draggable.info.args.plant.id){
				compendium["plants"][draggable.info.args.plant.id].unlocked = true;
				states.setCompendium(func.objClone(compendium));
				states.setCompendiumPlant(draggable.info.args.plant.id);
			}
		}
	}
	return (
		<>
			{states["gardenScreen"] === "garden" ? <div className={c("gardenContainer")}>
				{[...Array(states["garden"]["screens"][0]["Y"])].map((entry, index) => (
					<div className={c("gardenRow")} key={index}>
						{[...Array(states["garden"]["screens"][0]["X"])].map((entry2, index2) => {
							let coords = states["garden"]["screens"][0].gridToCoords(index2, index);
							return <GardenTile key={index2} coords={{screen:0, X:index2, Y:index, coords:coords}} tile={states["garden"]["screens"][0]["grid"][coords]} />
						})}
					</div>
				))}
			</div>
			: states["gardenScreen"] === "storage" ? <div className={c("gardenStorage gardenContainer")}>
				{[...Array(states["garden"]["screens"][1]["Y"])].map((entry, index) => (
					<div className={c("gardenRow")} key={index}>
						{[...Array(states["garden"]["screens"][1]["X"])].map((entry2, index2) => {
							let coords = states["garden"]["screens"][1].gridToCoords(index2, index);
							return <GardenTile key={index2} coords={{screen:1, X:index2, Y:index, coords:coords}} tile={states["garden"]["screens"][1]["grid"][coords]} />
						})}
					</div>
				))}
			</div>
			: states["gardenScreen"] === "compendium" ? 
				<div className={c("full flex-column")}
				onMouseOver={(e) => handleCompendium("hover", e)} onMouseUp={(e) => handleCompendium("release", e)}>
					<div>
						<div style={{paddingTop:5}}>{"Drag unknown plants here to discover them."}</div>
					</div>
					<div className={c("full flex")}>
						<div className={c("compendiumList scroll1")}>
							{states["compendium"]["plantOrder"].map((entry2, index2) => (
								<React.Fragment key={entry2.id}>
									<CompendiumList plant={entry2} />
								</React.Fragment>
							))}
						</div>
						<div className={c("compendiumPlantDisplay full")}>
							<div style={{display:"flex", justifyContent:"flex-start"}}>
								<div className={c("flex-column")}>
									<CompendiumTile />
									<div className={c("center")}>{states["compendiumPlant"] ? states["compendium"]["plants"][states["compendiumPlant"]].name : ""}</div>
								</div>
								<div className={c("flex-column")}>
									<CompendiumKnowledgeBar />
									<div style={{display:"flex", justifyContent:"space-between"}}>
										<AddKnowledgeButton amount={1}>{"add 1 knowledge"}</AddKnowledgeButton>
										<AddKnowledgeButton amount={"max"}>{"add all knowledge"}</AddKnowledgeButton>
									</div>
								</div>
							</div>
							<div className={c("full")}>
								<CompendiumStats />
							</div>
						</div>
					</div>
				</div>
			: <></>}
        </>
	)
}, func.jsonEqual);

function GardenTile(props) {
	//<GardenTile key={index2} states={states} coords={[index2, index]} plant={states["garden"].findTile(index2, index).plant} />
    const {draggable, setDraggable} = useContext(dragContext);
	const {garden, resources, states} = useContext(mainContext);
	if(!props.tile){
		return (
			<div className={c(`gardenTile center${draggable.info && !draggable.dragOff ? " dragged" : ""}`)}>
				<div className={c("GTInner center")}>
					<div className={c("GTInnerBackground")}>
						{props.content}
					</div>
				</div>
			</div>
		)
	}
	const tile = props.tile;
	const plant = tile.plant;
	const coords = props.coords;
	const gardenMode = states["gardenMode"];
	//const id = tile.gridToCoords(coords);
	//const modifier = props.item;
	const handleDrag = (e) =>{
		if (plant) {
			setDraggable({ elem: <DragGhost className={c("gardenGhost center")} style={{opacity:1, border:"1px solid black"}}>{plant.name}</DragGhost>, e:e, type:"down", dragOff:true, info:{args:tile, id:"gardenTile", origin:coords}});
		}
	}
	const handleDragOver = (e) =>{
		if (draggable.info && draggable.info.id === "gardenTile" && tile.unlocked && !draggable.dragOff) {
			setDraggable({type:"hover", info:{tile:tile, origin:coords}})
		}
	}
	const handleDragLeave = (e, release) =>{
		
		if(release){
			if(draggable && draggable.dragOff){
				if(gardenMode === "protect" && tile.unlocked){
					let newState = garden;
					let tile = newState["screens"][coords.screen]["grid"][coords.coords];
					tile.protected = !tile.protected;
					states.setGarden(func.objClone(newState));
				}
				else if(gardenMode === "harvest" && !tile.protected && states["garden"]["screens"][coords.screen]){
					let harvest = tile.harvest(); //todo: needs fixing (newstate?)
					if(harvest){
						states.setResources(func.objClone(resources));
						states.setGarden(func.objClone(garden));
						func.updateEffects("garden");
					}
				}
			}
			if(draggable.info && draggable.info.id === "gardenTile" && tile.unlocked){
				//const tile2 = draggable.info.origin;
				//todo: do not trigger this if the coords are the same.
				garden.swap(draggable.info.origin, props.coords);
				//newState["screens"][props.coords.screen]["grid"][props.coords.Y][props.coords.X] = [newState["screens"][tile2.screen]["grid"][tile2.Y][tile2.X],
				//newState["screens"][tile2.screen]["grid"][tile2.Y][tile2.X] = newState["screens"][props.coords.screen]["grid"][props.coords.Y][props.coords.X]][0] //swap two values without creating a third one.
				states.setGarden(func.objClone(garden));
				func.updateEffects("garden");
			}
		}
		setDraggable({type:"hover", info:undefined});
	}
	//const current = draggable.info && draggable.info.origin === coords && draggable.hover && draggable.hover. ?
	const current = draggable.hover && draggable.info && JSON.stringify(draggable.info.origin) === JSON.stringify(coords) ?
		draggable.hover.tile
	: draggable.hover && draggable.info && JSON.stringify(draggable.hover.origin) === JSON.stringify(coords) ?
		draggable.info.args
	:
		tile
	const tooltip = renderToStaticMarkup(<GardenTileDescr screen={states["garden"]["screens"][props.coords.screen]} tile={current} />);
	if (current.plant) {
		//, background:props.plant.BG
		//style={{background:"url(./images/Plant" + growStage + ".png"}}
		return (
			<div className={c(`gardenTile center${!tile.unlocked ? " disabled" : " dragValid"}${draggable.info && !draggable.dragOff && JSON.stringify(draggable.info.origin) === JSON.stringify(coords) ? " dragged" : ""}`)}
			onMouseDown={(e) => handleDrag(e)} onMouseOver={(e) => handleDragOver(e)} onMouseLeave={(e) => handleDragLeave(e)} onMouseUp={(e) => handleDragLeave(e, true)}
			style={tile.protected ? {backgroundColor:"#662266"} : {}}>
				<div className={c(`inner center`)}
				data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={draggable.hover ? "" : tooltip}>
					<div className={c("plant")} style={{ backgroundImage: `url(${img["Plant" + current.plant.growStage()]})`, backgroundColor: current.plant.BG }}>
					</div>
				</div>
			</div>
		)
	}
	else {
		return (
			<div className={c(`gardenTile center${!props.tile.unlocked ? " disabled" : " dragValid"}${draggable.info && !draggable.dragOff && JSON.stringify(draggable.info.origin) === JSON.stringify(coords) ? " dragged" : ""}`)}
			onMouseOver={(e) => handleDragOver(e)} onMouseLeave={(e) => handleDragLeave(e)} onMouseUp={(e) => handleDragLeave(e, true)}
			style={tile.protected ? {backgroundColor:"#662266"} : {}}>
				<div className={c(`inner center`)}
				data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={draggable.hover ? "" : tooltip}>
					<div className={c("plant")}>
					</div>
				</div>
			</div>
		)
	}
}

function GardenTileDescr(props){
	
	const tile = props.tile;
	//const coords = props.screen.gridToCoords({X:tile.X, Y:tile.Y});
	const plant = tile.plant;

	//how to explain the difference between the following?
	//stats["add"][X]["base"] //raises X
	//stats["add"][X]["extra"] //adds to the base if it exists
	//stats["add"][X]["mult"] //multiplies the base if it exists (after the extra stat)
	//stats["mult"][X]["base"] //multiplies X by the value +1
	//stats["mult"][X]["extra"] //adds to the base if it exists
	//stats["mult"][X]["mult"] //multiplies the base if it exists (after the extra stat)
	//aura["add"][X]["base"] //aura that affects 8 surrounding plants which increases add[X]["base"]
	//aura["add"][X]["extra"] //aura that affects 8 surrounding plants which increases add[X]["extra"]
	//aura["add"][X]["mult"] //aura that affects 8 surrounding plants which increases add[X]["mult"]
	//aura["mult"][X]["base"] //aura that affects 8 surrounding plants which increases mult[X]["base"]
	//aura["mult"][X]["extra"] //aura that affects 8 surrounding plants which increases mult[X]["extra"]
	//aura["mult"][X]["mult"] //aura that affects 8 surrounding plants which increases mult[X]["mult"]
	//there's also a permAura version of aura that raises stats slowly but permanently.
	const allStats = itemStats(tile["effects"]["main"], {include:["base", "mult", "harvest", "aura", "permAura"]}, tile["effects"]["auraEffects"]);
	return (
		<div>
			{plant ? <>
				<div>{`${plant["name"]}`}</div>
				<div>{`${plant["descr"]}`}</div>
				<div>{`Growth: ${plant["growth"]}/${plant["maxGrowth"]} (${func.round(plant.growMult() * 100)}%)`}</div>
				<div style={{backgroundColor:"#449977", color:"#000000", marginTop:"1vh", border:"1px solid #116644"}}>
					{Object.entries(allStats).map(([index, entry]) => (
						<React.Fragment key={index}>{entry}</React.Fragment>
					))}
				</div>
			</>
			: tile["unlocked"] ?
				<div>{"An empty tile"}</div>
			:
				<div>{"A locked tile. Nothing can grow here."}</div>
			}
		</div>
	)
}

function CompendiumList(props){
	const {states} = useContext(mainContext);
	const handleClick = (e) =>{
		if(props.plant.unlocked || true){
			states.setCompendiumPlant(props.plant.id);
		}
	}
	return  (
		<div className={c("btn-compendium center")} style={{border:"1px solid black", padding:4}} onClick={(e) => handleClick(e)}>
			{props.plant.unlocked ? props.plant.name : "???"}
		</div>)
}

function CompendiumTile(props){
	const {compendium, states} = useContext(mainContext);
	const plant = compendium["plants"][states["compendiumPlant"]];
	if(!plant){
		return (
			<div className={c("compendiumTile center")}>
				<div className={c("inner center")} style={{margin:5}}>
					<div className={c("plant")} style={{margin:5}}>
					</div>
				</div>
			</div>
		)
	}
	else{
		return (
			<div className={c("compendiumTile center")}>
				<div className={c("inner center")} style={{margin:5}}>
					<div className={c("plant")} style={{margin:5}}>
						{plant.icon}
					</div>
				</div>
			</div>
		)
	}
}

function CompendiumKnowledgeBar(props){
	const {compendium, states} = useContext(mainContext);
	const plant = compendium["plants"][states["compendiumPlant"]];
	if(plant){
		return (<div style={{width:400, border:"1px solid black", height:20, position:"relative"}}>
			<div className={c("center full")} style={{position:"absolute"}}>
				<div style={{zIndex:1}}>{`${plant.knowledge}/${plant.knowCap}`}</div>
			</div>
			<div style={{width:`${plant.knowledge / plant.knowCap * 100}%`, height:"100%", backgroundColor:"#447744", float:"left"}}></div>
		</div>)
	}
	else{
		return (<div style={{width:400, border:"1px solid black", height:20}}>
		</div>)
	}
}
function CompendiumStats(props){
	const {compendium, states} = useContext(mainContext);
	const plant = compendium["plants"][states["compendiumPlant"]];
	if(plant){
		/*let plantStats = tile["effects"]["total"];
		let auraStats = tile["effects"]["aura"];
		let harvestStats = tile["effects"]["harvest"];*/
		/*const stats = {...(plant["stats"]["add"] ? {add:plant["stats"]["add"]} : {}),
			...(plant["stats"]["mult"] ? {mult:plant["stats"]["mult"]} : {})};
		const aura = plant["stats"]["aura"];*/
		const pools = plant["pools"];
		const hasPools = pools.length;
		const allStats = itemStats(plant["stats"]);
		return (<div>
			{hasPools ? 
				<div>{"Appearances: "}
					{pools.map((entry, index) => {
						let reqStats = itemStats(entry.condition);
						return (<div key={index} style={{display:"flex", flexDirection:"column", backgroundColor:"#447799"}}> 
							<div style={{display:"flex"}}>
								<span style={{border:"1px solid black", padding:3, marginRight:3}}>{`Pool: ${entry["pool"]}`}</span>
								<span style={{border:"1px solid black", padding:3}}>{`Weight: ${entry["weight"]}`}</span>
							</div>
							{entry.condition ? 
								<div style={{border:"2px solid black", display:"flex", flexDirection:"column"}}>
									<span>{"required stats: "}</span>
									{Object.entries(reqStats).map(([index2, entry2]) => {
										return <React.Fragment key={index2}>{entry2}</React.Fragment>
									})}
								</div>
							:
								<></>}
						</div>)
					})}
				</div>
			: <></>}
			<div style={{backgroundColor:"#449977", color:"#000000", marginTop:"1vh", border:"1px solid #116644"}}>
				{Object.entries(allStats).map(([index, entry]) => (
					<React.Fragment key={index}>{entry}</React.Fragment>
				))}
				
			</div>
		</div>)
	}
	else{
		return <></>;
	}
}

function AddKnowledgeButton(props){
	const {compendium, resources, states} = useContext(mainContext);
	const plant = compendium["plants"][states["compendiumPlant"]];
	const handleClick = (e) => {
		if(plant){
			let amount = props.amount
			if(amount === "max"){
				amount = resources["knowledge"]["amount"];
			}
			amount = Math.min(plant["knowCap"] - plant["knowledge"], resources["knowledge"]["amount"], amount);
			if(amount > 0){
				compendium.addKnowledge("plants", states["compendiumPlant"], amount);
				resources["knowledge"].sub(amount);
				states.setCompendium(func.objClone(compendium));
				states.setResources(func.objClone(resources));
			}
		}
	}
	return (<div className={c(`btn-compendium${!plant ? " btnDisabled" : ""}`)} style={{borderRadius:2, margin:1, padding:3}} onClick={(e) => handleClick(e)}>
		{props.children}
	</div>)
}