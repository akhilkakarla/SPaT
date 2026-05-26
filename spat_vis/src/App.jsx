import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

import axios from 'axios';

const TRAFFIC_LIGHT_SIGNAL_IDX = 1

function App() {

	const [SPaTdata, setSPaTdata] = useState(null);

	useEffect(() => {

		// 1. Async function that fetches SPaT data
		const fetchSPaT = async () => {
			try {
				// 1a. Use axios.get to retrieve SPaT promise
				// const response = await axios.get('/spat_decoded'); // previous method
				const response = await axios.get('http://129.114.36.77:8080/spat_decoded')

				// 1b. Axios puts the JSON SPaT in 'response.data' automatically
				const spat_data = await response.data;

				// 1c. Set the SPaT data variable 
				setSPaTdata(spat_data);
				console.log(spat_data);

			} catch (error) {
				console.error("Error fetching data:", error);
				setSPaTdata(null)
			}
		};

		// 2. Interval that loops fetchSPaT
		const intervalId = setInterval(() => {
			fetchSPaT();
		}, 1000);

		// 3. Clean up on unmount (optional)
		return () => clearInterval(intervalId);
	}, []); // Empty dependency array runs this only once on mount

	return (
		<>
			<div>Intersection ID: {SPaTdata != null ? SPaTdata.id.id : null}</div>
			<div>Signal #: {SPaTdata != null ? getSignalByIdx(SPaTdata, TRAFFIC_LIGHT_SIGNAL_IDX) : null}</div>
			<div>Traffic Light Interpretation: {SPaTdata != null ? JSON.stringify(SPaTdata.states.MovementState[TRAFFIC_LIGHT_SIGNAL_IDX]) : null}</div>
			<div className="traffic-light-container">
				<div className="traffic-light">
					<div id="red" className="light red"></div>
					<div id="yellow" className="light yellow"></div>
					<div id="green" className="light green"></div>
				</div>
			</div>
			
		</>
	)
}

function getSignalByIdx(SPaTdata, signal_idx) {
	return SPaTdata.states.MovementState[signal_idx].signalGroup;
}

export default App
