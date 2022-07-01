import type { GraphQLError, IntrospectionQuery } from 'graphql';
import {
  PARTIAL_AUTHENTICATION_TOKEN_RESPONSE,
  EMBEDDABLE_SANDBOX_URL,
  EXPLORER_QUERY_MUTATION_RESPONSE,
  HANDSHAKE_RESPONSE,
  SCHEMA_ERROR,
  SCHEMA_RESPONSE,
  SET_PARTIAL_AUTHENTICATION_TOKEN_FOR_PARENT,
  EXPLORER_LISTENING_FOR_PARTIAL_TOKEN,
  PARENT_LOGOUT_SUCCESS,
  TRIGGER_LOGOUT_IN_PARENT,
} from './constants';
import type { JSONValue } from './types';

export type HandleRequest = (
  endpointUrl: string,
  options: Omit<RequestInit, 'headers'> & { headers: Record<string, string> }
) => Promise<Response>;

// Helper function that adds content-type: application/json
// to each request's headers if not present
function getHeadersWithContentType(
  headers: Record<string, string> | undefined
) {
  const headersWithContentType = headers ?? {};
  if (
    Object.keys(headersWithContentType).every(
      (key) => key.toLowerCase() !== 'content-type'
    )
  ) {
    headersWithContentType['content-type'] = 'application/json';
  }
  return headersWithContentType;
}

export function sendPostMessageToEmbed({
  message,
  embeddedIFrameElement,
  embedUrl,
}: {
  message: OutgoingEmbedMessage;
  embeddedIFrameElement: HTMLIFrameElement;
  embedUrl: string;
}) {
  embeddedIFrameElement?.contentWindow?.postMessage(message, embedUrl);
}

type Error = {
  message: string;
  stack?: string;
};

export type OutgoingEmbedMessage =
  | {
      name: typeof SCHEMA_ERROR;
      error?: string;
      errors?: Array<GraphQLError>;
    }
  | {
      name: typeof SCHEMA_RESPONSE;
      schema: IntrospectionQuery | string | undefined;
    }
  | {
      name: typeof HANDSHAKE_RESPONSE;
      graphRef?: string;
      inviteToken?: string;
      accountId?: string;
      parentHref?: string;
    }
  | {
      name: typeof PARTIAL_AUTHENTICATION_TOKEN_RESPONSE;
      partialToken?: string;
    }
  | {
      name: typeof EXPLORER_QUERY_MUTATION_RESPONSE;
      operationId: string;
      response: {
        data?: JSONValue;
        error?: Error;
        errors?: [Error];
        status?: number;
        headers?: Headers;
      };
    }
  | {
      name: typeof PARENT_LOGOUT_SUCCESS;
    };

// TODO(Maya) uncomment and switch to MessageEvent as a generic when tsdx supports Typescript V4.
// https://github.com/jaredpalmer/tsdx/issues/926
export type IncomingEmbedMessage = MessageEvent;
// | MessageEvent<{
//     name: typeof EXPLORER_LISTENING_FOR_HANDSHAKE;
//   }>
// | MessageEvent<{
//     name: typeof EXPLORER_QUERY_MUTATION_REQUEST;
//     operationName?: string;
//     operation: string;
//     operationId: string;
//     variables?: Record<string, string>;
//     headers?: Record<string, string>;
//     endpointUrl?: string;
//   }>
// | MessageEvent<{
//     name: typeof EXPLORER_LISTENING_FOR_SCHEMA;
//   }>
// | MessageEvent<{
//     name: typeof SET_PARTIAL_AUTHENTICATION_TOKEN_FOR_PARENT;
//     localStorageKey: string;
//     partialToken: string;
//   }>
// | MessageEvent<{
//     name: typeof TRIGGER_LOGOUT_IN_PARENT;
//     localStorageKey: string;
//   }>
// | MessageEvent<{
//     name: typeof EXPLORER_LISTENING_FOR_PARTIAL_TOKEN;
//     localStorageKey?: string;
//   }>
// | MessageEvent<{
//     name: typeof INTROSPECTION_QUERY_WITH_HEADERS;
//     introspectionRequestBody: string;
//     introspectionRequestHeaders: Record<string, string>;
//     sandboxEndpointUrl?: string;
//   }>;

export function executeOperation({
  endpointUrl,
  handleRequest,
  operation,
  operationName,
  variables,
  headers,
  embeddedIFrameElement,
  operationId,
  embedUrl,
}: {
  endpointUrl: string;
  handleRequest: HandleRequest;
  operation: string;
  operationId: string;
  embeddedIFrameElement: HTMLIFrameElement;
  operationName: string | undefined;
  variables?: Record<string, string>;
  headers?: Record<string, string>;
  embedUrl: string;
}) {
  return handleRequest(endpointUrl, {
    method: 'POST',
    headers: getHeadersWithContentType(headers),
    body: JSON.stringify({
      query: operation,
      variables,
      operationName,
    }),
  })
    .then(async (response) => {
      const json = await response.json();

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      sendPostMessageToEmbed({
        message: {
          // Include the same operation ID in the response message's name
          // so the Explorer knows which operation it's associated with
          name: EXPLORER_QUERY_MUTATION_RESPONSE,
          operationId,
          response: {
            ...json,
            status: response.status,
            headers: responseHeaders,
          },
        },
        embeddedIFrameElement,
        embedUrl,
      });
    })
    .catch((response) => {
      sendPostMessageToEmbed({
        message: {
          // Include the same operation ID in the response message's name
          // so the Explorer knows which operation it's associated with
          name: EXPLORER_QUERY_MUTATION_RESPONSE,
          operationId,
          response: {
            error: {
              message: response.message,
              ...(response.stack ? { stack: response.stack } : {}),
            },
          },
        },
        embeddedIFrameElement,
        embedUrl,
      });
    });
}

export function executeIntrospectionRequest({
  endpointUrl,
  headers,
  introspectionRequestBody,
  embeddedIFrameElement,
}: {
  endpointUrl: string;
  embeddedIFrameElement: HTMLIFrameElement;
  headers?: Record<string, string>;
  introspectionRequestBody: string;
}) {
  const { query, operationName } = JSON.parse(introspectionRequestBody) as {
    query: string;
    operationName: string;
  };
  return fetch(endpointUrl, {
    method: 'POST',
    headers: getHeadersWithContentType(headers),
    body: JSON.stringify({
      query,
      operationName,
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.errors && response.errors.length) {
        sendPostMessageToEmbed({
          message: {
            name: SCHEMA_ERROR,
            errors: response.errors,
          },
          embeddedIFrameElement,
          embedUrl: EMBEDDABLE_SANDBOX_URL,
        });
      }
      sendPostMessageToEmbed({
        message: {
          name: SCHEMA_RESPONSE,
          schema: response.data,
        },
        embeddedIFrameElement,
        embedUrl: EMBEDDABLE_SANDBOX_URL,
      });
    })
    .catch((error) => {
      sendPostMessageToEmbed({
        message: {
          name: SCHEMA_ERROR,
          error: error,
        },
        embeddedIFrameElement,
        embedUrl: EMBEDDABLE_SANDBOX_URL,
      });
    });
}

export const handleAuthenticationPostMessage = ({
  event,
  embeddedIFrameElement,
  embedUrl,
}: {
  event: IncomingEmbedMessage;
  embeddedIFrameElement: HTMLIFrameElement;
  embedUrl: string;
}) => {
  const { data } = event;
  // When the embed authenticates, save the partial token in local storage
  if (data.name === SET_PARTIAL_AUTHENTICATION_TOKEN_FOR_PARENT) {
    const partialEmbedApiKeysString = window.localStorage.getItem(
      'apolloStudioEmbeddedExplorerEncodedApiKey'
    );
    const partialEmbedApiKeys = partialEmbedApiKeysString
      ? JSON.parse(partialEmbedApiKeysString)
      : {};
    partialEmbedApiKeys[data.localStorageKey] = data.partialToken;
    window.localStorage.setItem(
      'apolloStudioEmbeddedExplorerEncodedApiKey',
      JSON.stringify(partialEmbedApiKeys)
    );
  }

  // When the embed logs out, remove the partial token in local storage
  if (data.name === TRIGGER_LOGOUT_IN_PARENT) {
    const partialEmbedApiKeysString = window.localStorage.getItem(
      'apolloStudioEmbeddedExplorerEncodedApiKey'
    );
    const partialEmbedApiKeys = partialEmbedApiKeysString
      ? JSON.parse(partialEmbedApiKeysString)
      : {};
    delete partialEmbedApiKeys[data.localStorageKey];
    window.localStorage.setItem(
      'apolloStudioEmbeddedExplorerEncodedApiKey',
      JSON.stringify(partialEmbedApiKeys)
    );
    sendPostMessageToEmbed({
      message: { name: PARENT_LOGOUT_SUCCESS },
      embeddedIFrameElement,
      embedUrl,
    });
  }

  if (
    data.name === EXPLORER_LISTENING_FOR_PARTIAL_TOKEN &&
    data.localStorageKey
  ) {
    const partialEmbedApiKeysString = window.localStorage.getItem(
      'apolloStudioEmbeddedExplorerEncodedApiKey'
    );
    const partialEmbedApiKeys = partialEmbedApiKeysString
      ? JSON.parse(partialEmbedApiKeysString)
      : {};
    if (partialEmbedApiKeys && partialEmbedApiKeys[data.localStorageKey]) {
      sendPostMessageToEmbed({
        message: {
          name: PARTIAL_AUTHENTICATION_TOKEN_RESPONSE,
          partialToken: partialEmbedApiKeys[data.localStorageKey],
        },
        embeddedIFrameElement,
        embedUrl,
      });
    }
  }
};
