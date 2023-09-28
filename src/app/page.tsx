import dynamic from "next/dynamic";

const App = dynamic(() => import("./app"), {
  // this ensures that server side rendering is never used for this component
  ssr: false,
});

export default App;
