// =============================================
// mqtt.js - MQTT Broker Connection Config
// =============================================
// Exports the MQTT connection options built from environment variables.
// This keeps credentials out of source code.

const getMqttOptions = () => {
  return {
    // Broker URL, e.g. "mqtt://broker.hivemq.com" or "mqtts://..."
    brokerUrl: process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com",

    // Paho/MQTT client options
    options: {
      port: parseInt(process.env.MQTT_PORT || "1883", 10),
      username: process.env.MQTT_USERNAME || "",
      password: process.env.MQTT_PASSWORD || "",
      // Give the backend a unique client ID so it doesn't conflict with the simulator
      clientId: `iot_backend_${Math.random().toString(16).slice(3)}`,
      clean: true,
      reconnectPeriod: 5000, // auto-reconnect every 5 s on disconnect
      connectTimeout: 30000,
    },
  };
};

module.exports = getMqttOptions;
