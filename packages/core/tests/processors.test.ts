import { describe, it, expect } from "vitest";
import type { SenxorData } from "../src/types";
import {
  getMinMax,
  normalizeFloat32Array,
  nomalizeSenxorData,
  createGrayScaleImageData,
  applyColorLUT,
  loadColorMap,
  getColorMapList,
  applyColorMap,
} from "../src/processors";

// Polyfill for ImageData in Node.js test environment
if (typeof globalThis.ImageData === "undefined") {
  // @ts-expect-error ImageData is not defined in Node.js test environment
  globalThis.ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(
      data: Uint8ClampedArray | number[],
      width: number,
      height?: number
    ) {
      if (Array.isArray(data) || data instanceof Uint8ClampedArray) {
        this.data = new Uint8ClampedArray(data);
        this.width = width;
        this.height = height!;
      } else {
        throw new Error("Unsupported ImageData constructor usage");
      }
    }
  };
}

const WIDTH = 80;
const HEIGHT = 62;
const PIXEL_COUNT = WIDTH * HEIGHT;

function createMockSenxorData(): SenxorData {
  const frame = new Float32Array(PIXEL_COUNT);
  for (let i = 0; i < PIXEL_COUNT; i++) {
    const row = Math.floor(i / WIDTH);
    frame[i] = 20 + row * 0.1;
  }

  return {
    frame,
    width: WIDTH,
    height: HEIGHT,
    timestamp: Date.now(),
  };
}

describe("Processors", () => {
  describe("getMinMax", () => {
    it("should return min and max from Float32Array", () => {
      const array = new Float32Array([10, 5, 20, 15]);
      const result = getMinMax(array);

      expect(result.min).toBe(5);
      expect(result.max).toBe(20);
    });

    it("should handle single element array", () => {
      const array = new Float32Array([42]);
      const result = getMinMax(array);

      expect(result.min).toBe(42);
      expect(result.max).toBe(42);
    });
  });

  describe("normalizeFloat32Array", () => {
    it("should normalize array to 0-1 range", () => {
      const array = new Float32Array([0, 50, 100]);
      const normalized = normalizeFloat32Array(array);

      expect(normalized[0]).toBe(0);
      expect(normalized[1]).toBe(0.5);
      expect(normalized[2]).toBe(1);
    });

    it("should return 0.5 for equal values", () => {
      const array = new Float32Array([42, 42, 42]);
      const normalized = normalizeFloat32Array(array);

      expect(normalized[0]).toBe(0.5);
      expect(normalized[1]).toBe(0.5);
      expect(normalized[2]).toBe(0.5);
    });

    it("should use provided min/max", () => {
      const array = new Float32Array([10, 20, 30]);
      const normalized = normalizeFloat32Array(array, 0, 40);

      expect(normalized[0]).toBe(0.25);
      expect(normalized[1]).toBe(0.5);
      expect(normalized[2]).toBe(0.75);
    });
  });

  describe("nomalizeSenxorData", () => {
    it("should normalize SenxorData correctly", () => {
      const mockData = createMockSenxorData();
      const result = nomalizeSenxorData(mockData);

      expect(result.frame).toBeInstanceOf(Float32Array);
      expect(result.width).toBe(WIDTH);
      expect(result.height).toBe(HEIGHT);
      expect(result.frame.length).toBe(PIXEL_COUNT);
      expect(result.timestamp).toBe(mockData.timestamp);

      // Test new fields
      expect(result.minTemperature).toBeDefined();
      expect(result.maxTemperature).toBeDefined();
      expect(result.minTemperature).toBeLessThanOrEqual(result.maxTemperature);

      expect(result.frame[0]).toBeGreaterThanOrEqual(0);
      expect(result.frame[0]).toBeLessThanOrEqual(1);
    });

    it("should use provided min/max parameters", () => {
      const mockData = createMockSenxorData();
      const result = nomalizeSenxorData(mockData, 15, 25);

      expect(result.minTemperature).toBe(15);
      expect(result.maxTemperature).toBe(25);
    });
  });

  describe("createGrayScaleImageData", () => {
    it("should create ImageData from normalized data", () => {
      const mockData = createMockSenxorData();
      const normalized = nomalizeSenxorData(mockData);
      const imageData = createGrayScaleImageData(normalized);

      expect(imageData.width).toBe(WIDTH);
      expect(imageData.height).toBe(HEIGHT);
      expect(imageData.data.length).toBe(PIXEL_COUNT * 4);

      for (let i = 0; i < PIXEL_COUNT; i++) {
        const r = imageData.data[i * 4];
        const g = imageData.data[i * 4 + 1];
        const b = imageData.data[i * 4 + 2];
        const a = imageData.data[i * 4 + 3];

        expect(r).toBe(g);
        expect(g).toBe(b);
        expect(a).toBe(255);
      }
    });
  });

  describe("applyColorLUT", () => {
    it("should apply color LUT correctly", () => {
      const lut = new Uint8Array(256 * 3);
      for (let i = 0; i < 256; i++) {
        lut[i * 3] = i;
        lut[i * 3 + 1] = 128;
        lut[i * 3 + 2] = 255 - i;
      }

      const mockData = createMockSenxorData();
      const normalized = nomalizeSenxorData(mockData);
      const imageData = applyColorLUT(normalized, lut);

      expect(imageData.width).toBe(WIDTH);
      expect(imageData.height).toBe(HEIGHT);
      expect(imageData.data.length).toBe(PIXEL_COUNT * 4);

      for (let i = 0; i < PIXEL_COUNT; i++) {
        const a = imageData.data[i * 4 + 3];
        expect(a).toBe(255);
      }
    });
  });

  describe("getColorMapList", () => {
    it("should return list of available color maps", () => {
      const maps = getColorMapList();

      expect(Array.isArray(maps)).toBe(true);
      expect(maps.length).toBeGreaterThan(0);
      expect(maps.includes("rainbow2")).toBe(true);
    });
  });

  describe("loadColorMap", () => {
    it("should load color map from base64", () => {
      loadColorMap("rainbow2");
      // If no error is thrown, the test passes
      expect(true).toBe(true);
    });

    it("should throw error for non-existent color map", () => {
      // @ts-expect-error Testing invalid color map name
      expect(() => loadColorMap("nonexistent")).toThrow();
    });
  });

  describe("applyColorMap", () => {
    it("should load and apply rainbow2 color map", () => {
      const mockData = createMockSenxorData();
      const normalized = nomalizeSenxorData(mockData);

      const imageData = applyColorMap(normalized, "rainbow2");

      expect(imageData.width).toBe(WIDTH);
      expect(imageData.height).toBe(HEIGHT);
      expect(imageData.data.length).toBe(PIXEL_COUNT * 4);

      for (let i = 0; i < PIXEL_COUNT; i++) {
        const a = imageData.data[i * 4 + 3];
        expect(a).toBe(255);
      }
    });

    it("should cache color map on second call", () => {
      const mockData = createMockSenxorData();
      const normalized1 = nomalizeSenxorData(mockData);
      const normalized2 = nomalizeSenxorData(mockData);

      const start1 = performance.now();
      applyColorMap(normalized1, "rainbow2");
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      applyColorMap(normalized2, "rainbow2");
      const time2 = performance.now() - start2;

      expect(time2).toBeLessThan(time1);
    });

    it("should throw error for non-existent color map", () => {
      const mockData = createMockSenxorData();
      const normalized = nomalizeSenxorData(mockData);

      // @ts-expect-error Testing invalid color map name
      expect(() => applyColorMap(normalized, "nonexistent")).toThrow();
    });
  });

  describe("integration test", () => {
    it("should process mock sensor data end-to-end", () => {
      const mockData = createMockSenxorData();

      const normalizedData = nomalizeSenxorData(mockData);
      expect(normalizedData.frame).toBeInstanceOf(Float32Array);
      expect(normalizedData.minTemperature).toBeDefined();
      expect(normalizedData.maxTemperature).toBeDefined();

      const grayImageData = createGrayScaleImageData(normalizedData);
      const colorImageData = applyColorMap(normalizedData, "rainbow2");

      expect(grayImageData.width).toBe(WIDTH);
      expect(colorImageData.width).toBe(WIDTH);
      expect(grayImageData.height).toBe(HEIGHT);
      expect(colorImageData.height).toBe(HEIGHT);
    });
  });
});
