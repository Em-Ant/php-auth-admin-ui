import type { Result } from "rexult";
import type {
  RequestInitWithObjectBody,
  ResponseFailure,
  TypedFetch,
} from "./typedFetch";

interface AuthConfig {
  auth: boolean;
}

const withAuth =
  <C>(
    innerFetch: TypedFetch<C>,
    getToken: () => Promise<string>,
    refreshToken?: () => Promise<unknown>,
  ): TypedFetch<C & AuthConfig> =>
  async <T, B = undefined>(
    url: string,
    config?: RequestInitWithObjectBody<B>,
    ownConfig?: C & AuthConfig,
  ): Promise<Result<T, ResponseFailure>> => {
    const { auth } = ownConfig ?? ({ auth: true } as C & AuthConfig);

    if (!auth) {
      return innerFetch<T, B>(url, config, ownConfig as C);
    }

    const withToken = async (): Promise<RequestInitWithObjectBody<B>> => ({
      ...config,
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        ...config?.headers,
      },
    });

    const first = await innerFetch<T, B>(
      url,
      await withToken(),
      ownConfig as C,
    );

    // Access tokens expire in 300s on php-auth: retry once after a refresh
    // when the API answers 401.
    if (
      refreshToken &&
      first.isFailure() &&
      first.getFailureOrNull()?.status === 401 &&
      !config?.signal?.aborted
    ) {
      await refreshToken();
      return innerFetch<T, B>(url, await withToken(), ownConfig as C);
    }

    return first;
  };

export { withAuth };
