

import React, {useContext, forwardRef, memo} from 'react';
//import ReactDOMServer from "react-dom/server";
import {global, mainContext, dragContext} from '../App.js';
import * as func from './functions.js';
import { ts, loc, c } from './functions.js';
import {ShopSub, ShopMain} from './shop.js';
import {EnergizerSub, EnergizerMain} from './energizer.js';
import {GardenSub, GardenMain} from './garden.js';
import {DungeonSub, DungeonMain} from './dungeon.js';
import {StarsSub, StarsMain} from './stars.js';
import {TestSub, TestMain} from './test.js';
/*import * as img from '../images';*/

ts();
func.ts();
export function SubMenu(props){
	return <div className={c("features-sub")}>
		{/*props.type === "shop" ? <Shop/>
		: props.type === "energizer" ? <Energizer/>
		: props.type === "garden" ? <Garden/>
		: props.type === "dungeon" ? <Dungeon invTileSize={invTileSize}/>
		: props.type === "stars" ? <Stars/>
		: <></>
		*/}
		{/*(() => {
			switch(props.type){
				case 'shop': return <Shop/>;
				case 'energizer': return <Energizer/>;
				case 'garden': return <Garden/>;
				case 'dungeon': return <Dungeon/>;
				case 'stars': return <Stars/>;
				default: return <></>;
			}
		})()*/}
		{{
			"shop":<ShopSub/>,
			"energizer":<EnergizerSub/>,
			"garden":<GardenSub/>,
			"dungeon":<DungeonSub/>,
			"stars":<StarsSub/>,
			"test":<TestSub/>
		}[props.type] || <></>}
	</div>
	
}
export function FeatureMenu(props){
	return <div className={c("features-main")}>
		{{
			"shop":<ShopMain/>,
			"energizer":<EnergizerMain/>,
			"garden":<GardenMain/>,
			"dungeon":<DungeonMain invTileSize={props.invTileSize}/>,
			"stars":<StarsMain/>,
			"test":<TestMain/>
		}[props.type] || <></>}
	</div>
}

export function PopupBox(props){
	return (
		<div className={c("center")} style={{width:"100%", height:"100%", position:"absolute", zIndex:"9999"}}>
			<div className={c("popupBackground")} />
			<div className={c("popupContainer")} style={{width:500, height:250}}>
				<div className={c("center")} style={{flex:"1 1 auto", width:"100%", background:"#666666", padding:5, ...(props.containerStyle || {})}}>
					{props.text || "MISSING TEXT"}
				</div>
				<div style={{height:40, width:"100%", display:"flex", background:"#777777"}}>
					{props.buttons ? props.buttons.map((entry, index) =>{
						return <div className={c("center")} key={index} style={{background:"#444444", margin:"2px 5px", flex:"1 1 0%", cursor:"pointer"}}
						onClick={() => ((entry.func ? entry.func() : {}) + global["states"].setPopupBox({close:true}))}>
							<div>{entry.text || "MISSING TEXT"}</div>
						</div>
					}) : <></>}
				</div>
			</div>
		</div>)
}

export function MainButton(props) {
	const { feature, selectFeature } = useContext(mainContext);
	if (typeof props.unlock == "undefined" || props.unlock) {
		return (
			<div className={c(`btn-main${feature === props.to ? " active" : ""}`)} style={props.style}
			onClick={() => ((props.to ? selectFeature(props.to) : "", props.onClick ? props.onClick() : ""))}>{props.children}</div>
			//<div className={"mainButton" + (feature === props.to ? " disabled" : "")} style={props.style} onClick={() => ((props.to ? selectFeature(props.to) : "", props.onClick))}>{props.content}</div>
		);
	}
	else {
		return <></>;
	}
}

export function MenuButton(props) {
	return (
		<div className={c("btn-menu")} style={props.style} onClick={props.onClick || undefined}>{props.children}</div>
	);
}

export function MenuModeButton(props) {
	//const {draggable} = useContext(dragContext);
	return (
		<div className={c(`btn-menu ${props.set && props.set === props.mode ? "active" : ""}`)} style={props.style || {}}
		onClick={() => ((props.setMode ? props.setMode(props.set) : ""))}
		onMouseOver={(e) => props.mouseOver ? props.mouseOver(e) : ""}>{props.children}</div>
	);
}

export function RsDisplay(props) {
	if (props.children) {
		return (
			<div className={c(`resDisplay ${props.className || ""}`)} style={props.style || {}}>{props.children}</div>
		)
	}
	else {
		return (
			<div className={c(`resDisplay ${props.className || ""}`)} style={props.style || {}}>{props.content}</div>
		)
	}
}

export function DragGhost(props) {
	return (
		<div className={c(props.className)} style={props.style}>{props.children}</div>
	);
}

export function itemStats(stats={}, mods={}, extraStats){
	if(!extraStats){
		extraStats = {};
	}
	let result = {};
	const check = (id) =>{
		return stats[id] && (!mods.include || mods.include.includes(id))
	}
	if(check("weapon")){
		let hasStat = false;
		let ind = "weapon";
		result[ind] = 
		(<div>
			<div style={{display:"flex"}}>
				{stats["weapon"]["minDamage"] || stats["weapon"]["maxDamage"] ? hasStat = true &&
					<div style={{border:"1px solid black", margin:1, padding:1}}>
						<div>{`Base damage: ${stats["weapon"]["minDamage"] ? func.round(Math.min(stats["weapon"]["maxDamage"] ? stats["weapon"]["maxDamage"].total : 0, stats["weapon"]["minDamage"].total), 2) : 0} - ${stats["weapon"]["maxDamage"] ? func.round(stats["weapon"]["maxDamage"].total, 2) : 0}`}</div>
					</div>
				: 
					""}
			</div>
		</div>)
		if(!hasStat){
			delete result[ind];
		}
	}
	if(check("base")){
		let hasStat = false;
		let ind = "base";
		result[ind] = 
			(<div>{/*"Stats: "*/}
				<div style={{display:"flex"}}>
					{Object.entries(stats["base"]).map(([index, entry]) => {
						if(entry || mods.showZero){
							hasStat = true;
							let extraStat = 0;
							if(extraStats["base"]?.[index]){
								extraStat = extraStats["base"][index];
							}
							return (
								<div key={index} style={{border:"1px solid black", margin:1, padding:1}}>
									<div>{`${loc(`stat_${index}`)}: +${func.round(entry, 2)}`}</div>
									{/*entry2["base"] ? <div style={{color:"#882277"}}>{`\u00A0Base ${func.round(entry2["base"], 2)}`}</div> : <></>*/}
									{extraStat ? <div style={{color:"#000088"}}>{`\u00A0ᄂ+${func.round(extraStat*100, 2)}%`}</div> : <></>}
								</div>
							)
						}
						else{
							return <React.Fragment key={index}/>
						}
					})}
				</div>
			</div>)
		if(!hasStat){
			delete result[ind];
		}
	}
	if(check("mult")){
		let hasStat = false;
		let ind = "mult";
		result[ind] = 
			(<div>{"Stats: "}
				<div style={{display:"flex"}}>
					{Object.entries(stats["mult"]).map(([index, entry]) => {
						if(entry || mods.showZero){
							hasStat = true;
							let extraStat = 0;
							if(extraStats["mult"]?.[index]){
								extraStat = extraStats["mult"][index];
							}
							return (
								<div key={index} style={{border:"1px solid black", margin:1, padding:1}}>
									<div>{`${loc(`stat_${index}`)}: +${func.round(entry*100, 2)}%`}</div>
									{/*entry2["base"] ? <div style={{color:"#882277"}}>{`\u00A0Base ${func.round(entry2["base"], 2)}`}</div> : <></>*/}
									{extraStat ? <div style={{color:"#000088"}}>{`\u00A0ᄂ+${func.round(extraStat*100, 2)}%`}</div> : <></>}
								</div>
							)
						}
						else{
							return <React.Fragment key={index}/>
						}
					})}
				</div>
			</div>)
		if(!hasStat){
			delete result[ind];
		}
	}
	if(check("harvest")){
		let hasStat = false;
		let ind = "harvest";
		result[ind] = 
			(<div>{"When harvested: "}
				<div style={{display:"flex"}}>
					{Object.entries(stats["harvest"]).map(([index, entry]) => {
						if(entry || mods.showZero){
							hasStat = true;
							let extraStat = 0;
							if(extraStats["harvest"]?.[index]){
								extraStat = extraStats["harvest"][index];
							}
							return (
								<div key={index} style={{border:"1px solid black", margin:1, padding:1}}>
									<div>{`${loc(`harvest_stat_${index}`)}: +${func.round(entry, 2)}`}</div>
									{/*entry["base"] ? <div style={{color:"#882277"}}>{`\u00A0Base ${func.round(entry["base"], 2)}`}</div> : <></>*/}
									{extraStat ? <div style={{color:"#000088"}}>{`\u00A0ᄂ+${func.round(extraStat*100, 2)}%`}</div> : <></>}
								</div>
							)
						}
						else{
							return <React.Fragment key={index}/>
						}
					})}
				</div>
			</div>)
		if(!hasStat){
			delete result[ind];
		}
	}
	if(check("aura")){
		let hasStat = false;
		let ind = "aura";
		result[ind] = 
		(<div>{`auras: `}
			<div style={{display:"flex"}}>
				{stats["aura"]["mult"] ? Object.entries(stats["aura"]["mult"]).map(([index, entry]) => {
					if(entry || mods.showZero){
						hasStat = true;
						let extraStat = 0;
						if(extraStats["aura"]?.["mult"]?.[index]){
							extraStat = extraStats["aura"]?.["mult"]?.[index];
						}
						return (
							<div key={index} style={{border:"1px solid black", margin:1, padding:1}}>
								<div>{`${loc(`stat_${index}`)}: +${func.round(entry*100, 2)}%`}</div>
								{/*entry2["base"] ? <div style={{color:"#882277"}}>{`\u00A0Base ${func.round(entry2["base"], 2)}`}</div> : <></>*/}
								{extraStat ? <div style={{color:"#000088"}}>{`\u00A0ᄂ+${func.round(extraStat*100, 2)}%`}</div> : <></>}
							</div>
						)
					}
					else{
						return <React.Fragment key={index}/>
					}
				})
				:
					<></>}
				{stats["aura"]["harvest"] ? Object.entries(stats["aura"]["harvest"]).map(([index, entry]) => {
					if(entry || mods.showZero){
						hasStat = true;
						let extraStat = 0;
						if(extraStats["aura"]?.["mult"]?.[index]){
							extraStat = extraStats["aura"]?.["mult"]?.[index];
						}
						return (
							<div key={index} style={{border:"1px solid black", margin:1, padding:1}}>
								<div>{`Harvested ${loc(`harvest_stat_${index}`)}: +${func.round(entry*100, 2)}%`}</div>
								{/*entry["base"] ? <div style={{color:"#882277"}}>{`\u00A0Base ${func.round(entry["base"]*100, 2)}%`}</div> : <></>*/}
								{extraStat ? <div style={{color:"#000088"}}>{`\u00A0ᄂ+${func.round(extraStat*100, 2)}%`}</div> : <></>}
							</div>
						)
					}
					else{
						return <React.Fragment key={index}/>
					}
				})
				:
					<></>}
			</div>
		</div>)
		if(!hasStat){
			delete result[ind];
		}
	}
	return result;
}

export function Empty() {
	return <></>
}

export const DragElem = forwardRef((props, ref) => {
	const {draggable} = useContext(dragContext);
	return <div ref={ref} className={c(`dragging ${draggable.className || ""}`)} style={{...draggable.style}}>{draggable.elem}</div>
});

export const TestRand = memo(() =>{
	return <>{Math.random()}</>
});

export const Memo = memo((props) =>{
	return <>{props.children}</>
})