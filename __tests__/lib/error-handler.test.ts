import {
  handleApiError,
  ValidationError,
  AuthError,
  NotFoundError,
  DatabaseError,
  CsrfError,
  RateLimitError,
} from "@/lib/error-handler";
import { ZodError } from "zod";

describe("Error Handler", () => {
  describe("handleApiError", () => {
    it("should handle ValidationError (400)", () => {
      const error = new ValidationError("Invalid input");
      const result = handleApiError(error, "test_module");

      expect(result.status).toBe(400);
      expect(result.response.code).toBe("VALIDATION_ERROR");
      expect(result.response.error).toBe("Invalid input");
    });

    it("should handle AuthError (401)", () => {
      const error = new AuthError("Unauthorized");
      const result = handleApiError(error, "test_module");

      expect(result.status).toBe(401);
      expect(result.response.code).toBe("AUTH_ERROR");
    });

    it("should handle NotFoundError (404)", () => {
      const error = new NotFoundError("Resource not found");
      const result = handleApiError(error, "test_module");

      expect(result.status).toBe(404);
      expect(result.response.code).toBe("NOT_FOUND");
    });

    it("should handle DatabaseError (500)", () => {
      const error = new DatabaseError("Connection failed");
      const result = handleApiError(error, "test_module");

      expect(result.status).toBe(500);
      expect(result.response.code).toBe("DATABASE_ERROR");
    });

    it("should handle CsrfError (403)", () => {
      const error = new CsrfError();
      const result = handleApiError(error, "test_module");

      expect(result.status).toBe(403);
      expect(result.response.code).toBe("CSRF_TOKEN_INVALID");
    });

    it("should handle RateLimitError (429)", () => {
      const error = new RateLimitError(60);
      const result = handleApiError(error, "test_module");

      expect(result.status).toBe(429);
      expect(result.response.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should handle generic Error (500)", () => {
      const error = new Error("Generic error");
      const result = handleApiError(error, "test_module");

      expect(result.status).toBe(500);
      expect(result.response.code).toBe("SERVER_ERROR");
    });

    it("should include timestamp in response", () => {
      const error = new ValidationError("Test");
      const result = handleApiError(error, "test_module");

      expect(result.response.timestamp).toBeTruthy();
      expect(new Date(result.response.timestamp)).not.toEqual(new Date("Invalid"));
    });
  });

  describe("Error Classes", () => {
    it("should create ValidationError", () => {
      const error = new ValidationError("Test message");
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Test message");
    });

    it("should create RateLimitError with retryAfter", () => {
      const error = new RateLimitError(30);
      expect(error.retryAfter).toBe(30);
      expect(error.name).toBe("RateLimitError");
    });

    it("should create CsrfError with default message", () => {
      const error = new CsrfError();
      expect(error.message).toBe("CSRF token validation failed");
    });
  });
});
