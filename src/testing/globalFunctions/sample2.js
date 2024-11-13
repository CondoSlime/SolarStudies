import React, { useState, useEffect } from 'react';

function ComponentD({ value }) {
    useEffect(() => {
        console.log('Component D is re-rendering');
    }, [value]);

    return <div>Component D: {value.join(', ')}</div>;
}

function ComponentE({ value }) {
    useEffect(() => {
        console.log('Component E is re-rendering');
    }, [value]);

    return <div>Component E: {value.join(', ')}</div>;
}

function ComponentF({ value }) {
    useEffect(() => {
        console.log('Component F is re-rendering');
    }, [value]);

    return <div>Component F: {value.join(', ')}</div>;
}

function MainComponent2() {
    const [state, setState] = useState([[1, 2], [3, 4], [5, 6]]);

    const changeElement = (index) => {
        const newState = [...state]; // copy the state array
        // change all elements in the array to a random number array using map method
        newState[index] = newState[index].map(() => Math.random());
        setState(newState); // set the new state
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '25px' }}>
            { /* pass the first element of the state array as a prop */}
            <ComponentD value={state[0]} />
            { /* pass the second element of the state array as a prop */}
            <ComponentE value={state[1]} />
            { /* pass the third element of the state array as a prop */}
            <ComponentF value={state[2]} />
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => changeElement(0)}>Change First Element</button>
                <button onClick={() => changeElement(1)}>Change Second Element</button>
                <button onClick={() => changeElement(2)}>Change Third Element</button>
            </div>
        </div>
    );
}

export default MainComponent2;