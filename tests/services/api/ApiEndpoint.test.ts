import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAuth,
  del,
  get,
  patch,
  patchForm,
  post,
  postForm,
  put,
} from "@/services/api/ApiHelper";

describe("ApiHelper", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    vi.restoreAllMocks();

    global.fetch = vi.fn();
  });

  describe("clearAuth", () => {
    it("should clear authentication data from localStorage", () => {
      localStorage.setItem("token", "test-token");
      localStorage.setItem("role", "User");
      localStorage.setItem("permissions", "read");
      localStorage.setItem("institution_id", "10");
      localStorage.setItem("user", "test-user");

      document.cookie = "token=test-token";
      document.cookie = "role=User";

      clearAuth();

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("role")).toBeNull();
      expect(localStorage.getItem("permissions")).toBeNull();
      expect(localStorage.getItem("institution_id")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });

  describe("GET", () => {
    it("should make a GET request", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ message: "success" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      const result = await get("/api/test");

      expect(fetch).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        message: "success",
      });
    });

    it("should include query parameters", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      await get("/api/test", {
        params: {
          page: 1,
          active: true,
          search: "test",
        },
      });

      const [url] = vi.mocked(fetch).mock.calls[0];

      expect(url).toContain("page=1");
      expect(url).toContain("active=true");
      expect(url).toContain("search=test");
    });
  });

  describe("Authorization", () => {
    it("should include the stored token", async () => {
      localStorage.setItem("token", "test-jwt-token");

      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      await get("/api/protected");

      const [, options] = vi.mocked(fetch).mock.calls[0];

      expect(options?.headers).toMatchObject({
        Authorization: "Bearer test-jwt-token",
      });
    });
  });

  describe("POST", () => {
    it("should send a JSON body", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      await post("/api/test", {
        name: "John",
        age: 25,
      });

      const [, options] = vi.mocked(fetch).mock.calls[0];

      expect(options?.method).toBe("POST");

      expect(options?.headers).toMatchObject({
        "Content-Type": "application/json",
      });

      expect(options?.body).toBe(
        JSON.stringify({
          name: "John",
          age: 25,
        })
      );
    });
  });

  describe("PUT", () => {
    it("should send a PUT request", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      await put("/api/test/1", {
        name: "Updated",
      });

      const [, options] = vi.mocked(fetch).mock.calls[0];

      expect(options?.method).toBe("PUT");
    });
  });

  describe("PATCH", () => {
    it("should send a PATCH request", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      await patch("/api/test/1", {
        status: "active",
      });

      const [, options] = vi.mocked(fetch).mock.calls[0];

      expect(options?.method).toBe("PATCH");
    });
  });

  describe("DELETE", () => {
    it("should send a DELETE request", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      await del("/api/test/1");

      const [, options] = vi.mocked(fetch).mock.calls[0];

      expect(options?.method).toBe("DELETE");
    });
  });

  describe("FormData", () => {
    it("should send FormData without Content-Type", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      const formData = new FormData();
      formData.append("name", "test");

      await postForm("/api/upload", formData);

      const [, options] = vi.mocked(fetch).mock.calls[0];

      expect(options?.method).toBe("POST");
      expect(options?.body).toBe(formData);

      expect(options?.headers).not.toHaveProperty(
        "Content-Type"
      );
    });

    it("should send FormData with PATCH", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      const formData = new FormData();
      formData.append("name", "updated");

      await patchForm("/api/upload", formData);

      const [, options] = vi.mocked(fetch).mock.calls[0];

      expect(options?.method).toBe("PATCH");
      expect(options?.body).toBe(formData);
    });
  });

  describe("unwrap", () => {
    it("should return the response field when unwrap is enabled", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            message: "success",
            response: {
              id: 1,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );

      const result = await get("/api/test", {
        unwrap: true,
      });

      expect(result).toEqual({
        id: 1,
      });
    });

    it("should return the data field when unwrap is enabled", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            data: {
              id: 2,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );

      const result = await get("/api/test", {
        unwrap: true,
      });

      expect(result).toEqual({
        id: 2,
      });
    });
  });

  describe("Error handling", () => {
    it("should throw an error for a failed request", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Bad request",
          }),
          {
            status: 400,
            statusText: "Bad Request",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );

      await expect(get("/api/test")).rejects.toThrow(
        "Bad request"
      );
    });

    it("should use error when message is unavailable", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Something went wrong",
          }),
          {
            status: 500,
            statusText: "Internal Server Error",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );

      await expect(get("/api/test")).rejects.toThrow(
        "Something went wrong"
      );
    });

    it("should handle a non-JSON error response", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        })
      );

      await expect(get("/api/test")).rejects.toThrow(
        "Internal Server Error"
      );
    });
  });
});