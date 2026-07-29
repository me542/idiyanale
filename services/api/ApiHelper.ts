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

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("token") ??
    localStorage.getItem("access_token")
  );
}

function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("role");
}

export function clearAuth() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  localStorage.removeItem("institution_id");
  localStorage.removeItem("user");

  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "role=; path=/; max-age=0";
}

let isRedirecting = false;

async function handleResponse<T>(
  response: Response,
  unwrap: boolean
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;

  const isJson =
    response.headers
      .get("content-type")
      ?.includes("application/json") ?? false;

  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      // Read the role BEFORE clearing localStorage.
      const role = getStoredRole();

      clearAuth();

      if (!isRedirecting) {
        isRedirecting = true;

        sessionStorage.setItem(
          "sessionExpired",
          data?.message ?? "Your session has expired due to inactivity."
        );

        const loginPath =
          role === "Super-Admin"
            ? "/super-admin"
            : "/login";

        const currentPath = window.location.pathname;

        // Don't redirect if already on a login page.
        if (
          currentPath !== "/login" &&
          currentPath !== "/super-admin"
        ) {
          window.location.replace(loginPath);
        }

        // Reset redirect guard after navigation.
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }

    throw new Error(
      data?.message ?? "Session expired due to inactivity."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ??
        data?.error ??
        response.statusText ??
        "Request failed"
    );
  }

  if (!unwrap) {
    return data as T;
  }

  if (data?.response !== undefined) {
    return data.response as T;
  }

  if (data?.data !== undefined) {
    return data.data as T;
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
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
    ...options?.headers,
  };

  const response = await fetch(
    buildUrl(endpoint, options?.params),
    {
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
    }
  );

  return handleResponse<T>(
    response,
    options?.unwrap ?? false
  );
}

export function get<T>(
  endpoint: string,
  options?: Options
): Promise<T> {
  return request<T>("GET", endpoint, undefined, options);
}

export function post<T>(
  endpoint: string,
  body?: unknown,
  options?: Options
): Promise<T> {
  return request<T>("POST", endpoint, body, options);
}

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

export function del<T>(
  endpoint: string,
  options?: Options
): Promise<T> {
  return request<T>("DELETE", endpoint, undefined, options);
}