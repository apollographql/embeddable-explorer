// URL for any embedded Explorer iframe
export const EMBEDDABLE_EXPLORER_URL = 'https://embed.apollo.local:3000';
// 'https://explorer.embed.apollographql.com';

// Message types for Explorer state
export const EXPLORER_LISTENING_FOR_SCHEMA = 'ExplorerListeningForSchema';
export const EXPLORER_LISTENING_FOR_STATE = 'ExplorerListeningForState';
export const SET_OPERATION = 'SetOperation';
export const SCHEMA_ERROR = 'SchemaError';
export const SCHEMA_RESPONSE = 'SchemaResponse';

// Message types for queries and mutations
export const EXPLORER_QUERY_MUTATION_REQUEST = 'ExplorerRequest';
export const EXPLORER_QUERY_MUTATION_RESPONSE = 'ExplorerResponse';

// Message types for subscriptions
export const EXPLORER_SUBSCRIPTION_REQUEST = 'ExplorerSubscriptionRequest';
export const EXPLORER_SUBSCRIPTION_RESPONSE = 'ExplorerSubscriptionResponse';
export const EXPLORER_SUBSCRIPTION_TERMINATION =
  'ExplorerSubscriptionTermination';
export const IFRAME_DOM_ID = (uniqueId: number) =>
  `apollo-embedded-explorer-${uniqueId}`;
