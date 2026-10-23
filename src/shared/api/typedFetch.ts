import { Result } from "rexult";

export type RequestInitWithoutBody = Omit<RequestInit, "body">;
export type RequestInitWithObjectBody<B> = RequestInitWithoutBody & {
  body?: B;
};

type E = { message: string; path?: string; code?: string };

export interface ResponseFailure {
  url: string;
  status: number | null;
  errors: E[];
}

export type TypedFetch<C = undefined> = <T, B = undefined>(
  url: string,
  config?: RequestInitWithObjectBody<B>,
  ownConfig?: C,
  // Throws DOMException AbortError on cancellation, never maps it to failure.
) => Promise<Result<T, ResponseFailure>>;

const isAbortError = (e: unknown): boolean =>
  (e instanceof DOMException && e.name === "AbortError") ||
  (e as Error)?.name === "AbortError";

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return text;
  }

  return JSON.parse(text);
};

const mapToError = (data: unknown): E => {
  const { message, path, code } = (data ?? {}) as E;
  return {
    message: message ?? String(data),
    ...(path !== undefined && { path }),
    ...(code !== undefined && { code }),
  };
};

// php-auth error envelope: { "error": "<slug>", "error_description": "<sentence>" }
// `code` carries the stable slug; `message` is only for display, never for logic.
const mapToErrors = (data: unknown): E[] => {
  if (data !== null && typeof data === "object" && "error" in data) {
    const { error, error_description: description } = data as {
      error: string;
      error_description?: string;
    };
    return [
      {
        message: description ?? error,
        ...(error !== undefined && { code: error }),
      },
    ];
  }

  // Non-OAuth envelope fallback (multi-error responses), same as upstream.
  const { errors } = (data ?? {}) as { errors: E[] };
  const { message } = (data ?? {}) as { message: string };

  if (errors) {
    return errors.map(mapToError);
  }

  return [{ message: message ?? "unknown fetching error" }];
};

const typedFetch: TypedFetch = async <T, B = undefined>(
  url: string,
  config: RequestInitWithObjectBody<B> = {},
): Promise<Result<T, ResponseFailure>> => {
  const { body, ..._cfg } = config;

  const _config: RequestInit = {
    mode: "cors",
    ..._cfg,
  };

  if (body) {
    _config.body = JSON.stringify(body);
    _config.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };
  }
  try {
    const response = await fetch(url, _config);
    let data: unknown;
    try {
      data = await parseBody(response);
    } catch (e) {
      if (isAbortError(e) || _config.signal?.aborted) {
        throw e;
      }
      data = undefined;
    }

    if (!response.ok) {
      return Result.failure({
        url,
        status: response.status,
        errors: mapToErrors(data),
      });
    }
    return Result.success(data as T);
  } catch (e) {
    if (isAbortError(e) || _config.signal?.aborted) {
      throw e;
    }
    return Result.failure({
      url,
      status: null,
      errors: [{ message: (e as Error)?.message ?? "unknown client error" }],
    });
  }
};

export { typedFetch };
