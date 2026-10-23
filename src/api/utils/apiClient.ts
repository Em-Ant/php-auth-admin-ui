import {
  type RequestInitWithoutBody,
  type TypedFetch,
  typedFetch,
} from "./typedFetch";

const createApiClient = <C = undefined>(fetch: TypedFetch<C>) => {
  const get = async <T>(
    url: string,
    options: RequestInitWithoutBody = {},
    ownConfig?: C,
  ) => fetch<T>(url, options, ownConfig);

  const post = async <T, B>(
    url: string,
    body: B,
    options: RequestInitWithoutBody = {},
    ownConfig?: C,
  ) => fetch<T, B>(url, { ...options, method: "POST", body }, ownConfig);

  const put = async <T, B>(
    url: string,
    body: B,
    options: RequestInitWithoutBody = {},
    ownConfig?: C,
  ) => fetch<T, B>(url, { ...options, method: "PUT", body }, ownConfig);

  const patch = async <T, B>(
    url: string,
    body: B,
    options: RequestInitWithoutBody = {},
    ownConfig?: C,
  ) => fetch<T, B>(url, { ...options, method: "PATCH", body }, ownConfig);

  const _delete = async <T>(
    url: string,
    options: RequestInitWithoutBody = {},
    ownConfig?: C,
  ) => fetch<T>(url, { ...options, method: "DELETE" }, ownConfig);

  return {
    get,
    post,
    patch,
    put,
    delete: _delete,
  };
};

const rawApiClient = createApiClient(typedFetch);

export { createApiClient, rawApiClient };
