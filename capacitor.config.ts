import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vagnerfjr.footballidle",
  appName: "Football Idle",
  webDir: "build",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#070d1a",
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;
