import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
/**
 * Create a preconfigured QueryClient with the app's default caching and dehydration rules.
 *
 * The client sets queries.staleTime to 30 seconds and configures dehydration so that a query
 * will be dehydrated if the default shouldDehydrate logic accepts it or if the query's state
 * status is "pending". (Placeholders for data serialization/deserialization via superjson are present but disabled.)
 *
 * @returns A new QueryClient instance configured with the project's default options
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
      },
    },
  });
}