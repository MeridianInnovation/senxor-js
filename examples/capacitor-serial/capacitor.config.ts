import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.senxor.capacitor.demo",
  appName: "Senxor Capacitor Demo",
  webDir: "dist",
  plugins: {
    UsbSerial: {
      dataEncoding: "base64",
      dataBufferSize: 8192,
    },
  },
  android: {
    includePlugins: ["capacitor-serial-plugin"],
  },
};

export default config;
