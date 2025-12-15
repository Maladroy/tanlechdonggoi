import { FirebaseUIProvider } from "@firebase-oss/ui-react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ui } from "./services/firebase";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<FirebaseUIProvider ui={ui}>
			<Analytics />
			<SpeedInsights />
			<App />
		</FirebaseUIProvider>
	</React.StrictMode>,
);
