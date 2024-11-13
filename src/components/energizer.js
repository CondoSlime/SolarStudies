import React, {memo, useContext} from 'react';
import {MenuModeButton, DragGhost} from './comps';
import * as func from './functions.js';
import {c} from './functions.js';
import {mainContext, dragContext, stateContext} from '../App.js';

export const EnergizerSub = memo((props) =>{
	const {states} = useContext(mainContext);
	const mode = states["energizerMode"];
	const setMode = states.setEnergizerMode;
	return (<>
			<MenuModeButton set={"energizer"} mode={mode} setMode={setMode} style={{fontSize: '12px'}}>{"Energizer"}</MenuModeButton>
			<MenuModeButton set={"upgrades"} mode={mode} setMode={setMode} style={{fontSize: '12px'}}>{"Upgrades"}</MenuModeButton>
			<MenuModeButton set={"modules"} mode={mode} setMode={setMode} style={{fontSize: '12px'}}>{"Modules"}</MenuModeButton>
			<div style={{height:10, borderTop:"1px solid black", marginTop:10}}/>
			{states.energizerMode === "energizer" ? 
				Object.entries(states["energizer"]["allModules"]).map(([index, entry]) => (
					<EnergizerElem key={index} module={entry}>{states["energizer"]["allModules"][index]["name"]}</EnergizerElem>
				))
			:states.energizerMode === "upgrades" ?
				<>
				</>
			:states.energizerMode === "modules" ?
				Object.entries(states["energizer"]["allModifiers"]).map(([index, entry]) => (
					<ModifierElem key={index} item={entry}>{entry.name}</ModifierElem>
				))
			: <></>}
	</>)
}, func.jsonEqual);

/*export const EnergizerMain = memo((props) =>{
	const {states} = useContext(mainContext);
	return (
		states.energizerMode === "energizer" ? 
			<div className={c("energizerContainer")}>
				{[...Array(states["energizer"]["Y"])].map((entry, index) => (
					<div className={c("energizerRow")} key={index}>
						{[...Array(states["energizer"]["X"])].map((entry2, index2) => {const i=states["energizer"].gridToCoords(index2, index);
							return <Tile key={index2} id={i} />
						})}
					</div>
				))}
			</div>
		:states.energizerMode === "upgrades" ?
			<div className={c("energizerUpgrContainer")}>
				{Object.entries(states["energizer"]["allModules"]).map(([index, entry]) => (
					(entry["visible"] ?
						<EnergizerUpgradeElem item={entry} key={index}/>
					:
						<React.Fragment key={index}/>)
				))}
			</div>
		:states.energizerMode === "modules" ?
			Object.entries(states["energizer"]["allModules"]).map(([index, entry]) => (
				<div key={entry["id"]} style={{display:"flex", minHeight:"100px"}}>
					<div style={{display:"flex", minHeight:"50px", padding:2}}>
						{[...Array(Math.ceil(entry.currModifiers/2))].map((entry2, index2) => (
							<div key={index2}>
							{[...Array(Math.min(entry.currModifiers-(index2*2), 2))].map((entry3, index3) => (
								<Modifier key={index3} id={(index2*2+index3)} item={entry} />
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
		
	)
}, func.jsonEqual);*/

export const EnergizerMain = memo((props) =>{
	const {states, energizer} = useContext(mainContext);
	const {draggable, setDraggable} = useContext(dragContext);
    const height = Math.min(states["energizer"]["X"], 2) + ((states["energizer"]["Y"]-1) * 2);
	/*const handleDragOver = (e) =>{
		if(draggable.active){
			setDraggable({type:"info", info:{energizerContainer:true}}); //tracked value for dragging modules off the grid to clear them, value should be true while dropping a module causes a clear.
		}
	}*/
	const handleDragLeave = (e, release=false) =>{
		if(draggable.active){
			if(release && e.target.classList.contains("energizerContainer") && draggable.info.id === "energizerTile"){
				let newState = energizer;
				energizer["grid"][draggable.info.origin].init();
				newState.update();
				states.setEnergizer(func.objClone(newState));
			}
			//setDraggable({type:"info", info:{energizerContainer:false}}); //mouse unclicked or moved off the container
		}
	}
	/*const handleMouseMove = (e) =>{
		if(draggable.active){
			setDraggable({type:"info", info:{energizerContainer:false}}); //mouse moved on hexgrid
		}
	}*/
	return (
		<div className={c("energizerContainer full")} onMouseLeave={(e) => handleDragLeave(e)} onMouseUp={(e) => handleDragLeave(e, true)}>
			{states.energizerMode === "energizer" ? 
				<div className={c("hexGrid")} style={{background:"black", "--gridSize":`150px`, "--borderSize":`4px`, padding:10, boxShadow:"0 0 3px 3px #000000", borderRadius:10}}>
				
					{[...Array(height)].map((entry, index) => {
						if(!(index%2) || states["energizer"]["X"] >= 2){
							const width = Math.ceil((states["energizer"]["X"] - (index%2 ? 1 : 0)) / 2);
							return (
								<div key={index} className={c("hexRow")} /*style={{gap:(size/2), marginTop:(-size*0.45), marginLeft:(size*0.75), alignItems:"flex-start"}}*/>
									{[...Array(width)].map((entry2, index2) => {
										const id = states["energizer"].gridToCoords((index2*2)+index%2, Math.ceil((index-1)/2));
										return (<Tile border={{color:"black"}} key={index2} id={id}></Tile>)
									})}
								</div>
							)
						}
						else{
							return <></>
						}
					})}
				</div>
			:states.energizerMode === "upgrades" ?
				<div className={c("energizerUpgrContainer")}>
					{Object.entries(states["energizer"]["allModules"]).map(([index, entry]) => (
						(entry["visible"] ?
							<EnergizerUpgradeElem item={entry} key={index}/>
						:
							<React.Fragment key={index}/>)
					))}
				</div>
			:states.energizerMode === "modules" ?
				Object.entries(states["energizer"]["allModules"]).map(([index, entry]) => (
					<div key={entry["id"]} style={{display:"flex", minHeight:"100px"}}>
						<div style={{display:"flex", minHeight:"50px", padding:2}}>
							{[...Array(Math.ceil(entry.currModifiers/2))].map((entry2, index2) => (
								<div key={index2}>
								{[...Array(Math.min(entry.currModifiers-(index2*2), 2))].map((entry3, index3) => (
									<Modifier key={index3} id={(index2*2+index3)} item={entry} />
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
		</div>
		
	)
}, func.jsonEqual);

const Tile = (props) =>{
	const {energizer, states} = useContext(mainContext);
	const {mouseElem} = useContext(stateContext);
	const {draggable, setDraggable} = useContext(dragContext);
	//state => energizer, set => setEnergizer
	//const directions = ["up", "right", "down", "left"];
	const content = states["energizer"]["grid"][props.id];
	const dragCoords = draggable.info.id === "energizerTile" ? draggable.info.origin : false;
	const hoverElem = draggable.info.hoverId;
	const handleClick = (e) => {
		//const elem = e.target;
		if (draggable.dragOff) {
			const mousePX = (e.clientX - e.target.getBoundingClientRect().left) / e.target.offsetWidth;
			const mousePY = (e.clientY - e.target.getBoundingClientRect().top) / e.target.offsetHeight;
			const module = current.module;
			if (module["dirType"]) {
				let newState = energizer;
				let state = newState["grid"][props.id];
				//let direction = func.deepClone(state["dir"]);
				let direction = -1;
				//state["direction"].unshift(state["direction"].pop());
				/*if (mousePX + mousePY < 1 && mousePX > mousePY) { // ^
					direction[0] = !direction[0];
				}
				else if (mousePX > mousePY) { // >
					direction[1] = !direction[1];
				}
				else if (mousePX + mousePY > 1) { // v
					direction[2] = !direction[2];
				}
				else if (mousePX + mousePY < 1) { // <
					direction[3] = !direction[3];
				}
				else { // >
					direction[1] = !direction[1];
				}*/
				//top left corner: X=0.25 Y=0
				//top right corner: X=0.75 Y=0
				//right corner: X=1 Y=0.5
				//bottom right corner: X=0.75 Y=1
				//bottom left corner: X=0.25 Y=1
				//left corner: X=0 Y=0.5
				//center: x=0.5 Y=0.5
				if(mousePY <= 0.5){
					if (mousePX - (mousePY/2) >= 0.25 && mousePX + (mousePY/2) <= 0.75) { // UP
						//direction[0] = !direction[0];
						direction = 0;
					}
					else if (mousePX + (mousePY/2) > 0.75) { // UP RIGHT
						//direction[1] = !direction[1];
						direction = 1;
					}
					//else if (mousePX - (mousePY > 0.75 && mousePX > 0.5)) { // UP LEFT
					else{
						//direction[5] = !direction[5];
						direction = 5;
					}
				}
				else{
					if (mousePX - (mousePY/2) > 0.25) { // DOWN RIGHT
						//direction[2] = !direction[2];
						direction = 2;
					}
					else if (mousePX - (mousePY/2) < 0.25 && mousePX + (mousePY/2) > 0.75) { // DOWN
						//direction[3] = !direction[3];
						direction = 3;
					}
					//else if (mousePX + mousePY < 1) { // DOWN LEFT
					else{
						//direction[4] = !direction[4];
						direction = 4;
					}
				}
				//state.setDirection(direction);
				state.toggleDirection(direction);
				states.setEnergizer(func.objClone(newState));
			}
		}
	}
	const handleDragOver = (e) => {
		if (draggable.active && (!draggable.dragOff || draggable.active !== e.target)) {
			setDraggable({type:"info", info:{hoverId:props.id}});
		}
	}
	const handleDragLeave = (e, release = false) => {
		if (draggable.active && draggable.info.id.includes("energizer") && !draggable.dragOff) {
			if (release) {
				let newState = energizer;
				const info = draggable.info;
				const module = info.args.module;
				if(draggable.info.id === "energizerTile"){
					newState.swapTile(props.id, info.origin);
				}
				else{
					newState.placeTile(module.id, props.id, info.origin);
				}
				newState.update();
				states.setEnergizer(func.objClone(newState));
			}
			setDraggable({type:"info", info:{hoverId:undefined}});
		}
	}
	const handleDrag = (e) => { //todo, set a window mouseLeave event that detects whether to clear the element off the board instead of using the global window mouse events.
		if (content.module["id"]) {
			//setDraggable({ elem: <DragGhost className={"energizerGhost center"}>{states["energizer"]    }</DragGhost>, e:e, type:"down", Xoffset:0, Yoffset:0, dragOff:"20", info:{args:content, id:"energizerTile", origin:props.id} });
			setDraggable({ elem: <DragGhost className={"energizer-ghost center"}>{content.module["name"]}</DragGhost>, e:e, type: "down", Xoffset:0, Yoffset:0, dragOff:"20", info:{args:content, id:"energizerTile", origin:props.id}});
			//setDraggable({ elem: <DragGhost className={"energizer-ghost center"}>{content.module["name"]}</DragGhost>, e:e, type: "down", Xoffset:0, Yoffset:0, info: {origin:undefined, id:"energizer", args:ghostModule}})}
		}
	}
	const current = (hoverElem === props.id ?
		draggable.info.args //show current element over hovering element.
	: draggable.info.id === "energizerTile" && props.id === dragCoords && !draggable.dragOff && !isNaN(hoverElem) ? //true when current element is being dragged and hovering over another element
		states["energizer"]["grid"][hoverElem] //show hovering element over current element.
	: mouseElem.classList.contains("energizerContainer") && draggable.info.origin === props.id ?
		new energizer.tile(content["beam"])
	:
		content);
	const dir = current["dir"] ?? current["baseDir"];
	//const directions = dir.map((entry, index) => (content["beam"][index] || entry)); //combine array booleans
	return (
		<div className={c(`hex-border center dragValid${current["module"]["id"] ? " clickable" : ""}${dragCoords === props.id && !draggable.dragOff ? " dragged" : ""}`)} onClick={(e) => handleClick(e)} onMouseDown={(e) => handleDrag(e)} onMouseOver={(e) => handleDragOver(e)} onMouseLeave={(e) => handleDragLeave(e)} onMouseUp={(e) => handleDragLeave(e, true)}>
			<div className={c("hex-main center")}>
				{current["module"]["id"] ? 
					<>
						<span>{current["module"]["name"]}</span>
							{current["module"]["activate"] ? 
								<div style={{bottom:0, height:"15%", width:"80%", position:"absolute", margin:"0 auto"}}>
									<span className={c("center")} style={{position:"absolute", fontSize:"10px", width:"100%", zIndex:1}}>{`${Math.round((states["energizer"]["store"][`show${current["module"]["activate"]}`]) * 100)}%`}</span>
									<div style={{width:`${(states["energizer"]["store"][current["module"]["activate"]]) * 100}%`, height:"100%", background:"#666699"}}>

									</div>
								</div>
							: 
								<></>
							}
					</>
				:
					<></>
				}
				{/*(current["module"].info ?
					current["module"].info["activate"] ? 
						<div style={{bottom:0, height:"15%", width:"80%", position:"absolute", margin:"0 auto"}}>
							<span className={c("center")} style={{position:"absolute", fontSize:"10px", width:"100%", zIndex:1}}>{`${Math.round((states["energizer"]["store"][current["module"].info["activate"]] || 1) * 100)}%`}</span>
							<div style={{width:`${(states["energizer"]["store"][current["module"].info["activate"]] || 1) * 100}%`, height:"100%", background:"#666699"}}>

							</div>
						</div>
					:
						<></>
				:
					<></>
				)*/}
				{current["beam"].map((entry, index) => (
				/*[...Array(6)].map((entry, index) => (*/
					<Bar key={index} rot={index*60}>
						{dir[index] ? 
							<Triangle className={`pointer right`} style={{right:"8%", background:((!isNaN(current["module"]["markDir"]) && current["module"]["markDir"] === index) ? "green" : "white")}} />
						: <></>}
						{content["beam"][index] ? 
							<Line className={``} style={{height:(Math.min(entry, 8) * 1), background:"#8888AA"}} />
						: <></>}
						{/*<Triangle className={`left`} color={"black"} style={{width:"calc((var(--gridSize) - var(--borderSize))*0.5)", height:"calc((var(--gridSize) - var(--borderSize))*0.5*var(--heightMult))", opacity:0.5, transform:"translate(0, -50%) rotate(-90deg)"}}/>*/}
						{<Triangle className={`slice left`} color={"black"} />}
					</Bar>
				))}
			</div>
		</div>
	)
}

export const EnergizerElem = (props) => {
	const {energizer} = useContext(mainContext);
	const {setDraggable} = useContext(dragContext);
	const handleDrag = (actions) => {
		setDraggable(actions);
	}
	const ghostModule = new energizer.tile();
	ghostModule.fill(props.module);
	return (
		<div className={c("btn-energizer")} style={props.style} onMouseDown={(e) => handleDrag({ elem: <DragGhost className={"energizer-ghost center"}>{props.children}</DragGhost>, e:e, type: "down", Xoffset:0, Yoffset:0, info: {origin:undefined, id:"energizer", args:ghostModule}})}>{props.children}</div>
	);
}

export const EnergizerUpgradeElem = memo((props) => {
	const item = props.item;
	const directions = ["up", "right", "down", "left"];
	return (<div className={c("flex")} style={{width:"100%", height:"90px"}}>
		{(item.bought ? 
			<>
				<div className={c(`energizerUpgrTile center`)}>
					{item["name"]}
					{(item["dir"] || []).map((entry, index) => (
						(entry ?
							<Triangle key={index} className={directions[index]} rotation={index * 90} color={(["split"].includes(item["dirType"]) || index === item["markDir"]) ? "green" : "white"} />
						: 
							<React.Fragment key={index}/>)
					))}
				</div>
				{item.upgrades.length ? 
					<div className={c("flex-column")} style={{height:"100%"}}>
						{item.upgrades.map((entry, index) => (
							<div style={{display:"flex", alignItems:"center", height:"100%"}}>
								<div className={c("btn-energizerUpgrade")} style={{flexGrow:1}}>{entry.name}</div>
								<div style={{margin:"0 5px"}}>{`${entry.bought}${entry.cap !== -1 ? `/${entry.cap}` : ""}`}</div>
								<div>{`cost  ${Object.entries(entry.getPrice(1).price).map(([index, entry]) => (
										`\n${entry} ${index}`
								))}`}
								</div>
							</div>
						))}
					</div>
				:
					<></>
				}
			</>
		:
			<>
				<div className={c("energizerUpgrTile center")}>
					<span>
						{"???"}
					</span>
				</div>
				<div className={c("flex-column")} style={{height:"100%"}}>
					<div className={c("flex")} style={{alignItems:"center", height:"100%"}}>
						<div className={c("btn-energizerUpgrade")} style={{marginRight:10, flexGrow:1}}>{"Unlock"}</div>
						<div>{`cost ${Object.entries(item.price).map(([index, entry]) => (
								`\n${entry} ${index}`
						))}`}
						</div>
					</div>
				</div>
			</>
		)}
	</div>)
}, func.jsonEqual)

export const ModifierElem = (props) => {
	const {setDraggable} = useContext(dragContext);
	const handleDrag = (actions) => {
		setDraggable(actions);
	}
	return (
		<div className={c("btn-energizer modifier")} style={props.style} onMouseDown={(e) => handleDrag({ elem: <DragGhost className={"energizerModule center"} style={{border:"1px solid blue", color:"white"}}>{props.item.name}</DragGhost>, e:e, type: "down", Xoffset:window.innerHeight*0.025, Yoffset:window.innerHeight*0.025, info:{origin:undefined, id:"modifier", args:props.item}})}>{props.children}</div>
	);
}

export const Modifier = (props) => {
	const {energizer, states} = useContext(mainContext);
	const {draggable, setDraggable} = useContext(dragContext);
	const modifiers = energizer["allModules"][props.item.id]["modifiers"];
	const modifier = modifiers[props.id];
	//const modifier = props.item;
	const handleClick = (e) =>{

	}
	const handleDrag = (e) =>{
	}
	const handleDragOver = (e) =>{
		if (draggable.info && draggable.info.id === "modifier" && !draggable.dragOff) {
			setDraggable({type:"info", info:{module:{modifier:draggable.info.args.id, module:props.item.id, id:props.id}}})
		}
	}
	const handleDragLeave = (e, release) =>{
		if(draggable.info && draggable.info.id === "modifier" && release){
			energizer["allModules"][props.item.id]["modifiers"][props.id] = draggable.info.args.id;
			energizer.update();
			let newState = energizer;
			states.setEnergizer(func.objClone(newState));
		}
		setDraggable({type:"info", info:{module:undefined}})
	}
	const current = draggable.hover && draggable.hover.module === props.item.id && draggable.hover.id === props.id ?
		energizer["allModifiers"][draggable.hover.modifier]["name"]
	:modifier ?
		energizer["allModifiers"][modifier]["name"]
	:
		""
	return (
		<div className={c("dragValid energizerModule center")} onClick={(e) => handleClick(e)} onMouseDown={(e) => handleDrag(e)} onMouseOver={(e) => handleDragOver(e)} onMouseLeave={(e) => handleDragLeave(e)} onMouseUp={(e) => handleDragLeave(e, true)}>
			{current}
		</div>
	)
}

export const Bar = (props) => {
	return (
		<div className={c("energizerBar")} style={{transform: `rotate(${(props.rot || 0) - 90}deg)`, width: "calc((var(--gridSize) - var(--borderSize))*0.5*var(--heightMult))"}}>
			{props.children}
		</div>
	)
}

export const Line = (props) => {
	return (
		<div className={c("line")} style={{...{overflow: "hidden", width: "99999px", opacity: 0.7}, ...props.style ?? {}}}>
			</div>
	)
}

export const Triangle = (props) => { //direction should be in degrees.
	return (
		<div className={c(`triangle ${props.className || ""}`)} style={props.style || {}}>
		</div>
	)
}