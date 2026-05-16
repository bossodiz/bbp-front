// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import {
  createAuthCookieValue,
  isAuthenticatedCookie,
  getAuthPassword,
} from "@/lib/auth";

beforeAll(() => {
  process.env.AUTH_PASSWORD = "test-password-123";
  process.env.AUTH_SECRET = "test-secret-key-for-testing-only";
});

describe("Auth Utils", () => {
  describe("getAuthPassword", () => {
    it("should return the configured password", () => {
      const password = getAuthPassword();
      expect(password).toBe("test-password-123");
    });
  });

  describe("createAuthCookieValue", () => {
    it("should create a signed cookie value with payload.signature format", () => {
      const cookie = createAuthCookieValue();
      expect(cookie).toContain(".");
      const parts = cookie.split(".");
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });
  });

  describe("isAuthenticatedCookie", () => {
    it("should verify a freshly created cookie as valid", () => {
      const cookie = createAuthCookieValue();
      expect(isAuthenticatedCookie(cookie)).toBe(true);
    });

    it("should reject a cookie with a tampered signature", () => {
      const cookie = createAuthCookieValue();
      const [payload] = cookie.split(".");
      expect(isAuthenticatedCookie(`${payload}.invalidsignature`)).toBe(false);
    });

    it("should reject an empty string", () => {
      expect(isAuthenticatedCookie("")).toBe(false);
    });

    it("should reject undefined", () => {
      expect(isAuthenticatedCookie(undefined)).toBe(false);
    });

    it("should reject a cookie missing the signature part", () => {
      expect(isAuthenticatedCookie("nodotinhere")).toBe(false);
    });
  });
});
