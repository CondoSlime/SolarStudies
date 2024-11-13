
import React, {useEffect, useState, useReducer, memo, useContext} from 'react';
import './testIndex.css';

const global = {};
export default function App() {
	
	/*const timerHandler = (state, action) => { //setTimer
		return action;
	}*/

	//let [timer, setTimer] = useReducer(timerHandler, 1);
	let [state, setState] = useState(1);
	useEffect(() => { //global timer
		const interval = setInterval(() => {
			setState(Math.random());
		}, 1000);
		return () => clearInterval(interval);
	});
	const func = useContext(() =>{

	})

	return (
		<>
			<div onClick={() => setState(Math.random())} style={{border:"1px solid black", width:50, height:50}}>{global.timer}</div>
			<CompA thing={{}}/>
			<CompB/>
		</>
	);
}

export const CompA = memo((props) => {
	return <div>{Math.random()}</div>
})
export const CompB = (props) =>{
	return <div>{Math.random()}</div>
}
