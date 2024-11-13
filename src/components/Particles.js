
import React, {useEffect, useRef, memo} from 'react';
/*import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";*/
//import * as img from '../images';
//import './testIndex.css';

//seededRandom()
/*
export default function App() {
	const [init, setInit] = useState(false);
	// this should be run only once per application lifetime
	useEffect(() => {
		initParticlesEngine(async (engine) => {
		// you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
		// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
		// starting from v2 you can add only the features you need reducing the bundle size
		//await loadAll(engine);
		await loadFull(engine);
		//await loadSlim(engine);
		//await loadBasic(engine);
		}).then(() => {
			setInit(true);
		});
	}, []);

	const particlesLoaded = () => {

	}
	const options = useMemo(
		() => ({
			detectRetina: true,
			background: {
				color: {
				value: ""
				}
			},
			fullScreen: {
				enable: false,
				zIndex: -1
			},
			interactivity: {
				detectsOn: "window"
			},
			emitters: {
				position: {
					x: 50,
					y: 50
				},
				rate: {
					quantity: 8,
					delay: 0.05
				}

			},
			particles: {
				color: {
					value: ["#000000"]
				},
				move: {
					direction: "random",
					decay:0.1,
					enable: true,
					outModes: {
						top: "none",
						default: "destroy"
					},
					speed: { min: 6, max: 6.5 }
				},
				life:{
					duration:{
						value:0.3,
						sync:true
					},
					count:1
				},
				number: {
					value: 0
				},
				opacity: {
					value: 1
				},
				rotate: {
					value: {
						min: 0,
						max: 360
					},
					direction: "random",
					animation: {
						enable: true,
						speed: 30
					}
				},
				size: {
					value: 2
				},
				shape: {
					type: [
						"square"
					]
				}
			}
		}),
	[]);
	
	if (init) {
		let params = {
			dur:300,
			particles:1,
			interval:3,
			size:2,
			accel:0.4,
			img:img["particle"]
		}
		let canvasStyle = {
			width:50,
			height:50
		}
		return (
			<>
				<div style={{width:200, height:200, background:"#888888"}}>
					<div style={{width:60, height:60, border:"1px solid black"}}>
						<Particles
							id="tsparticles"
							particlesLoaded={particlesLoaded}
							options={options}
							className="full"
						/>
					</div>
				</div>
				<div style={{display:"flex", width:"100%", flexWrap:"wrap"}}>
					{[...Array(1)].map((entry, index) => ( 
						<React.Fragment key={index}>
							<Canvas params={params} style={canvasStyle} />
							<Canvas3 params={params} style={canvasStyle} />
							<Canvas2 params={params} style={canvasStyle} />
						</React.Fragment>
					))}
				</div>
			</>
		);
	}

  return <></>;
}*/

export const jsonEqual = (prevProps, nextProps) => JSON.stringify(prevProps) === JSON.stringify(nextProps);

export const ParticleCanvas = memo((props) =>{
	let params = props.params || {};
	const canvasRef = useRef(undefined);
	const dur = params.dur || 1000;
	const start = useRef(params.start || Date.now());
	const interval = params.interval || 300;
	const particles = params.particles || 10;
	const accel = params.accel || 1;
	const offset = 0;
	const size = params.size || 20;
	useEffect(() => {
		const updateCanvas = () => {
			if(canvasRef.current){
				const ctx = canvasRef.current.getContext("2d");
				//const rect = canvasRef.current.getBoundingClientRect();
				//let particle = {dist:canvasSize/2, size:4};
				ctx.clearRect(0, 0, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
				/*ctx.globalCompositeOperation = "source-in";
				ctx.fillStyle = "09f" || "";
				ctx.fillRect(0, 0, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
				ctx.globalCompositeOperation = "source-over";*/
				/*debugger;
				for(let i=0;i<36;i++){
					let movY = Math.tan((i*10 * Math.PI) / 180);
					let movX = 1 / movY * (i > 18 ? -1 : 1);
					console.log(movY);
					console.log(movX);
					console.log("");
				}*/
				let image = new Image();
				const drawImage = (X, Y, W, H, rot) =>{
					ctx.translate(X, Y);
					ctx.rotate(rot);
					ctx.translate(-X, -Y);
					if(params.img){
						image.src = params.img;
						ctx.drawImage(image, 0, 0, image.width, image.height, X-(W/2), Y-(H/2), size, size)
					}
					else{
						ctx.fillRect(X - (W/2), Y - (H/2), W, H);
					}
					ctx.setTransform(1,0,0,1,0,0);
				}
				let now = Date.now();
				let loop = 0;
				for(let i=now;i>now-dur && i>start.current;i-=interval){
					for(let j=1;j<=particles;j++){
						//let acc2 = 10**(j-1);
						//let dir = seededRandom(i-(i%interval));
						let ind = i+(j*1000);
						let time = (i%interval);
						let life = (now-i+time)/dur;
						//let speed = life * (1/accel)**(1-life);
						let speed = 1 - (1-life)**(1/accel*life);
						//if(accel < 1){
						//	speed = life * (1/accel)**(1-life);
						//}
						let dir = splitmix32(ind-time)();
						//dir = ((i / 10000)%1)
						let off = splitmix32(ind-time-10000)();
						let rot = (0 - (dir * Math.PI * 2));
						//let dir = ((now-start.current) / 2000) % 1;
						let dirX = Math.sin(dir * 360 * Math.PI / 180);
						let dirY = Math.cos(dir * 360 * Math.PI / 180);
						let movT = Math.abs(dirX) + Math.abs(dirY);
						let r = 1;
						//console.log((0.9*canvasRef.current.offsetWidth / 2 * (1 - (off * offset)) * speed) - (cubeSize/2), canvasRef.current.offsetWidth/2);
						//console.log(dir, rot);
						let Xpos = canvasRef.current.offsetWidth / 2 - ((0.9*canvasRef.current.offsetWidth / 2 - (size/2)) * (movT - (off * offset)) * speed) * (dirX / movT);
						let Ypos = canvasRef.current.offsetHeight / 2 - ((0.9*canvasRef.current.offsetHeight / 2 - (size/2)) * (movT - (off * offset)) * speed) * (dirY / movT);
						//let Xpos = (0.9*canvasRef.current.offsetWidth / 2 * (1 - (off * offset)) * speed) - (cubeSize/2);
						//let Ypos = (0.9*canvasRef.current.offsetHeight / 2 * (1 - (off * offset)) * speed) - (cubeSize/2);
						if(r){
							Xpos = Math.round(Xpos/r)*r;
							Ypos = Math.round(Ypos/r)*r;
						}
						drawImage(Math.round(Xpos), Math.round(Ypos), size, size, rot);
						//ctx.fillRect(Math.round(Xpos), Math.round(Ypos), cubeSize, cubeSize);
						//console.log(canvasRef.current.offsetWidth / 2 * ((i-start)/dur), (i-start), dur);
						loop++;
						if(loop > 3000){
							break;
						}
					}
				}
				ctx.globalCompositeOperation = "source-in";
				// draw color
				ctx.fillStyle = params.color || "";
				ctx.fillRect(0, 0, canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
				ctx.globalCompositeOperation = "source-over";
				//console.log(loop);
				//console.log(start, dur, interval);
				/*for(let i=0;i<particles.length;i++){
					let movY = Math.tan((particles[i][2] * 360 * Math.PI) / 180);
					let movX = 1 / movY * (particles[i][2] > 0.5 ? -1 : 1);
					let movT = Math.abs(movX) + Math.abs(movY);
					//let movX = 1;
					//let movY = 1;
					//let movT = 1;
					let Xpos = canvasRef.current.offsetWidth / 2 + ((dur - Math.max(particles[i][3] - Date.now(), 0)) / dur * particle["dist"]) * (movX / movT) - (particle["size"]/2);
					let Ypos = canvasRef.current.offsetHeight / 2 + ((dur - Math.max(particles[i][3] - Date.now(), 0)) / dur * particle["dist"]) * (movY / movT) - (particle["size"]/2);
					//Xpos = 100;
					//Ypos = 100;
					//console.log(Xpos, Ypos);
					ctx.fillRect(Math.round(Xpos), Math.round(Ypos), 4, 4);
				}*/
			  
				//window.requestAnimationFrame(updateCanvas);
			}
		};
		updateCanvas();
		let func = setInterval(updateCanvas, 10);
		return () => {
			clearInterval(func);
		}
	}, [start, accel, dur, interval, particles, size, params.img, params.color]);
	useEffect(() => {
		if(canvasRef.current){
			canvasRef.current.width = canvasRef.current.offsetWidth;
			canvasRef.current.height = canvasRef.current.offsetHeight;
		}
	});
	/*useEffect(() => {
		const addParticle = setInterval(() => {
			//let particle = (
			//	<div style={{width:4, height:4, background:"gray", position:"absolute", left:global["store"]["mouse"]["X"], top:global["store"]["mouse"]["Y"]}}></div>
			//)
			setParticles([0, 0, Math.random(0, 1), dur]);
			setParticles("update");
			//setParticles([0, 0, 0, 1000]);
			//let particle = (
			//	<div style={{width:4, height:4, background:"gray", color:"white", position:"absolute", left:0, top:0}}>A</div>
			//)
			//ref.current.parentElement.appendChild(renderToStaticMarkup(particle));
		}, interval);
		return () => {
			clearInterval(addParticle);
		}
	}, [])*/
	return <canvas ref={canvasRef} style={{...props.style}}/>
}, jsonEqual)


export function seededRandom(val) {
    let rnd = ((val * 9301 + 49297) % 233280) / 233280;
    return rnd;
}

function splitmix32(a) {
	/*return function(){
		return seededRandom(a);
	}*/
	return function() {
		a |= 0;
		a = a + 0x9e3779b9 | 0;
		let t = a ^ (a >>> 16);
		t = Math.imul(t, 0x21f0aaad);
		t = t ^ (t >>> 15);
		t = Math.imul(t, 0x735a2d97);
		return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
	}
	/*return function() {
		a |= 0; a = a + 0x9e3779b9 | 0;
		var t = a ^ a >>> 16; t = Math.imul(t, 0x21f0aaad);
			t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
		return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
	}*/
   }