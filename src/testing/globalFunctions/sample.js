import React, { useState, useEffect } from 'react';

function ComponentA({ value }) {
    useEffect(() => {
        console.log('Component A is re-rendering');
    }, [value]);

    return <div>Component A: {value}</div>;
}

function ComponentB({ value }) {
    useEffect(() => {
        console.log('Component B is re-rendering');
    }, [value]);

    return <div>Component B: {value}</div>;
}

function ComponentC({ value }) {
    useEffect(() => {
        console.log('Component C is re-rendering');
    }, [value]);

    return <div>Component C: {value}</div>;
}

function MainComponent() {
    const [state, setState] = useState([1, 2, 3]);

    const changeElement = (index) => {
        const newState = [...state]; // copy the state array
        newState[index] = Math.random(); // change the second element to a random number
        setState(newState); // set the new state
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '25px' }}>
            { /* pass the first element of the state array as a prop */}
            <ComponentA value={state[0]} />
            { /* pass the second element of the state array as a prop */}
            <ComponentB value={state[1]} />
            { /* pass the third element of the state array as a prop */}
            <ComponentC value={state[2]} />
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => changeElement(0)}>Change First Element</button>
                <button onClick={() => changeElement(1)}>Change Second Element</button>
                <button onClick={() => changeElement(2)}>Change Third Element</button>
            </div>
        </div>
    );
}

export default MainComponent;