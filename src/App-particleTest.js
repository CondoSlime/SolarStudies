
import React from 'react';
import {ParticleCanvas} from './components/Particles.js';

export default function App() {
	let params = {
		dur:3000,
		particles:1,
		interval:6,
		size:3,
		accel:0.7,
		color:"#992222"
	}
	return (
		<>
			<ParticleCanvas params={params} style={{height:400, width:400, border:"1px solid black"}}/>
		</>
	)
}