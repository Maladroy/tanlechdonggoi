import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import vitePluginBundleObfuscator from "vite-plugin-bundle-obfuscator";

const minimizeObfuscatorConfig: Parameters<
	typeof vitePluginBundleObfuscator
>[0] = {
	autoExcludeNodeModules: true,
	threadPool: true,
	options: {
		compact: true,
		controlFlowFlattening: true,
		controlFlowFlatteningThreshold: 0.75,
		deadCodeInjection: true,
		deadCodeInjectionThreshold: 0.4,
		debugProtection: true,
		disableConsoleOutput: true,
		identifierNamesGenerator: "hexadecimal",
		log: false,
		renameGlobals: false,
		rotateStringArray: true,
		selfDefending: true,
		shuffleStringArray: true,
		splitStrings: true,
		splitStringsChunkLength: 10,
		stringArray: true,
		stringArrayEncoding: ["rc4"],
		stringArrayThreshold: 0.75,
		transformObjectKeys: true,
		unicodeEscapeSequence: false,
	},
};

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, ".", "");
	return {
		server: {
			port: 3000,
			host: "0.0.0.0",
		},
		plugins: [
			vitePluginBundleObfuscator(minimizeObfuscatorConfig),
			tailwindcss(),
			react(),
		],
		define: {
			"process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
			"process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "."),
			},
		},
	};
});
