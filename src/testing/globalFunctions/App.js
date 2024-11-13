import MainComponent from "./sample";
import MainComponent2 from "./sample2";
import NestedComponent from "./sample4";

function App() {
  return (
    <>
      <p>1D Array</p>
      <MainComponent />
      <p>2D Array</p>
      <MainComponent2 />
      <p>Nested Component</p>
      <NestedComponent />
    </>
  );
}

export default App;
