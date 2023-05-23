import "tailwindcss/tailwind.css";
import "react-toastify/dist/ReactToastify.css";

import ReactDOM from "react-dom/client";
import { mount as mountDevTools } from "@latticexyz/dev-tools";
import { App } from "./App";
import { setup } from "./mud/setup";
import { MUDProvider } from "./MUDContext";
import { ToastContainer } from "react-toastify";

import { Libp2pProvider } from "./libp2p";

const rootElement = document.getElementById("react-root");
if (!rootElement) throw new Error("React root not found");
const root = ReactDOM.createRoot(rootElement);

// TODO: figure out if we actually want this to be async or if we should render something else in the meantime
setup().then((result) => {
  root.render(
    <MUDProvider value={result}>
      <Libp2pProvider>
        <App />
      </Libp2pProvider>
      <ToastContainer position="bottom-right" draggable={false} theme="dark" />
    </MUDProvider>
  );
  mountDevTools();
});
