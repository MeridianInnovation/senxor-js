import { SenxorManagerCapacitorSerial } from "@senxor/capacitor-serial";
import { FIELDS } from "@senxor/core";

class SenxorDemo {
  constructor() {
    this.manager = new SenxorManagerCapacitorSerial();
    this.device = null;
    this.canvas = document.getElementById("tempCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.minTemp = 0;
    this.maxTemp = 50;

    this.initEventListeners();
    this.initDeviceListener();
    this.initFieldSelect();
  }

  initEventListeners() {
    document
      .getElementById("listBtn")
      .addEventListener("click", () => this.listDevices());
    document
      .getElementById("connectBtn")
      .addEventListener("click", () => this.connect());
    document
      .getElementById("disconnectBtn")
      .addEventListener("click", () => this.disconnect());
    document
      .getElementById("startStreamBtn")
      .addEventListener("click", () => this.startStream());
    document
      .getElementById("stopStreamBtn")
      .addEventListener("click", () => this.stopStream());

    document
      .getElementById("getFieldBtn")
      .addEventListener("click", () => this.getFieldValue());
    document
      .getElementById("setFieldBtn")
      .addEventListener("click", () => this.setFieldValue());
  }

  initDeviceListener() {
    this.manager.onDeviceConnect((device) => {
      this.showStatus(
        `New device connected: ${JSON.stringify(device.deviceInfo)}`,
        "success"
      );
      this.device = device;
      this.updateButtons();
    });
  }

  initFieldSelect() {
    const select = document.getElementById("fieldSelect");
    Object.keys(FIELDS).forEach((fieldName) => {
      const option = document.createElement("option");
      option.value = fieldName;
      option.textContent = fieldName;
      select.appendChild(option);
    });
  }

  async listDevices() {
    try {
      const devices = await this.manager.listDevices();
      if (devices.length === 0) {
        this.showStatus("No Senxor devices found", "error");
      } else {
        this.showStatus(`Found ${devices.length} device(s)`, "success");
        // For demo, use the first device
        this.device = devices[0];
        this.updateButtons();
      }
    } catch (error) {
      console.error(error);
      this.showStatus(`Error listing devices: ${error.message}`, "error");
    }
  }

  async connect() {
    if (!this.device) return;

    try {
      await this.device.open();
      this.showStatus("Device connected", "success");
      this.updateButtons();

      // Setup data listener
      this.device.onData((data) => this.handleData(data));
      this.device.onError((error) => {
        console.error(error);
        this.showStatus(`Device error: ${error.message}`, "error");
      });
    } catch (error) {
      console.error(error);
      this.showStatus(`Connection failed: ${error.message}`, "error");
    }
  }

  async disconnect() {
    if (!this.device) return;

    try {
      await this.device.close();
      this.showStatus("Device disconnected", "info");
      this.updateButtons();
    } catch (error) {
      console.error(error);
      this.showStatus(`Disconnect failed: ${error.message}`, "error");
    }
  }

  async startStream() {
    if (!this.device) return;

    try {
      await this.device.startStreaming();
      this.showStatus("Stream started", "success");
      this.updateButtons();
    } catch (error) {
      console.error(error);
      this.showStatus(`Failed to start stream: ${error.message}`, "error");
    }
  }

  async stopStream() {
    if (!this.device) return;

    try {
      await this.device.stopStreaming();
      this.showStatus("Stream stopped", "info");
      this.updateButtons();
    } catch (error) {
      console.error(error);
      this.showStatus(`Failed to stop stream: ${error.message}`, "error");
    }
  }

  async getFieldValue() {
    const fieldName = document.getElementById("fieldSelect").value;
    if (!fieldName || !this.device) return;

    try {
      const value = await this.device.getFieldValue(fieldName);
      this.showFieldStatus(`Field ${fieldName}: ${value}`, "success");
    } catch (error) {
      console.error(error);
      this.showFieldStatus(
        `Error getting ${fieldName}: ${error.message}`,
        "error"
      );
    }
  }

  async setFieldValue() {
    const fieldName = document.getElementById("fieldSelect").value;
    const inputValue = document.getElementById("fieldValueInput").value;
    if (!fieldName || !this.device || inputValue === "") return;

    try {
      const value = parseInt(inputValue, 10);
      await this.device.setFieldValue(fieldName, value);
      this.showFieldStatus(`Field ${fieldName} set to: ${value}`, "success");
    } catch (error) {
      console.error(error);
      this.showFieldStatus(
        `Error setting ${fieldName}: ${error.message}`,
        "error"
      );
    }
  }

  handleData(data) {
    // Update canvas with temperature data
    this.drawTemperatureFrame(data.frame, data.width, data.height);

    // Update temperature range
    const temps = Array.from(data.frame);
    this.minTemp = Math.min(...temps);
    this.maxTemp = Math.max(...temps);
    document.getElementById("tempRange").textContent = `${this.minTemp.toFixed(
      1
    )}°C - ${this.maxTemp.toFixed(1)}°C`;
  }

  drawTemperatureFrame(frame, width, height) {
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    // Normalize temperature to 0-255 grayscale
    const tempRange = this.maxTemp - this.minTemp || 1;

    for (let i = 0; i < frame.length; i++) {
      const normalizedTemp = (frame[i] - this.minTemp) / tempRange;
      const grayValue = Math.max(0, Math.min(255, normalizedTemp * 255));

      const pixelIndex = i * 4;
      data[pixelIndex] = grayValue; // R
      data[pixelIndex + 1] = grayValue; // G
      data[pixelIndex + 2] = grayValue; // B
      data[pixelIndex + 3] = 255; // A
    }

    // Scale to canvas size
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Create temporary canvas for scaling
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);

    this.ctx.drawImage(tempCanvas, 0, 0, this.canvas.width, this.canvas.height);
  }

  updateButtons() {
    const isDeviceAvailable = !!this.device;
    const isConnected = this.device?.isOpen || false;
    const isStreaming = this.device?.isStreaming || false;

    document.getElementById("connectBtn").disabled =
      !isDeviceAvailable || isConnected;
    document.getElementById("disconnectBtn").disabled = !isConnected;
    document.getElementById("startStreamBtn").disabled =
      !isConnected || isStreaming;
    document.getElementById("stopStreamBtn").disabled = !isStreaming;

    document.getElementById("getFieldBtn").disabled = !isConnected;
    document.getElementById("setFieldBtn").disabled = !isConnected;
    document.getElementById("fieldValueInput").disabled = !isConnected;
  }

  showStatus(message, type = "info") {
    const statusEl = document.getElementById("status");
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
  }

  showFieldStatus(message, type = "info") {
    const statusEl = document.getElementById("fieldStatus");
    statusEl.textContent = message;
    statusEl.className = type;
  }
}

// Initialize demo when page loads
document.addEventListener("DOMContentLoaded", () => {
  new SenxorDemo();
});
