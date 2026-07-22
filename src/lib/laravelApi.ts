/** @format */

const configuredBaseUrl = import.meta.env.VITE_LARAVEL_API_URL?.trim();

export const LARAVEL_API_BASE_URL = (
  configuredBaseUrl || "http://localhost:8000"
).replace(/\/+$/, "");

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class LaravelApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(
    message: string,
    status: number,
    payload: ApiErrorPayload | null,
  ) {
    super(message);
    this.name = "LaravelApiError";
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  csrf?: boolean;
};

const CSRF_REFRESH_MS = 20 * 60 * 1000;

let csrfReadyUntil = 0;
let csrfRequest: Promise<void> | null = null;

const inFlightGetRequests = new Map<string, Promise<unknown>>();

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${LARAVEL_API_BASE_URL}${normalizedPath}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));

  return cookie ? cookie.slice(encodedName.length) : null;
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

function firstValidationMessage(payload: ApiErrorPayload | null) {
  if (!payload?.errors) return null;

  for (const messages of Object.values(payload.errors)) {
    const message = messages?.[0];

    if (message) return message;
  }

  return null;
}

export async function ensureLaravelCsrfCookie(force = false) {
  const now = Date.now();
  const existingToken = readCookie("XSRF-TOKEN");

  if (!force && existingToken && csrfReadyUntil > now) {
    return;
  }

  if (!force && existingToken && csrfReadyUntil === 0) {
    csrfReadyUntil = now + CSRF_REFRESH_MS;
    return;
  }

  if (!force && csrfRequest) {
    return csrfRequest;
  }

  csrfRequest = fetch(buildUrl("/sanctum/csrf-cookie"), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok && response.status !== 204) {
        throw new LaravelApiError(
          "Could not initialize the secure session.",
          response.status,
          null,
        );
      }

      csrfReadyUntil = Date.now() + CSRF_REFRESH_MS;
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
  retryAfterCsrfFailure: boolean,
): Promise<T> {
  const method = options.method || "GET";

  if (options.csrf) {
    await ensureLaravelCsrfCookie();
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.csrf) {
    const xsrfCookie = readCookie("XSRF-TOKEN");

    if (xsrfCookie) {
      headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfCookie);
    }
  }

  const response = await fetch(buildUrl(path), {
    method,
    credentials: "include",
    headers,
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  });

  if (
    response.status === 419 &&
    options.csrf &&
    retryAfterCsrfFailure
  ) {
    csrfReadyUntil = 0;
    await ensureLaravelCsrfCookie(true);

    return performRequest<T>(path, options, false);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const errorPayload =
      payload && typeof payload === "object"
        ? (payload as ApiErrorPayload)
        : null;

    throw new LaravelApiError(
      firstValidationMessage(errorPayload) ||
        errorPayload?.message ||
        `Laravel API request failed with status ${response.status}.`,
      response.status,
      errorPayload,
    );
  }

  return payload as T;
}

export async function laravelRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method || "GET";

  if (method !== "GET") {
    return performRequest<T>(path, options, true);
  }

  const key = buildUrl(path);
  const existing = inFlightGetRequests.get(key);

  if (existing) {
    return existing as Promise<T>;
  }

  const request = performRequest<T>(path, options, true).finally(() => {
    inFlightGetRequests.delete(key);
  });

  inFlightGetRequests.set(key, request);

  return request;
}

export function laravelGet<T>(path: string) {
  return laravelRequest<T>(path);
}

export function laravelPost<T>(path: string, body?: unknown) {
  return laravelRequest<T>(path, {
    method: "POST",
    body,
    csrf: true,
  });
}

export function laravelPatch<T>(path: string, body?: unknown) {
  return laravelRequest<T>(path, {
    method: "PATCH",
    body,
    csrf: true,
  });
}
