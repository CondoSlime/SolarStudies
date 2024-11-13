import React, {memo, useRef, useState, useEffect, useContext} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {softReset} from './save.js';
import * as func from './functions.js';
import {c} from './functions.js';
import * as img from '../images';
import {ParticleCanvas} from './Particles.js';
import {mainContext} from '../App.js';
//import {global} from '../App.js';
import {RsDisplay} from './comps';

export const StarsSub = memo((props) =>{
	const {states, values, statList} = useContext(mainContext);
	//const {draggable, setDraggable} = useContext(dragContext);
	return (<>
			<RsDisplay>{`Star Power: ${func.floor(statList.stat("starPower"), 0)}`}</RsDisplay>
			{states["starsScreen"] === -1 ?
				values["starColors"].map((entry, index) => {
					let resName = `${entry}Power`;
					let res = states["resources"][resName];
					return <RsDisplay key={index}>{`${entry} Power: ${func.floor(res.amount, 0)}`}</RsDisplay>
				})
			:
				(() => {
					let color = states["stars"]["main"][states["starsScreen"]].color;
					let res = states["resources"][`${color}Power`];
					return <RsDisplay>{`${color} Power: ${func.floor(res.amount, 0)}`}</RsDisplay>
				})()
			}
	</>)
}, func.jsonEqual);

export const StarsMain = memo((props) =>{
	const {resources, states, store, statList} = useContext(mainContext);
	const starBackgroundContainerRef = useRef(undefined);
	const starBackgroundRef = useRef(undefined);
	const starUpgradeRef = useRef(undefined);
	const starsScreen = states["starsScreen"];

	const updateStarBackGround = (X, Y) =>{
		if(starBackgroundRef.current && starBackgroundContainerRef.current){ //background size = 25%/3 = 8.333%
			let posX = ((X / 1.8) % (starBackgroundRef.current.offsetWidth/12)) - (starBackgroundRef.current.offsetWidth/2);
			let posY = ((Y / 1.8) % (starBackgroundRef.current.offsetHeight/12)) - (starBackgroundRef.current.offsetHeight/2);
			//posX = - (starBackgroundRef.current.offsetWidth/2);
			//posY = - (starBackgroundRef.current.offsetHeight/2);
			//todo: Change zooming the screen to move the background relative to its position, so it never shows parts that are out of bounds.
			starBackgroundRef.current.style.left = `${posX}px`;
			starBackgroundRef.current.style.top = `${posY}px`;
			starUpgradeRef.current.style.left = `${X}px`;
			starUpgradeRef.current.style.top = `${Y}px`;
		}
	}
	useEffect(() => {
		let storeX = 0;
		let storeY = 0;
		let posX = 0;
		let posY = 0;
		const handleMouse = (action) =>{
			const e = action.e || window.e;
			if(states["starsDrag"] && action.type === "move"){
				posX = storeX + (e.clientX - store["mouse"]["startX"]);
				posY = storeY + (e.clientY - store["mouse"]["startY"]);
				updateStarBackGround(posX, posY);
			}
			if(action.type === "up"){
				storeX = posX
				storeY = posY
				states.setStarsDrag(false);
			}
		}
		const mouseDown = window.addEventListener('mousedown', (e) => handleMouse({type:"down", e:e}));
		const mouseMove = window.addEventListener('mousemove', (e) => handleMouse({type:"move", e:e}));
		const mouseUp = window.addEventListener('mouseup', (e) => handleMouse({type:"up", e:e}));
		return () => { //to remove double-assigned event listener.
			window.removeEventListener('mousedown', mouseDown);
			window.removeEventListener('mousemove', mouseMove);
			window.removeEventListener('mouseup', mouseUp);
		}
	}, [states, store, starsScreen]);
	const ascendConfirm = (star) =>{
		if(states["starsAscension"]){
			states.setStarsAscension(false);
			states.setPopupBox({
				text:"Do you want to proceed? Going further means resetting most of your progress, including power, upgrades, energizer elements and garden plants, but your star power will be converted into colored power which can be spent on permanent upgrades.",
				buttons:[{text:"Ok", func:() => ascend(star)}, {text:"Cancel"}]
			});
		}
	}
	const ascend = (star) =>{
		let color = star["color"];
		let power = resources[`${color}Power`];
		let amount = statList.stat("starPower") - power.amount;
		if(amount > 0){
			power.add(amount);
		}
		states.setStarsScreen(star["id"]);
		softReset();
	}
	return (states["starsScreen"] === -1 ?
		<div className={c("mainStars")}>
			<CenterStar />
			{states["starsAscension"] ? <CenterStarLine /> : <></>}
			{Object.entries(states["stars"]["main"]).map(([index, entry]) => (
				<MainStar key={index} star={entry} onClick={() => ascendConfirm(entry)}/>
			))}
		</div>
	: states["starsScreen"] > -1 ?
		<div ref={starBackgroundContainerRef} style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"move", overflow:"hidden"}} onMouseDown={(e) => states.setStarsDrag(true)}>
			
			{/*<img src={img["starBackground"]} style={{width:100, height:100}}/>*/}
			{<div className={c("starsBack")} style={{position:"absolute", top:0, left:0, zIndex:3, background:"#888888", border:"1px solid black", margin:4, padding:"10px 20px", cursor:"pointer"}} onClick={(e) => states.setStarsScreen(-1)}>Back</div>}
			<div style={{width:0, height:0, position:"relative"}}>
				{<div ref={node => {starBackgroundRef.current = node
					/*starBackgroundCallback(node)*/}} className={c("starBackground")}>
					{<div style={{position:"absolute", left:"50%", top:"50%", background:"white", color:"black"}}></div>}
				</div>}
				{/*<Canvas className="starBackgroundCanvas" propRef={starBackgroundRef} draw={{img:"starBackground",W:"100%",H:"100%",iW:10,iH:10}} />*/}
				<div ref={node =>{starUpgradeRef.current = node
					/*starUpgradesCallback(node)*/}} className={c("starUpgrades")}>
					{Object.entries(states["stars"]["upgrades"][states["starsScreen"]]).map(([index, entry]) =>{
						return (<StarsUpgrade key={index} upgrade={entry} />)
					})}
					{Object.entries(states["stars"]["connects"][states["starsScreen"]]).map(([index, entry]) =>{
						return (entry.map((entry2, index2) =>{
							let upgrades = states["stars"]["upgrades"][states["starsScreen"]];
							/*let Xdist = upgrades[entry2[0]]["X"] - upgrades[index]["X"];
							let Ydist = upgrades[entry2[0]]["Y"] - upgrades[index]["Y"];
							let length = (Math.abs(Xdist)**2 + Math.abs(Ydist)**2)**0.5;
							let rot = (Xdist < 0 ? -180 : 0);
							if(Ydist){
								rot += Math.atan(Ydist/Xdist) * (180/Math.PI)
							}*/
							if(states["stars"]["upgrades"][states["starsScreen"]][index].visible && states["stars"]["upgrades"][states["starsScreen"]][entry2[0]].visible){
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
	:
		<></>
	)
}, func.jsonEqual);


export function CenterStar(props){
	const {states} = useContext(mainContext);
	const handleClick = (e) =>{
		states.setStarsAscension(!states["starsAscension"]);
	}
	const tooltip = renderToStaticMarkup(<>Click this star and then another star to ascend.<br/>WARNING: Doing this will reset most of your progress<br/>in return for a new resource to spend.</>);
	return (<div className={c("centerStar hoverBorder")} style={{...props.style}} onClick={(e) => handleClick(e)}
	data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={tooltip}>

	</div>)
}

export function CenterStarLine(props){
	const ref = useRef(undefined);
	const starLineRef = useRef(undefined);
	const canvasRef = useRef(undefined);
	let canvasSize = 100;
	const [visibleInfo, setVisibleInfo] = useState({});
	const origin = (e) =>{
		let origX = 0;
		let origY = 0;
		if(e.target && e.target.classList.contains("mainStar")){
			const targetRect = e.target.getBoundingClientRect();
			origX = targetRect.left + (e.target.offsetWidth/2);
			origY = targetRect.top + (e.target.offsetHeight/2);
		}
		else{
			origX = e.clientX;
			origY = e.clientY;
		}
		return [origX, origY];
	}
	useEffect(() => {
		const event = (e) => {
			const rect = ref.current.getBoundingClientRect();
			let o = origin(e)
			let origX = o[0];
			let origY = o[1];
			let rot = func.lineRotAngle(origX-rect.left, origY-rect.top);
			let dist=Math.floor((origX-rect.left)**2+(origY-rect.top)**2)**0.5 //a^2 + b^2 = c^2
			if(e.target && e.target.classList.contains("centerStar")){
				dist = 0;
			}
			if(visibleInfo.visible !== !!dist){
				setVisibleInfo({visible:!!dist, dist:dist, origin:o, rect:rect, rot:rot});
			}
			if(starLineRef.current){ //todo: this triggers once instance too late.
				starLineRef.current.style.width = dist + "px";
				starLineRef.current.style.transform = `translate(0px, -50%) rotate(${rot}deg)`;
			}
			if(canvasRef.current){ //todo: this triggers once instance too late.
				canvasRef.current.style.left = origX-rect.left - (canvasSize/2) + "px";
				canvasRef.current.style.top = origY-rect.top - (canvasSize/2) + "px";
			}
		}
		window.addEventListener('mousemove', event);
		//window.dispatchEvent(new Event('mousemove'));
		return () => {
			window.removeEventListener('mousemove', event);
		}
	}, [canvasSize, visibleInfo]);
	let params = {
		dur:300,
		particles:1,
		interval:14,
		size:12,
		accel:0.4,
		img:img["particle"],
		color:"#992222"
	}
	return (
		<>
		<div ref={ref} style={{position:"absolute", top:"50%", left:"50%"}}>
			{visibleInfo.dist ? <>
				<div ref={starLineRef} style={{background:"#888888", position:"relative", height:8, width:visibleInfo.dist, transformOrigin:"left", transform:`translate(0, -50%) rotate(${visibleInfo.rot}deg)`, pointerEvents:"none", zIndex:2}}/>
				<div style={{position:"absolute", zIndex:1, pointerEvents:"none", left:visibleInfo.origin[0]-visibleInfo.rect.left-(canvasSize/2), top:visibleInfo.origin[1]-visibleInfo.rect.top-(canvasSize/2)}} ref={canvasRef}>
					<ParticleCanvas params={params} style={{height:canvasSize, width:canvasSize}}/>
				</div>
			</>
			:
				<></>}
		</div>
		</>
	)
}

export function MainStar(props){
	const {states} = useContext(mainContext);
	return <div className={c("mainStar hoverBorder")} style={{left:`${props.star.X}%`, top:`${props.star.Y}%`, zIndex:10}}
	onClick={() => ((states["starsAscension"] || states.setStarsScreen(props.star["id"])) && (props.onClick ? props.onClick() : ""))}></div>
}

export function StarsUpgrade(props){
	const {stars, store, states} = useContext(mainContext);
	const upgrade = props.upgrade;
	//const [mouse, setMouse] = useState({X:0, Y:0});
	const handlePurchase = (e) =>{
		//if(Math.abs(e.clientX-global["store"]["mouse"]["startX"]) + Math.abs(e.clientY-global["store"]["mouse"]["startY"]) < 30){
		if(store["mouse"]["dist"] < 30){
			const item = stars["upgrades"][upgrade.mainId][upgrade.id];
			if(upgrade["unlocked"] && func.purchase(item, 1, item.getPrice(1), "stars")){
			//if(upgrade.unlocked && stars["upgrades"][upgrade.mainId][upgrade.id].tryPurchase(1)){
				states.setStars(func.objClone(stars));
				func.updateEffects("stars");
			}
		}
	}
	/*const handleDown = (e) =>{
		setMouse({X:e.clientX, Y:e.clientY});
	}*/
	if(upgrade.unlocked){
		let tooltip = renderToStaticMarkup(<>
			<div>{upgrade.name}</div>
			<div>Cost:</div>
			{Object.entries(upgrade.price).map(([index, entry]) => {
				return <div key={index}>{`${states["resources"][index]["name"]}: ${entry}`}</div>
			})}
		</>);
		return (
			<div style={{display:"flex", flexDirection:"column", position:"absolute", left:(upgrade["X"]-(upgrade["size"]/2)), top:(upgrade["Y"]-(upgrade["size"]/2)), zIndex:2, alignItems:"center"}}>
				<div style={{backgroundSize:"100% 100%", width:upgrade["size"], height:upgrade["size"], cursor:"pointer", backgroundImage:`url(${img[upgrade["img"]]})`, ...(props.style || {})}}
				onMouseUp={(e) => handlePurchase(e)}
				data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={tooltip} data-tooltip-offset={25}></div>
				<div style={{color:"white", textAlign:"center", position:"relative", width:0, display:"flex", justifyContent:"center"}}>{`${upgrade["bought"]}/${upgrade["cap"]}`}</div>
			</div>)
	}
	else if(upgrade.visible){
		let tooltip = renderToStaticMarkup(<div>Locked.</div>);
		return (
			<div style={{display:"flex", flexDirection:"column", position:"absolute", left:(upgrade["X"]-(upgrade["size"]/2)), top:(upgrade["Y"]-(upgrade["size"]/2)), zIndex:2, alignItems:"center"}}>
				<div style={{backgroundSize:"100% 100%", width:upgrade["size"], height:upgrade["size"], backgroundImage:`url(${img["starGifBlack"]})`, filter:"invert(9%) sepia(100%) saturate(6821%) hue-rotate(248deg) brightness(94%) contrast(145%)", ...(props.style || {})}}
				data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={tooltip} data-tooltip-offset={25}></div>
				<div className={c("centerText")} style={{color:"white", position:"relative", width:0}}>{`${upgrade["bought"]}/${upgrade["cap"]}`}</div>
			</div>)
	}
	else{
		return <></>;
	}
}

export function StarUpgradeLine(props){
	const coords = props.coords;
	let Xdist = coords.endX - coords.startX;
	let Ydist = coords.endY - coords.startY;
	let length = (Math.abs(Xdist)**2 + Math.abs(Ydist)**2)**0.5;
	/*let rot = (Xdist < 0 ? -180 : 0);
	//if(Xdist){ //division by 0 is ok for atan
		rot += Math.atan(Ydist/Xdist) * (180/Math.PI);*/
	let rot = func.lineRotAngle(Xdist, Ydist);
	//}
	//else{
	//	rot += (Ydist < 0 ? -90 : 90);
	//}
	
	return <div style={{position:"absolute", left:coords.startX, top:coords.startY, width:length, transform:`rotate(${rot}deg) translate(0, -50%)`, transformOrigin:"top left", height:4, zIndex:1, opacity:0.5, ...(props.style || {})}}></div>													
}