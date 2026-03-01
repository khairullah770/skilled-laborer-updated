export const API_URL = "http://192.168.18.122:5000";

export interface ApiFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  token?: string | null;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface ApiFetchResult<T> {
  data: T;
  status: number;
}

export async function apiFetchJson<T = any>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiFetchResult<T>> {
  const {
    method = "GET",
    headers = {},
    body,
    token,
    timeoutMs = 10000,
    retries = 1,
    retryDelayMs = 500,
  } = options;

  const url = `${API_URL}${path}`;
  let attempt = 0;
  let lastError: any;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const finalHeaders: Record<string, string> = { ...headers };
      if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
      }

      let requestBody = body as any;

      const isFormData =
        typeof FormData !== "undefined" && body instanceof FormData;

      if (
        body != null &&
        typeof body === "object" &&
        !isFormData &&
        !finalHeaders["Content-Type"]
      ) {
        finalHeaders["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }

      console.log("apiFetchJson request", { method, url });

      const res = await fetch(url, {
        method,
        headers: finalHeaders,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await res.text();
      const contentType = res.headers.get("content-type") || "";
      const isJson =
        contentType.includes("application/json") ||
        contentType.includes("+json");
      const parsed = text && isJson ? JSON.parse(text) : (text as any);

      console.log("apiFetchJson response", {
        method,
        url,
        status: res.status,
      });

      if (!res.ok) {
        const error: any = new Error(
          parsed && typeof parsed === "object" && parsed.message
            ? parsed.message
            : `Request failed with status ${res.status}`,
        );
        error.status = res.status;
        error.body = parsed;
        throw error;
      }

      return { data: parsed as T, status: res.status };
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err;

      const name = err?.name || "Error";
      const isTimeout = name === "AbortError";
      const isNetwork = !err?.status;

      console.log("apiFetchJson error", { method, url, name });

      if (attempt === retries || (!isTimeout && !isNetwork)) {
        throw err;
      }

      const delay = retryDelayMs * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }

  throw lastError;
}
