// URL for any embedded Explorer iframe
export const EMBEDDABLE_EXPLORER_URL =
  'https://explorer.embed.apollographql.com';
export const EMBEDDABLE_SANDBOX_URL =
  'https://sandbox.embed.apollographql.com/sandbox/explorer';

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
export const IFRAME_DOM_ID = (uniqueId: number) => `apollo-embed-${uniqueId}`;

// Message types for authentication
export const EXPLORER_LISTENING_FOR_HANDSHAKE = 'ExplorerListeningForHandshake';
export const HANDSHAKE_RESPONSE = 'HandshakeResponse';
export const SET_PARTIAL_AUTHENTICATION_TOKEN_FOR_PARENT =
  'SetPartialAuthenticationTokenForParent';
export const TRIGGER_LOGOUT_IN_PARENT = 'TriggerLogoutInParent';
export const EXPLORER_LISTENING_FOR_PARTIAL_TOKEN =
  'ExplorerListeningForPartialToken';
export const PARTIAL_AUTHENTICATION_TOKEN_RESPONSE =
  'PartialAuthenticationTokenResponse';
export const INTROSPECTION_QUERY_WITH_HEADERS = 'IntrospectionQueryWithHeaders';
export const PARENT_LOGOUT_SUCCESS = 'ParentLogoutSuccess';
