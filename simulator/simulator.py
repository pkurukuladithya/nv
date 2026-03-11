"""
ESP32 IoT Sensor Simulator
==========================
A Python Tkinter GUI that simulates an ESP32 device publishing
sensor readings (temperature, humidity, moisture) via MQTT.

The payload format matches a real DHT22 + soil-moisture ESP32:
{
  "deviceId": "esp32_01",
  "temperature": 28.4,
  "humidity": 74.1,
  "moisture": 58,
  "status": "online",
  "createdAt": "2026-03-11T10:30:00Z"
}

Requirements:
  pip install paho-mqtt

Usage:
  python simulator.py
"""

import json
import threading
import time
import tkinter as tk
from datetime import datetime, timezone
from tkinter import font as tkfont
from tkinter import ttk

import paho.mqtt.client as mqtt

# ──────────────────────────────────────────────────────────────
# COLOUR PALETTE  (dark SaaS look)
# ──────────────────────────────────────────────────────────────
BG_BASE      = "#0f1117"
BG_SURFACE   = "#1a1d27"
BG_ELEVATED  = "#21253a"
BG_HOVER     = "#262b3d"
BORDER       = "#2d3148"

TEXT_PRIMARY   = "#e8eaf2"
TEXT_SECONDARY = "#8b93b5"
TEXT_MUTED     = "#5a6080"

BLUE   = "#4f8ef7"
GREEN  = "#22c55e"
RED    = "#ef4444"
YELLOW = "#f59e0b"
PURPLE = "#9b5cf6"
TEAL   = "#14b8a6"

# ──────────────────────────────────────────────────────────────
# SIMULATOR APP
# ──────────────────────────────────────────────────────────────
class SimulatorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("ESP32 IoT Sensor Simulator")
        self.configure(bg=BG_BASE)
        self.resizable(True, True)
        self.minsize(780, 680)

        # ── state ──
        self.mqtt_client   = None
        self.is_connected  = False
        self.device_on     = False  # power state
        self.auto_running  = False
        self.auto_thread   = None

        # ── fonts ──
        self.font_base  = tkfont.Font(family="Segoe UI", size=9)
        self.font_bold  = tkfont.Font(family="Segoe UI", size=9, weight="bold")
        self.font_title = tkfont.Font(family="Segoe UI", size=12, weight="bold")
        self.font_mono  = tkfont.Font(family="Courier New", size=8)
        self.font_big   = tkfont.Font(family="Segoe UI", size=14, weight="bold")

        self._build_ui()

    # ══════════════════════════════════════════════════════════
    # UI BUILDER
    # ══════════════════════════════════════════════════════════
    def _build_ui(self):
        # ── header ──
        header = tk.Frame(self, bg=BG_SURFACE, pady=12)
        header.pack(fill=tk.X)
        tk.Label(
            header,
            text="⬡  ESP32 IoT Sensor Simulator",
            bg=BG_SURFACE, fg=TEXT_PRIMARY,
            font=self.font_title,
        ).pack(side=tk.LEFT, padx=20)

        self.status_dot = tk.Label(header, text="●", fg=RED, bg=BG_SURFACE, font=self.font_bold)
        self.status_dot.pack(side=tk.RIGHT, padx=(0, 8))
        self.status_lbl = tk.Label(header, text="Disconnected", fg=TEXT_SECONDARY, bg=BG_SURFACE, font=self.font_base)
        self.status_lbl.pack(side=tk.RIGHT)

        # ── main content (two columns) ──
        content = tk.Frame(self, bg=BG_BASE)
        content.pack(fill=tk.BOTH, expand=True, padx=16, pady=12)
        content.columnconfigure(0, weight=1)
        content.columnconfigure(1, weight=1)
        content.rowconfigure(0, weight=1)

        left  = tk.Frame(content, bg=BG_BASE)
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        right = tk.Frame(content, bg=BG_BASE)
        right.grid(row=0, column=1, sticky="nsew", padx=(8, 0))

        self._build_connection_panel(left)
        self._build_device_panel(left)
        self._build_sensor_panel(left)
        self._build_publish_panel(left)
        self._build_presets_panel(left)

        self._build_payload_panel(right)
        self._build_log_panel(right)

    # ──────────────────────────────────────────────────────────
    # LEFT PANELS
    # ──────────────────────────────────────────────────────────
    def _build_connection_panel(self, parent):
        card = self._card(parent, "🔌  MQTT Connection")

        grid = tk.Frame(card, bg=BG_SURFACE)
        grid.pack(fill=tk.X, pady=(0, 8))

        # row 0: broker, port
        tk.Label(grid, text="Broker Host", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base, anchor="w").grid(row=0, column=0, sticky="w", padx=(0, 8), pady=2)
        self.broker_var = tk.StringVar(value="broker.hivemq.com")
        tk.Entry(grid, textvariable=self.broker_var, bg=BG_ELEVATED, fg=TEXT_PRIMARY, insertbackground=TEXT_PRIMARY, relief=tk.FLAT, font=self.font_base, width=22).grid(row=0, column=1, sticky="ew", pady=2)

        tk.Label(grid, text="Port", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base, anchor="w").grid(row=0, column=2, sticky="w", padx=(8, 8), pady=2)
        self.port_var = tk.StringVar(value="1883")
        tk.Entry(grid, textvariable=self.port_var, bg=BG_ELEVATED, fg=TEXT_PRIMARY, insertbackground=TEXT_PRIMARY, relief=tk.FLAT, font=self.font_base, width=6).grid(row=0, column=3, sticky="ew", pady=2)

        # row 1: username, password
        tk.Label(grid, text="Username", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base, anchor="w").grid(row=1, column=0, sticky="w", padx=(0, 8), pady=2)
        self.user_var = tk.StringVar()
        tk.Entry(grid, textvariable=self.user_var, bg=BG_ELEVATED, fg=TEXT_PRIMARY, insertbackground=TEXT_PRIMARY, relief=tk.FLAT, font=self.font_base, width=22).grid(row=1, column=1, sticky="ew", pady=2)

        tk.Label(grid, text="Password", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base, anchor="w").grid(row=1, column=2, sticky="w", padx=(8, 8), pady=2)
        self.pass_var = tk.StringVar()
        tk.Entry(grid, textvariable=self.pass_var, show="●", bg=BG_ELEVATED, fg=TEXT_PRIMARY, insertbackground=TEXT_PRIMARY, relief=tk.FLAT, font=self.font_base, width=12).grid(row=1, column=3, sticky="ew", pady=2)

        # row 2: deviceId, topic
        tk.Label(grid, text="Device ID", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base, anchor="w").grid(row=2, column=0, sticky="w", padx=(0, 8), pady=2)
        self.device_id_var = tk.StringVar(value="esp32_01")
        tk.Entry(grid, textvariable=self.device_id_var, bg=BG_ELEVATED, fg=TEXT_PRIMARY, insertbackground=TEXT_PRIMARY, relief=tk.FLAT, font=self.font_base, width=22).grid(row=2, column=1, sticky="ew", pady=2)

        tk.Label(grid, text="Topic", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base, anchor="w").grid(row=2, column=2, sticky="w", padx=(8, 8), pady=2)
        self.topic_var = tk.StringVar(value="devices/esp32_01/readings")
        self.topic_entry = tk.Entry(grid, textvariable=self.topic_var, bg=BG_ELEVATED, fg=TEXT_PRIMARY, insertbackground=TEXT_PRIMARY, relief=tk.FLAT, font=self.font_base, width=22)
        self.topic_entry.grid(row=2, column=3, columnspan=2, sticky="ew", pady=2)

        grid.columnconfigure(1, weight=1)
        grid.columnconfigure(3, weight=1)

        # Auto-update topic when deviceId changes
        self.device_id_var.trace_add("write", self._sync_topic)

        # buttons
        btn_row = tk.Frame(card, bg=BG_SURFACE)
        btn_row.pack(fill=tk.X, pady=(4, 0))
        self.connect_btn = self._btn(btn_row, "Connect", self._do_connect, BLUE)
        self.connect_btn.pack(side=tk.LEFT, padx=(0, 8))
        self.disconnect_btn = self._btn(btn_row, "Disconnect", self._do_disconnect, RED)
        self.disconnect_btn.pack(side=tk.LEFT)
        self.disconnect_btn.config(state=tk.DISABLED)

    def _build_device_panel(self, parent):
        card = self._card(parent, "⚡  Device Power")

        row = tk.Frame(card, bg=BG_SURFACE)
        row.pack(fill=tk.X)

        self.power_lbl = tk.Label(row, text="● Device OFF", fg=RED, bg=BG_SURFACE, font=self.font_bold)
        self.power_lbl.pack(side=tk.LEFT, padx=(0, 16))

        self.power_btn = self._btn(row, "Power ON", self._toggle_power, GREEN)
        self.power_btn.pack(side=tk.LEFT)

    def _build_sensor_panel(self, parent):
        card = self._card(parent, "📡  Sensor Values")

        sliders_frame = tk.Frame(card, bg=BG_SURFACE)
        sliders_frame.pack(fill=tk.X)

        # Temperature
        self.temp_var = tk.DoubleVar(value=25.0)
        self._slider_row(sliders_frame, "Temperature (°C)", self.temp_var, -10, 60, 0)

        # Humidity
        self.hum_var = tk.DoubleVar(value=60.0)
        self._slider_row(sliders_frame, "Humidity (%)", self.hum_var, 0, 100, 1)

        # Moisture
        self.moist_var = tk.DoubleVar(value=50.0)
        self._slider_row(sliders_frame, "Soil Moisture (%)", self.moist_var, 0, 100, 2)

    def _build_publish_panel(self, parent):
        card = self._card(parent, "📤  Publish Controls")

        row1 = tk.Frame(card, bg=BG_SURFACE)
        row1.pack(fill=tk.X, pady=(0, 6))

        self.pub_once_btn = self._btn(row1, "Publish Once", self._publish_once, BLUE)
        self.pub_once_btn.pack(side=tk.LEFT, padx=(0, 8))

        self.auto_var = tk.BooleanVar(value=False)
        self.auto_cb = tk.Checkbutton(
            row1, text="Auto Publish", variable=self.auto_var,
            command=self._toggle_auto,
            bg=BG_SURFACE, fg=TEXT_PRIMARY, selectcolor=BG_ELEVATED,
            activebackground=BG_SURFACE, activeforeground=TEXT_PRIMARY,
            font=self.font_base
        )
        self.auto_cb.pack(side=tk.LEFT, padx=(0, 8))

        # interval
        tk.Label(row1, text="Interval:", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base).pack(side=tk.LEFT, padx=(0, 4))
        self.interval_var = tk.StringVar(value="5")
        interval_combo = ttk.Combobox(
            row1, textvariable=self.interval_var, values=["1", "2", "5", "10", "30", "60"],
            width=4, font=self.font_base, state="readonly"
        )
        interval_combo.pack(side=tk.LEFT, padx=(0, 4))
        tk.Label(row1, text="s", bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base).pack(side=tk.LEFT)

        self.stop_btn = self._btn(row1, "Stop Auto", self._stop_auto, RED)
        self.stop_btn.pack(side=tk.LEFT, padx=(12, 0))
        self.stop_btn.config(state=tk.DISABLED)

        # last sent time
        self.last_sent_var = tk.StringVar(value="Last sent: —")
        tk.Label(card, textvariable=self.last_sent_var, bg=BG_SURFACE, fg=TEXT_MUTED, font=self.font_base).pack(anchor="w", pady=(2, 0))

    def _build_presets_panel(self, parent):
        card = self._card(parent, "🌿  Sensor Presets")
        row = tk.Frame(card, bg=BG_SURFACE)
        row.pack(fill=tk.X)
        self._btn(row, "Normal", lambda: self._apply_preset("normal"), TEAL).pack(side=tk.LEFT, padx=(0, 6))
        self._btn(row, "Dry Soil", lambda: self._apply_preset("dry"), YELLOW).pack(side=tk.LEFT, padx=(0, 6))
        self._btn(row, "Wet Soil", lambda: self._apply_preset("wet"), BLUE).pack(side=tk.LEFT, padx=(0, 6))
        self._btn(row, "Hot Day", lambda: self._apply_preset("hot"), RED).pack(side=tk.LEFT)

    # ──────────────────────────────────────────────────────────
    # RIGHT PANELS
    # ──────────────────────────────────────────────────────────
    def _build_payload_panel(self, parent):
        card = self._card(parent, "{ }  Payload Preview")
        self.payload_text = tk.Text(
            card, height=9, bg=BG_ELEVATED, fg=TEAL, font=self.font_mono,
            relief=tk.FLAT, wrap=tk.WORD, state=tk.DISABLED,
            insertbackground=TEXT_PRIMARY
        )
        self.payload_text.pack(fill=tk.BOTH, expand=True)
        self._update_payload_preview()

        # update preview when sliders move
        self.temp_var.trace_add("write", lambda *_: self._update_payload_preview())
        self.hum_var.trace_add("write",  lambda *_: self._update_payload_preview())
        self.moist_var.trace_add("write", lambda *_: self._update_payload_preview())
        self.device_id_var.trace_add("write", lambda *_: self._update_payload_preview())

    def _build_log_panel(self, parent):
        card = self._card(parent, "📋  Event Log")

        btn_row = tk.Frame(card, bg=BG_SURFACE)
        btn_row.pack(fill=tk.X, pady=(0, 6))
        self._btn(btn_row, "Clear Log", self._clear_log, TEXT_MUTED).pack(side=tk.RIGHT)

        self.log_text = tk.Text(
            card, height=18, bg=BG_ELEVATED, fg=TEXT_PRIMARY, font=self.font_mono,
            relief=tk.FLAT, wrap=tk.WORD, state=tk.DISABLED,
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)

        # colour tags
        self.log_text.tag_config("info",    foreground=TEXT_SECONDARY)
        self.log_text.tag_config("success", foreground=GREEN)
        self.log_text.tag_config("error",   foreground=RED)
        self.log_text.tag_config("publish", foreground=BLUE)
        self.log_text.tag_config("warn",    foreground=YELLOW)

    # ══════════════════════════════════════════════════════════
    # HELPERS
    # ══════════════════════════════════════════════════════════
    def _card(self, parent, title):
        """Creates a styled card frame with a title label."""
        outer = tk.Frame(parent, bg=BG_SURFACE, pady=0)
        outer.pack(fill=tk.X, pady=(0, 10))

        title_bar = tk.Frame(outer, bg=BG_SURFACE)
        title_bar.pack(fill=tk.X, padx=12, pady=(10, 6))
        tk.Label(title_bar, text=title, bg=BG_SURFACE, fg=TEXT_PRIMARY, font=self.font_bold).pack(side=tk.LEFT)

        sep = tk.Frame(outer, bg=BORDER, height=1)
        sep.pack(fill=tk.X, padx=12)

        inner = tk.Frame(outer, bg=BG_SURFACE, padx=12, pady=10)
        inner.pack(fill=tk.X)
        return inner

    def _btn(self, parent, text, command, color=BLUE):
        """Creates a styled flat button."""
        b = tk.Button(
            parent, text=text, command=command,
            bg=BG_ELEVATED, fg=color,
            activebackground=BG_HOVER, activeforeground=color,
            relief=tk.FLAT, font=self.font_bold,
            padx=12, pady=4, cursor="hand2",
        )
        return b

    def _slider_row(self, parent, label, var, lo, hi, row):
        """Creates a label + slider + value readout row."""
        tk.Label(parent, text=label, bg=BG_SURFACE, fg=TEXT_SECONDARY, font=self.font_base, width=18, anchor="w").grid(row=row, column=0, sticky="w", pady=4)

        scale = tk.Scale(
            parent, variable=var, from_=lo, to=hi, resolution=0.1,
            orient=tk.HORIZONTAL, length=220,
            bg=BG_SURFACE, fg=TEXT_PRIMARY, troughcolor=BG_ELEVATED,
            highlightthickness=0, sliderrelief=tk.FLAT,
            font=self.font_base, showvalue=False,
        )
        scale.grid(row=row, column=1, sticky="ew", padx=8)

        val_lbl = tk.Label(parent, textvariable=var, bg=BG_SURFACE, fg=BLUE, font=self.font_bold, width=6, anchor="e")
        val_lbl.grid(row=row, column=2, sticky="e", pady=4)
        parent.columnconfigure(1, weight=1)

    # ── topic sync ──
    def _sync_topic(self, *_):
        dev = self.device_id_var.get().strip() or "esp32_01"
        self.topic_var.set(f"devices/{dev}/readings")

    # ── payload builder ──
    def _build_payload(self):
        temp = round(self.temp_var.get(), 1)
        hum = round(self.hum_var.get(), 1)
        moist = round(self.moist_var.get(), 0)
        
        # Virtual Actuator Logic
        fan_state = True
        motor_state = True
        system_state = True
        
        if temp >= 45.0:
            fan_state = False
        elif temp < 44.0:
            fan_state = True
            
        if moist < 14:
            motor_state = False
            fan_state = False
            system_state = False

        return {
            "deviceId":    self.device_id_var.get().strip() or "esp32_01",
            "temperature": temp,
            "humidity":    hum,
            "moisture":    moist,
            "fanState":    fan_state,
            "motorState":  motor_state,
            "systemState": system_state,
            "status":      "online",
            "createdAt":   datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        }

    def _update_payload_preview(self):
        payload = self._build_payload()
        text = json.dumps(payload, indent=2)
        self.payload_text.config(state=tk.NORMAL)
        self.payload_text.delete("1.0", tk.END)
        self.payload_text.insert(tk.END, text)
        self.payload_text.config(state=tk.DISABLED)

    # ── logging ──
    def _log(self, message, tag="info"):
        ts = datetime.now().strftime("%H:%M:%S")
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, f"[{ts}] {message}\n", tag)
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)

    def _clear_log(self):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete("1.0", tk.END)
        self.log_text.config(state=tk.DISABLED)

    # ── status dot ──
    def _set_status(self, text, color):
        self.status_dot.config(fg=color)
        self.status_lbl.config(text=text, fg=color)

    # ══════════════════════════════════════════════════════════
    # MQTT CALLBACKS
    # ══════════════════════════════════════════════════════════
    def _on_connect(self, client, userdata, flags, reason_code, properties=None):
        if reason_code == 0:
            self.is_connected = True
            self.after(0, lambda: self._set_status("Connected", GREEN))
            self.after(0, lambda: self._log("✅ Connected to MQTT broker", "success"))
            self.after(0, lambda: self.connect_btn.config(state=tk.DISABLED))
            self.after(0, lambda: self.disconnect_btn.config(state=tk.NORMAL))
        else:
            self.after(0, lambda: self._log(f"❌ Connection refused: code={reason_code}", "error"))
            self.after(0, lambda: self._set_status("Connection failed", RED))

    def _on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties=None):
        self.is_connected = False
        self.auto_running = False
        self.after(0, lambda: self._set_status("Disconnected", RED))
        self.after(0, lambda: self._log("🔌 Disconnected from broker", "warn"))
        self.after(0, lambda: self.connect_btn.config(state=tk.NORMAL))
        self.after(0, lambda: self.disconnect_btn.config(state=tk.DISABLED))

    def _on_publish(self, client, userdata, mid, reason_code=None, properties=None):
        self.after(0, lambda: self._set_status("Published ✓", GREEN))

    # ══════════════════════════════════════════════════════════
    # BUTTON ACTIONS
    # ══════════════════════════════════════════════════════════
    def _do_connect(self):
        broker = self.broker_var.get().strip()
        port_str = self.port_var.get().strip()

        if not broker:
            self._log("❌ Broker host cannot be empty.", "error")
            return
        try:
            port = int(port_str)
        except ValueError:
            self._log("❌ Port must be a number.", "error")
            return

        self._log(f"🔌 Connecting to {broker}:{port}…", "info")
        self._set_status("Connecting…", YELLOW)

        client_id = f"sim_{self.device_id_var.get().strip()}_{int(time.time())}"
        self.mqtt_client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            clean_session=True,
        )

        user = self.user_var.get().strip()
        pwd  = self.pass_var.get().strip()
        if user:
            self.mqtt_client.username_pw_set(user, pwd)

        self.mqtt_client.on_connect    = self._on_connect
        self.mqtt_client.on_disconnect = self._on_disconnect
        self.mqtt_client.on_publish    = self._on_publish

        try:
            # Auto-enable TLS for port 8883 / 8884 (required by HiveMQ Cloud and most secure brokers)
            if port in (8883, 8884):
                import ssl
                self.mqtt_client.tls_set(tls_version=ssl.PROTOCOL_TLS_CLIENT)
                self._log("🔒 TLS enabled (port 8883/8884 detected)", "info")

            self.mqtt_client.connect_async(broker, port, keepalive=60)
            self.mqtt_client.loop_start()
        except Exception as exc:
            self._log(f"❌ Connection error: {exc}", "error")
            self._set_status("Error", RED)

    def _do_disconnect(self):
        self._stop_auto()
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            self.mqtt_client = None

    def _toggle_power(self):
        self.device_on = not self.device_on
        if self.device_on:
            self.power_lbl.config(text="● Device ON", fg=GREEN)
            self.power_btn.config(text="Power OFF", fg=RED)
            self._log("⚡ Device powered ON", "success")
        else:
            self.power_lbl.config(text="● Device OFF", fg=RED)
            self.power_btn.config(text="Power ON", fg=GREEN)
            self._log("💤 Device powered OFF", "warn")
            self._stop_auto()

    def _publish_once(self):
        if not self._can_publish():
            return
        self._send_payload()

    def _toggle_auto(self):
        if self.auto_var.get():
            if not self._can_publish():
                self.auto_var.set(False)
                return
            self._start_auto()
        else:
            self._stop_auto()

    def _start_auto(self):
        self.auto_running = True
        self.stop_btn.config(state=tk.NORMAL)
        self._log("🔄 Auto-publish started", "info")
        self._set_status("Publishing…", BLUE)

        def loop():
            while self.auto_running:
                if self._can_publish(silent=True):
                    self._send_payload()
                try:
                    interval = int(self.interval_var.get())
                except ValueError:
                    interval = 5
                time.sleep(interval)
            self.after(0, lambda: self._set_status("Connected", GREEN))

        self.auto_thread = threading.Thread(target=loop, daemon=True)
        self.auto_thread.start()

    def _stop_auto(self):
        self.auto_running = False
        self.auto_var.set(False)
        self.stop_btn.config(state=tk.DISABLED)
        if self.is_connected:
            self._set_status("Connected", GREEN)

    # ══════════════════════════════════════════════════════════
    # PUBLISH CORE
    # ══════════════════════════════════════════════════════════
    def _can_publish(self, silent=False):
        if not self.is_connected:
            if not silent:
                self._log("❌ Not connected to broker.", "error")
            return False
        if not self.device_on:
            if not silent:
                self._log("❌ Device is OFF. Turn device ON first.", "warn")
            return False
        return True

    def _send_payload(self):
        payload = self._build_payload()
        topic   = self.topic_var.get().strip() or f"devices/{payload['deviceId']}/readings"
        message = json.dumps(payload)

        try:
            result = self.mqtt_client.publish(topic, message, qos=1)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                now = datetime.now().strftime("%H:%M:%S")
                self.last_sent_var.set(f"Last sent: {now}")
                self.after(0, lambda: self._log(
                    f"📤 Published → {topic}\n   {message}", "publish"
                ))
                self.after(0, self._update_payload_preview)
            else:
                self.after(0, lambda: self._log(f"❌ Publish failed: rc={result.rc}", "error"))
        except Exception as exc:
            self.after(0, lambda: self._log(f"❌ Publish error: {exc}", "error"))

    # ══════════════════════════════════════════════════════════
    # PRESETS
    # ══════════════════════════════════════════════════════════
    def _apply_preset(self, name):
        presets = {
            "normal": (25.0, 60.0, 50.0),
            "dry":    (32.0, 35.0, 15.0),
            "wet":    (22.0, 85.0, 90.0),
            "hot":    (42.0, 20.0, 10.0),
        }
        temp, hum, moist = presets.get(name, (25.0, 60.0, 50.0))
        self.temp_var.set(temp)
        self.hum_var.set(hum)
        self.moist_var.set(moist)
        self._log(f"🌿 Preset applied: {name.upper()} → Temp={temp}°C, Hum={hum}%, Moisture={moist}%", "info")


# ──────────────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = SimulatorApp()
    app.mainloop()
