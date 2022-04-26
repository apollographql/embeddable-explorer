import type { IntrospectionQuery } from 'graphql';
import type { JSONValue } from './types';

// URL for any embedded Explorer iframe
export const EMBEDDABLE_EXPLORER_URL =
  'https://explorer.embed.apollographql.com';

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

// Message types for authentication
export const EXPLORER_LISTENING_FOR_HANDSHAKE = 'ExplorerListeningForHandshake';
export const HANDSHAKE_RESPONSE = 'HandshakeResponse';

type Error = {
  message: string;
};

export type OutgoingEmbedMessage =
  | {
      name: typeof SCHEMA_RESPONSE;
      schema: IntrospectionQuery | string | undefined;
    }
  | {
      name: typeof HANDSHAKE_RESPONSE;
      graphRef: string | undefined;
    }
  | {
      name: typeof EXPLORER_QUERY_MUTATION_RESPONSE;
      operationId: string;
      response: {
        data?: JSONValue;
        error?: Error;
        errors?: [Error];
      };
    };

export type IncomingEmbedMessage =
  | MessageEvent<{
      name: typeof EXPLORER_LISTENING_FOR_HANDSHAKE;
    }>
  | MessageEvent<{
      name: typeof EXPLORER_QUERY_MUTATION_REQUEST;
      operationName?: string;
      operation: string;
      operationId: string;
      variables?: Record<string, string>;
      headers?: Record<string, string>;
    }>
  | MessageEvent<{
      name: typeof EXPLORER_LISTENING_FOR_SCHEMA;
    }>;
