import type { Result } from "rexult";
import { isAbsolute, join } from "@/shared/lib/path";
import type {
  RequestInitWithObjectBody,
  ResponseFailure,
  TypedFetch,
} from "./typedFetch";

const withBaseUrl =
  <C>(
    typedFetch: TypedFetch<C>,
    getBaseUrl: () => Promise<string>,
  ): TypedFetch<C> =>
  async <T, B = undefined>(
    url: string,
    config: RequestInitWithObjectBody<B> = {},
    ownConfig?: C,
  ): Promise<Result<T, ResponseFailure>> => {
    const _url = isAbsolute(url) ? url : join([await getBaseUrl(), url]);
    return typedFetch<T, B>(_url, config, ownConfig);
  };

export { withBaseUrl };
