import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { logger } from "@/lib/logger";

beforeEach(() => {
  // Clear the singleton buffer before every test so tests are independent
  logger.clearLogs();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger facade", () => {
  describe("console routing", () => {
    it("logger.error calls console.error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("TestModule", { detail: "boom" });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("logger.warn calls console.warn", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("TestModule", { detail: "caution" });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("logger.info calls console.log (or console.info)", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.info("TestModule", { detail: "note" });
      const called = logSpy.mock.calls.length + infoSpy.mock.calls.length;
      expect(called).toBeGreaterThanOrEqual(1);
    });

    it("logger.debug calls console.debug (or console.log)", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.debug("TestModule", { detail: "trace" });
      const called = debugSpy.mock.calls.length + logSpy.mock.calls.length;
      expect(called).toBeGreaterThanOrEqual(1);
    });
  });

  describe("log buffer (getRecentLogs)", () => {
    it("returns entries after logging", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("Mod", { x: 1 });
      const logs = logger.getRecentLogs(10);
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it("entries contain the module name", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("PaymentModule", { step: "charge" });
      const logs = logger.getRecentLogs(5);
      const last = logs[logs.length - 1];
      expect(last.module).toBe("PaymentModule");
    });

    it("entries carry the correct level", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "debug").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});

      logger.error("M", {});
      logger.warn("M", {});
      logger.debug("M", {});
      logger.info("M", {});

      const logs = logger.getRecentLogs(10);
      const levels = logs.map((l) => l.level);
      expect(levels).toContain("error");
      expect(levels).toContain("warn");
      expect(levels).toContain("debug");
      expect(levels).toContain("info");
    });
  });

  describe("clearLogs", () => {
    it("empties the buffer", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("M", {});
      logger.error("M", {});
      expect(logger.getRecentLogs(10).length).toBeGreaterThan(0);

      logger.clearLogs();

      expect(logger.getRecentLogs(10)).toHaveLength(0);
    });
  });

  describe("buffer size cap", () => {
    it("does not exceed 100 entries after 110 insertions", () => {
      // Suppress all console output for this bulk test
      vi.spyOn(console, "error").mockImplementation(() => {});

      for (let i = 0; i < 110; i++) {
        logger.error(`Module-${i}`, { i });
      }

      const logs = logger.getRecentLogs(200);
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });
});
