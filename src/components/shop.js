import React, {memo, useContext} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as func from './functions.js';
import {loc, c} from './functions.js';
import {mainContext} from '../App.js';
//import {global} from '../App.js';
import {MenuButton, RsDisplay, itemStats} from './comps';


export const ShopSub = memo((props) =>{
    let {states} = useContext(mainContext);
    
	const shopBuyAmountHandler = (mode) => {
		let amounts = [1, 10, "max", "round"];
		for (let i = 0; i < amounts.length; i++) {
			if (i + 1 >= amounts.length) {
				states.setShopBuyAmount(amounts[0]);
				return
			}
			else if (mode === amounts[i]) {
				states.setShopBuyAmount(amounts[i + 1]);
				return
			}
		}
	};
    //return <div>{Math.random()}</div>
    return (<>
            <MenuButton onClick={() => (shopBuyAmountHandler(states["shopBuyAmount"] || 0))}>{"Change buy amount"}</MenuButton>
            {states["shopBuyAmount"] ? 
                <div className={c("infoText center")}>{typeof states["shopBuyAmount"] === "number" ? "X" + states["shopBuyAmount"] : states["shopBuyAmount"]}</div>
            :
                <></>
            }
            {states["resources"] ?
                Object.entries(states["resources"]).map(([index, entry]) => (
                    <RsDisplay key={index}>{`${loc(`res_${index}`)}: ${func.floor(entry["amount"], 2)}`}</RsDisplay>
                ))
            :
                <></>
            }
    </>
    )
}, func.jsonEqual);

export const ShopMain = memo((props) => {
    let {states} = useContext(mainContext);
	return (
		<div className={c("shopContainer")}>
			{states["shop"]["order"].map((entry, index) => (
				(entry["visible"] ? 
					<ShopUpgradeButton key={entry["id"]} upgrade={entry} buyAmount={states["shopBuyAmount"]} />
				:
					<React.Fragment key={entry["id"]}/>)
				))}
		</div>
	)
}, func.jsonEqual);

function ShopUpgradeButton(props) {
    const {resources, shop, states} = useContext(mainContext);
	const buyAmount = props["buyAmount"];
	const id = props["upgrade"]["id"];

	let amount = buyAmount;
	if(props["upgrade"]["cap"] !== -1 && typeof(amount) === "number"){
		amount = Math.min(buyAmount, props["upgrade"]["cap"] - props["upgrade"]["bought"]);
	}
	const price = props["upgrade"].getPrice(amount);
	const maxAmount = props["upgrade"].getPrice(amount === "round" ? "round" : "max");
	let color = "";
	if(typeof(amount) === "number"){
		if(!maxAmount["amount"]){
			amount = 0;
			color = "#FF6666"; //red
		}
		else if(amount > maxAmount["amount"]){
			amount = maxAmount["amount"];
			color = "#FFFF88"; //yellow
		}
		else{
			color = "#88FF88"; //green
		}
	}
	else if(typeof(amount) === "string"){ //max or round
		amount = maxAmount["amount"];
		if(!maxAmount["amount"]){
			color = "#FF6666"; //red
		}
		else if(props["upgrade"]["cap"] >= 0 && maxAmount["amount"]+props["upgrade"]["bought"] >= props["upgrade"]["cap"]){
			color = "#88FF88"; //green
		}
		else{
			color = "#FFFF88"; //yellow
		}
	}
	//const totalPrice = props["upgrade"].getPrice(amount);
	const handleClick = (e) => { //purchase levels of an upgrade.
		if(props["upgrade"]["unlocked"] && func.purchase(shop["upgrades"][id], amount, shop["upgrades"][id].getPrice(amount, undefined, amount === "round"), "shop")){
		//if(props["upgrade"]["unlocked"] && shop["upgrades"][id].tryPurchase(amount)){
			states.setShop(func.objClone(shop));
			states.setResources(func.objClone(resources));
			func.updateEffects("shop");
		}
	}
	const tooltip = renderToStaticMarkup(<ShopUpgradeDescr price={price} currAmount={amount} buyAmount={buyAmount} resources={resources} upgrade={props["upgrade"]} />);
	if(props["upgrade"]["unlocked"]){
		return (
			<div className={c("upgrade")}>
				<div className={c("shopButton center")} onClick={(e) => handleClick(e)}
					data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={tooltip}
					>
					<span className={c("shopButtonText")}>{props["upgrade"]["name"]}</span>
					<div className={c("shopButtonDisplay")} style={{bottom:0, right:0, color:"white"}}>
						{`${props["upgrade"]["bought"]}${props["upgrade"]["cap"] !== -1 ? "/" + props["upgrade"]["cap"] : ""}`}
					</div>
					{/*<div style={{position:"absolute", bottom:0, right:0, margin:6, fontSize:"14px"}}>
						<div style={{background:"#222222", borderRadius:4}}>
							<span style={{color:"white", padding:2}}>{`${props["upgrade"]["bought"]}${props["upgrade"]["cap"] !== -1 ? "/" + props["upgrade"]["cap"] : ""}`}</span>
						</div>
					</div>*/}
					{props["upgrade"]["cap"] === -1 || props["upgrade"]["cap"] > props["upgrade"]["bought"] ?
						<div className={c("shopButtonDisplay")} style={{bottom:0, left:0, color:color}}>
							{`+${amount}`}
						</div>
						/*<div style={{position:"absolute", bottom:0, left:0, margin:6, fontSize:"14px"}}>
							<div style={{background:"#222222", borderRadius:4}}>
								<span style={{color:color, padding:2}}>{`+${amount}`}</span>
							</div>
						</div>*/
					: 
						<></>}
				</div>
			</div>
		);
	}
	else{
		return <div className={c("upgrade")}>
			<div className={c("shopButton center")} style={{background:"#666666", border:"1px solid black", borderRadius:4}}
				data-tooltip-id="my-tooltip" data-tooltip-place="bottom" data-tooltip-html={tooltip}
				>
				{"???"}
			</div>
			{props["upgrade"]["bought"] ? 
				<div style={{position:"absolute", bottom:0, right:0, margin:6, fontSize:"14px"}}>
					<div style={{background:"#222222", borderRadius:4}}>
						<span style={{color:"white", padding:2}}>{`${props["upgrade"]["bought"]}${props["upgrade"]["cap"] !== -1 ? "/" + props["upgrade"]["cap"] : ""}`}</span>
					</div>
				</div>
			:
				<></>
			}
		</div>
	}
}

function ShopUpgradeDescr(props){
	const totalStats = itemStats(props["upgrade"]["stats"]);
	if(props["upgrade"]["unlocked"]){
		return (
			<>
				<div style={{border:"1px solid black"}}>
					{!props["upgrade"].capped() ? 
						<span>
							<span className={c(props["buyAmount"] > props["currAmount"] ? "warningLight" : "")}>{`${props["price"]["amount"]}x for`}</span>
							{Object.entries(props["price"]["price"]).map(([index, entry]) => (
								<span key={index} className={c(entry > props["resources"][index]["amount"] ? "warningLight" : "")}>{`\n${entry} ${index}`}</span>
							))}
						</span>
					:
						<span>{"Max"}</span>
					}
				</div>
				<div>
					{props["upgrade"]["descr"]}
				</div>
				{Object.entries(totalStats).map(([index, entry]) => (
					<div key={index}>{entry}</div>
				))}
			</>
		)
	}
	else{
		return <div>{"Upgrade not yet unlocked"}</div>
	}
}