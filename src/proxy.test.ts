import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import proxy from "./proxy";

describe("Next.js 16 Proxy Route Protection", () => {
  function createRequest(url: string, cookies: Record<string, string> = {}) {
    const req = new NextRequest(new URL(url, "http://localhost:3000"));
    for (const [key, value] of Object.entries(cookies)) {
      req.cookies.set(key, value);
    }
    return req;
  }

  describe("Protected routes (/dashboard)", () => {
    it("redirects unauthenticated visitors to /login", () => {
      const request = createRequest("http://localhost:3000/dashboard");
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("redirects unauthenticated visitors from nested dashboard routes to /login", () => {
      const request = createRequest("http://localhost:3000/dashboard/settings");
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("allows authenticated users with authjs.session-token into /dashboard", () => {
      const request = createRequest("http://localhost:3000/dashboard", {
        "authjs.session-token": "valid-token-value",
      });
      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("allows authenticated users with __Secure-authjs.session-token into /dashboard", () => {
      const request = createRequest("http://localhost:3000/dashboard", {
        "__Secure-authjs.session-token": "valid-secure-token-value",
      });
      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });

  describe("Auth routes (/login, /register)", () => {
    it("allows unauthenticated visitors to visit /login", () => {
      const request = createRequest("http://localhost:3000/login");
      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("allows unauthenticated visitors to visit /register", () => {
      const request = createRequest("http://localhost:3000/register");
      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("redirects authenticated visitors from /login to /dashboard", () => {
      const request = createRequest("http://localhost:3000/login", {
        "authjs.session-token": "valid-token-value",
      });
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    });

    it("redirects authenticated visitors from /register to /dashboard", () => {
      const request = createRequest("http://localhost:3000/register", {
        "authjs.session-token": "valid-token-value",
      });
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    });
  });

  describe("Redirect loop prevention", () => {
    it("never redirects /login back to /login when unauthenticated", () => {
      const request = createRequest("http://localhost:3000/login");
      const response = proxy(request);

      expect(response.headers.get("location")).not.toBe("http://localhost:3000/login");
      expect(response.status).toBe(200);
    });

    it("never redirects /dashboard back to /dashboard when authenticated", () => {
      const request = createRequest("http://localhost:3000/dashboard", {
        "authjs.session-token": "valid-token-value",
      });
      const response = proxy(request);

      expect(response.headers.get("location")).not.toBe("http://localhost:3000/dashboard");
      expect(response.status).toBe(200);
    });
  });
});
