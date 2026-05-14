import { verifyPassword, verifyAuthCookie, createAuthCookie } from "@/lib/auth";

describe("Auth Utils", () => {
  describe("verifyPassword", () => {
    it("should verify correct password", () => {
      const password = "test-password-123";
      const result = verifyPassword(password);
      expect(result).toBe(true);
    });

    it("should reject incorrect password", () => {
      const result = verifyPassword("wrong-password");
      expect(result).toBe(false);
    });

    it("should handle empty password", () => {
      const result = verifyPassword("");
      expect(result).toBe(false);
    });
  });

  describe("verifyAuthCookie", () => {
    it("should verify valid auth cookie", () => {
      const cookie = createAuthCookie();
      const result = verifyAuthCookie(cookie);
      expect(result).toBe(true);
    });

    it("should reject invalid cookie format", () => {
      const result = verifyAuthCookie("invalid.cookie");
      expect(result).toBe(false);
    });

    it("should reject empty cookie", () => {
      const result = verifyAuthCookie("");
      expect(result).toBe(false);
    });
  });
});
