
import { Route } from "next";
import qs from "qs";

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | QueryValue[]
  | Record<string, unknown>;

type ExtractRouteParams<T extends string> =
  T extends `${string}[${infer Param}]${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : {};

export function route<
  TRoute extends Route,
  TQuery extends Record<string, QueryValue> = {}
>(
  route: TRoute,
  params: ExtractRouteParams<TRoute>,
  query?: TQuery
) {
  const origin = process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "");
  if (!origin) throw new Error("NEXT_PUBLIC_URL not set");

  let path = route as string;

  for (const [key, value] of Object.entries(params)) {
    path = path.replace(
      `[${key}]`,
      encodeURIComponent(String(value))
    );
  }

  const queryString = query
    ? qs.stringify(query, {
        skipNulls: true,
        addQueryPrefix: true,
        arrayFormat: "brackets",
      })
    : "";

  return `${origin}${path}${queryString}`;
}