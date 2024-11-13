import React, { useState, useEffect } from 'react';
import { changeValue } from './functions';

function SubComponent({ value, index, clickHandler }) {
    useEffect(() => {
        console.log('Component A is re-rendering');
    }, [value]);

    const buttonStyle = {
        width: '150px'
    };

    return (
        <div style={{ border: 'solid 1px black', width: '350px', padding: '5px' }}>
            <div>Component Index: {index}</div>
            <div>Component Value: {value}</div>
            <button
                onClick={() => changeValue(clickHandler, index)}
                style={buttonStyle}>
                Change Value
            </button>
        </div>
    );
}

function NestedComponent() {
    const [samplesArray, setSamplesArray] = useState([1, 2, 3, 4, 5, 6]);

    const changeElement = (index, value) => {
        const newState = [...samplesArray]; // copy the state array
        newState[index] = value; // change the element to the given value
        setSamplesArray(newState); // set the new state
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '25px' }}>
            {samplesArray.map((sample, index) => {
                /* pass the element, index and clickhandler as a prop */
                return <SubComponent key={index} index={index} value={sample} clickHandler={changeElement} />
            })}
        </div>
    );
}

export default NestedComponent;

