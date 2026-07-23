const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Options = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  unwrap?: boolean;
};

function buildUrl(endpoint: string, params?: Options["params"]) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

// Reads the token regardless of which key name was used to store it.
// NOTE: pick ONE key going forward (recommend "token", since that's what
// the cookie is also named) and stop writing "access_token" anywhere —
// this fallback is a safety net, not a long-term fix for the mismatch.
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ?? localStorage.getItem("access_token")
  );
}

function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  document.cookie = "token=; path=/; max-age=0";
}

async function handleResponse<T>(
  response: Response,
  unwrap: boolean
): Promise<T> {
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const data = isJson ? await response.json() : null;

  if (response.status === 401 && typeof window !== "undefined") {
    clearAuth();

    // Avoid redirect loops if we're already on the login page.
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || response.statusText || "Request failed");
  }

  if (unwrap) {
    // Supports APIs that return:
    // { response: ... }
    if (data?.response !== undefined) {
      return data.response as T;
    }

    // Supports APIs that return:
    // { data: ... }
    if (data?.data !== undefined) {
      return data.data as T;
    }

    // If neither exists, return the whole response.
    return data as T;
  }

  return data as T;
}


async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options?: Options
): Promise<T> {
  const token = getStoredToken();
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(buildUrl(endpoint, options?.params), {
    method,
    headers,
    cache: "no-store",
    ...(body !== undefined
      ? {
          body: isFormData
            ? (body as FormData)
            : JSON.stringify(body),
        }
      : {}),
  });

  return handleResponse<T>(response, options?.unwrap ?? false);
}

export function get<T>(endpoint: string, options?: Options): Promise<T> {
  return request<T>("GET", endpoint, undefined, options);
}

export function post<T>(
  endpoint: string,
  body?: unknown,
  options?: Options
): Promise<T> {
  return request<T>("POST", endpoint, body, options);
}

// Use for endpoints that read multipart form data (c.FormValue / c.FormFile
// on the Fiber side) instead of a JSON body — e.g. anything with a file
// upload like logo. Pass a FormData instance, not a plain object.
export function postForm<T>(
  endpoint: string,
  formData: FormData,
  options?: Options
): Promise<T> {
  return request<T>("POST", endpoint, formData, options);
}

export function put<T>(
  endpoint: string,
  body?: unknown,
  options?: Options
): Promise<T> {
  return request<T>("PUT", endpoint, body, options);
}

export function patch<T>(
  endpoint: string,
  body?: unknown,
  options?: Options
): Promise<T> {
  return request<T>("PATCH", endpoint, body, options);
}

export function del<T>(endpoint: string, options?: Options): Promise<T> {
  return request<T>("DELETE", endpoint, undefined, options);
}