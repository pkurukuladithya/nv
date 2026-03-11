# ESP32 IoT Sensor Simulator

A Python Tkinter desktop app that simulates an ESP32 with DHT22 (temperature, humidity) and soil moisture sensor publishing data via MQTT.

## Requirements
- Python 3.8+
- `paho-mqtt` library

## Install
```bash
cd simulator
pip install -r requirements.txt
```

## Run
```bash
python simulator.py
```

## Default Settings
| Setting | Value |
|---------|-------|
| Broker  | `broker.hivemq.com` |
| Port    | `1883` |
| Topic   | `devices/esp32_01/readings` |
| Auth    | None (public broker) |

## MQTT Payload Format
```json
{
  "deviceId": "esp32_01",
  "temperature": 28.4,
  "humidity": 74.1,
  "moisture": 58,
  "status": "online",
  "createdAt": "2026-03-11T10:30:00Z"
}
```

## Features
- Connect / Disconnect to any MQTT broker
- Power ON/OFF toggle (prevents publishing when OFF)
- Temperature, humidity, moisture sliders
- Publish Once / Auto Publish with interval
- Live payload preview
- Event log
- Presets: Normal, Dry Soil, Wet Soil, Hot Day

## Replacing with a Real ESP32
When you have a real ESP32 + DHT22 + soil moisture sensor, just:
1. Wire the sensors to the ESP32
2. Flash MicroPython or Arduino firmware
3. Publish the same JSON payload to `devices/<deviceId>/readings`
4. No backend or frontend changes needed — the same topic and payload structure is used
