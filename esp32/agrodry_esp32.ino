/*
 * ============================================================
 *  AgroDry-Bot 2026 — ESP32 Firmware
 * ============================================================
 *  Sensors:
 *    - DHT22  → Data pin D2 (GPIO 4 on most DevKit boards)
 *    - Soil Moisture (capacitive) → GPIO 32 (analog)
 *
 *  MQTT Broker: HiveMQ Cloud (TLS / port 8883)
 *
 *  Payload format (matches backend + dashboard exactly):
 *  {
 *    "deviceId":    "esp32_01",
 *    "temperature": 28.4,
 *    "humidity":    74.1,
 *    "moisture":    58,
 *    "status":      "online",
 *    "createdAt":   "2026-03-11T10:30:00Z"
 *  }
 *
 *  Required Arduino Libraries (install via Library Manager):
 *    ✅ DHT sensor library  — Adafruit
 *    ✅ Adafruit Unified Sensor — Adafruit
 *    ✅ PubSubClient         — Nick O'Leary (knolleary)
 *    ✅ ArduinoJson          — Benoit Blanchon (v6 or v7)
 *
 *  Board: ESP32 Dev Module  (Tools → Board → ESP32 Arduino)
 * ============================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <time.h>

// ─────────────────────────────────────────────────────────────
//  WIFI  — fill in your credentials
// ─────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─────────────────────────────────────────────────────────────
//  MQTT — HiveMQ Cloud (from .env)
// ─────────────────────────────────────────────────────────────
const char* MQTT_HOST     = "dc7dee794e454409bd21218ac1ab4796.s1.eu.hivemq.cloud";
const int   MQTT_PORT     =  8883;                  // TLS port
const char* MQTT_USER     = "iot_user";
const char* MQTT_PASS     = "102323pK";
const char* DEVICE_ID     = "esp32_01";             // must match your topic
const char* MQTT_TOPIC    = "devices/esp32_01/readings";

// ─────────────────────────────────────────────────────────────
//  SENSOR PINS
// ─────────────────────────────────────────────────────────────
//  ⚠️  D2 on most ESP32 DevKit boards = GPIO 4
//       If your board labels show "2" not "D2", try #define DHT_PIN 2
#define DHT_PIN          4        // DHT22 data wire → D2
#define DHT_TYPE         DHT22
#define MOISTURE_PIN     32       // Capacitive moisture sensor → GPIO32

// Moisture sensor calibration (check with your sensor):
//   4095 = bone dry (air)   →  0%
//   1400 = fully submerged  → 100%
//  Adjust these values after testing in dry air and in water.
const int MOISTURE_DRY   = 3800;  // raw ADC value in dry air
const int MOISTURE_WET   = 1200;  // raw ADC value submerged in water

// ─────────────────────────────────────────────────────────────
//  PUBLISH INTERVAL
// ─────────────────────────────────────────────────────────────
const unsigned long PUBLISH_INTERVAL_MS = 5000;  // publish every 5 seconds

// ─────────────────────────────────────────────────────────────
//  MQTT CLIENT ID (must be unique per device on broker)
// ─────────────────────────────────────────────────────────────
const char* CLIENT_ID = "agrodry_esp32_01";

// ─────────────────────────────────────────────────────────────
//  OBJECTS
// ─────────────────────────────────────────────────────────────
WiFiClientSecure  wifiClient;
PubSubClient      mqttClient(wifiClient);
DHT               dht(DHT_PIN, DHT_TYPE);

unsigned long     lastPublishMs = 0;

// ─────────────────────────────────────────────────────────────
//  ACTUATOR STATES (Virtual)
// ─────────────────────────────────────────────────────────────
bool fanState    = true;
bool motorState  = true;
bool systemState = true;   // true = system normal, false = system off


// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

// Map raw ADC → moisture percentage (0-100)
int readMoisturePercent() {
  int raw = analogRead(MOISTURE_PIN);
  // Invert: higher raw = drier
  int pct = map(raw, MOISTURE_DRY, MOISTURE_WET, 0, 100);
  return constrain(pct, 0, 100);
}

// Build ISO-8601 timestamp using NTP time
String getISO8601() {
  time_t now = time(nullptr);
  struct tm* t = gmtime(&now);
  char buf[30];
  // Format matches JavaScript's Date.toISOString() perfectly
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S.000Z", t);
  return String(buf);
}

// Control virtual fan based on temperature
void controlFan(float temperature) {
  if (temperature >= 45.0) {
    fanState = false;
  }
  else if (temperature < 44.0) {
    fanState = true;
  }
  // If we had a physical relay: digitalWrite(FAN_RELAY_PIN, fanState ? RELAY_ON : RELAY_OFF);
}

// ─────────────────────────────────────────────────────────────
//  WIFI
// ─────────────────────────────────────────────────────────────
void connectWifi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++attempts > 40) {
      Serial.println("\n[WiFi] ❌ Failed. Restarting...");
      ESP.restart();
    }
  }

  Serial.println();
  Serial.print("[WiFi] ✅ Connected — IP: ");
  Serial.println(WiFi.localIP());
}

// ─────────────────────────────────────────────────────────────
//  MQTT  RECONNECT
// ─────────────────────────────────────────────────────────────
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting to ");
    Serial.print(MQTT_HOST);
    Serial.print("...");

    if (mqttClient.connect(CLIENT_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println(" ✅ Connected!");
    } else {
      Serial.print(" ❌ Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" | Retry in 5s...");
      delay(5000);
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  PUBLISH PAYLOAD
// ─────────────────────────────────────────────────────────────
void publishReading() {
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  int   moisture    = readMoisturePercent();

  // Validate DHT reading
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[Sensor] ⚠️  DHT22 read failed — skipping publish");
    return;
  }

  // Actuator Logic (Blynk ported)
  if (moisture < 14) {
    motorState  = false;
    fanState    = false;
    systemState = false;
    Serial.println("[System] OFF — Moisture below 14%");
  }
  else {
    motorState  = true;
    systemState = true;
    controlFan(temperature);
  }

  // Build JSON payload
  StaticJsonDocument<256> doc; // Increased size to fit new fields
  doc["deviceId"]    = DEVICE_ID;
  doc["temperature"] = serialized(String(temperature, 1));
  doc["humidity"]    = serialized(String(humidity, 1));
  doc["moisture"]    = moisture;
  doc["fanState"]    = fanState;     // true/false
  doc["motorState"]  = motorState;   // true/false
  doc["systemState"] = systemState;  // true/false
  doc["status"]      = "online";
  doc["createdAt"]   = getISO8601();

  char payload[256];
  serializeJson(doc, payload);

  // Publish
  bool ok = mqttClient.publish(MQTT_TOPIC, payload, false);

  Serial.print("[MQTT] ");
  if (ok) {
    Serial.print("✅ Published → ");
    Serial.println(MQTT_TOPIC);
  } else {
    Serial.println("❌ Publish failed");
  }

  Serial.println("[Payload] " + String(payload));
  Serial.printf("[Sensor]  Temp=%.1f°C  Hum=%.1f%%  Moisture=%d%% | Fan:%d Motor:%d Sys:%d\n",
                temperature, humidity, moisture, fanState, motorState, systemState);
}

// ─────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("╔══════════════════════════════════╗");
  Serial.println("║   AgroDry-Bot 2026 — ESP32 FW   ║");
  Serial.println("╚══════════════════════════════════╝");

  // Init sensors
  dht.begin();
  analogReadResolution(12);  // 12-bit ADC (0–4095)
  pinMode(MOISTURE_PIN, INPUT);

  // Connect WiFi
  connectWifi();

  // Sync time via NTP (required for ISO timestamp)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("[NTP] Syncing time");
  time_t now = time(nullptr);
  int tries = 0;
  while (now < 1000000000UL && tries < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    tries++;
  }
  Serial.println(" ✅");

  // TLS: skip certificate verification (fine for development)
  // For production: use wifiClient.setCACert(rootCA) with HiveMQ CA cert
  wifiClient.setInsecure();

  // Configure MQTT
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);  // larger buffer for JSON payloads

  Serial.println("[System] ✅ Setup complete — starting loop");
}

// ─────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────
void loop() {
  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Reconnecting...");
    connectWifi();
  }

  // Reconnect MQTT if dropped
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }

  mqttClient.loop();

  // Publish on interval
  unsigned long now = millis();
  if (now - lastPublishMs >= PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;
    publishReading();
  }
}
