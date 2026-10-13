const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*", "android/*", "ios/*"] },
  { settings: { "import/resolver": { typescript: { project: require("node:path").join(__dirname, "tsconfig.json") } } } },
  // Mutable transaction guards provide immediate cancellation across auth/storage
  // events. They are not React Compiler memoization candidates.
  { files: ["src/state.tsx", "src/session.tsx"], rules: { "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off", "react-hooks/preserve-manual-memoization": "off" } },
  // expo-audio returns mutable native player handles; volume is its SDK setter.
  { files: ["src/sound.tsx"], rules: { "react-hooks/immutability": "off" } },
])
