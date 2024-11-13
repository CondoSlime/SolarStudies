import React, {memo} from 'react';
import * as func from './functions.js';
import {c} from './functions.js';
/*export const example = memo((props) =>{
}, func.jsonEqual);*/

export const TestSub = memo((props) =>{
    return <></>
}, func.jsonEqual);

export const TestMain = memo((props) =>{
    return <HexGrid H={5} W={6} size={100} borderSize={2} />
}, func.jsonEqual);

const HexGrid = (props) => {
    const size = props.size ?? 0;
    const borderSize = props.borderSize ?? 0;
    const colors = ["red", "green", "lime", "yellow", "cyan", "lightblue"];
    const height = Math.min(props.W, 2) + ((props.H-1) * 2);
    return (
        <div className={c("hexGrid")} style={{background:"black", "--gridSize":`${size}px`, "--borderSize":`${borderSize}px`}}>
            {[...Array(height)].map((entry, index) => {
                if(!(index%2) || props.W >= 2){
                    const length = Math.ceil((props.W - (index%2 ? 1 : 0)) / 2);
                    return (
                        <div className={c("hexRow")} /*style={{gap:(size/2), marginTop:(-size*0.45), marginLeft:(size*0.75), alignItems:"flex-start"}}*/>
                            {[...Array(length)].map((entry2, index2) => (
                                <Hex color={colors[(index*props.W+index2)%(colors.length)]} border={{size:2, color:"black"}}>
                                    {`X${(index2*2)+1+index%2}/Y${Math.ceil((index+1)/2)}`}
                                </Hex>
                            ))}
                        </div>
                    )
                }
                else{
                    return <></>
                }
            })}
        </div>
    )
}

const Hex = (props) =>{
    return (
        <div className={c("hex-border center")} style={{background:"black"}}>
            <div className={c("hex-main center")} style={{background:(props.color || "red")}}>
                {props.children}
            </div>
        </div>
        )
}