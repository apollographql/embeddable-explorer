import type {
  ExecutionResult,
  GraphQLError,
  IntrospectionQuery,
} from 'graphql';
import {
  PARTIAL_AUTHENTICATION_TOKEN_RESPONSE,
  EXPLORER_QUERY_MUTATION_RESPONSE,
  HANDSHAKE_RESPONSE,
  SCHEMA_ERROR,
  SCHEMA_RESPONSE,
  SET_PARTIAL_AUTHENTICATION_TOKEN_FOR_PARENT,
  EXPLORER_LISTENING_FOR_PARTIAL_TOKEN,
  PARENT_LOGOUT_SUCCESS,
  TRIGGER_LOGOUT_IN_PARENT,
  EXPLORER_SUBSCRIPTION_RESPONSE,
  EXPLORER_SET_SOCKET_ERROR,
  EXPLORER_SET_SOCKET_STATUS,
  TRACE_KEY,
  EXPLORER_LISTENING_FOR_HANDSHAKE,
  EXPLORER_QUERY_MUTATION_REQUEST,
  EXPLORER_SUBSCRIPTION_REQUEST,
  EXPLORER_SUBSCRIPTION_TERMINATION,
  EXPLORER_LISTENING_FOR_SCHEMA,
  INTROSPECTION_QUERY_WITH_HEADERS,
} from './constants';
import MIMEType from 'whatwg-mimetype';
import { readMultipartWebStream } from './readMultipartWebStream';
import type { JSONValue } from './types';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import type { GraphQLSubscriptionLibrary } from './subscriptionPostMessageRelayHelpers';

export type HandleRequest = (
  endpointUrl: string,
  options: Omit<RequestInit, 'headers'> & { headers: Record<string, string> }
) => Promise<Response>;

export type SocketStatus = 'disconnected' | 'connecting' | 'connected';

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

export type ResponseError = {
  message: string;
  stack?: string;
};

interface ResponseData {
  data?: Record<string, unknown> | JSONValue | ObjMap<unknown>;
  path?: Array<string | number>;
  errors?: Array<GraphQLError>;
  extensions?: { [TRACE_KEY]?: string };
}
type ExplorerResponse = ResponseData & {
  incremental?: Array<
    ResponseData & { path: NonNullable<ResponseData['path']> }
  >;
  error?: {
    message: string;
    stack?: string;
  };
  status?: number;
  headers?:
    | Record<string, string>
    | [Record<string, string>, ...Record<string, string>[]];
  hasNext?: boolean;
  size?: number;
};

export type OutgoingEmbedMessage =
  | {
      name: typeof SCHEMA_ERROR;
      error?: string;
      errors?: Array<GraphQLError>;
      operationId: string;
    }
  | {
      name: typeof SCHEMA_RESPONSE;
      schema: IntrospectionQuery | string | undefined;
      operationId: string;
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
      response: ExplorerResponse;
    }
  | {
      name: typeof EXPLORER_SUBSCRIPTION_RESPONSE;
      operationId: string;
      response: {
        data?: ExecutionResult<JSONValue | ObjMap<unknown>>;
        error?: Error;
        errors?: [Error];
      };
    }
  | {
      name: typeof EXPLORER_SET_SOCKET_ERROR;
      error: Error | undefined;
    }
  | {
      name: typeof EXPLORER_SET_SOCKET_STATUS;
      status: SocketStatus;
    }
  | {
      name: typeof PARENT_LOGOUT_SUCCESS;
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
      endpointUrl: string;
    }>
  | MessageEvent<{
      name: typeof EXPLORER_SUBSCRIPTION_REQUEST;
      operationId: string;
      operation: string;
      variables?: Record<string, string>;
      operationName?: string;
      headers?: Record<string, string>;
      subscriptionUrl: string;
      protocol: GraphQLSubscriptionLibrary;
    }>
  | MessageEvent<{
      name: typeof EXPLORER_SUBSCRIPTION_TERMINATION;
      operationId: string;
    }>
  | MessageEvent<{
      name: typeof EXPLORER_LISTENING_FOR_SCHEMA;
    }>
  | MessageEvent<{
      name: typeof SET_PARTIAL_AUTHENTICATION_TOKEN_FOR_PARENT;
      localStorageKey: string;
      partialToken: string;
    }>
  | MessageEvent<{
      name: typeof TRIGGER_LOGOUT_IN_PARENT;
      localStorageKey: string;
    }>
  | MessageEvent<{
      name: typeof EXPLORER_LISTENING_FOR_PARTIAL_TOKEN;
      localStorageKey?: string;
    }>
  | MessageEvent<{
      name: typeof INTROSPECTION_QUERY_WITH_HEADERS;
      introspectionRequestBody: string;
      introspectionRequestHeaders: Record<string, string>;
      sandboxEndpointUrl?: string;
      operationId: string;
    }>;

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
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = response.headers?.get('content-type');
      const mimeType = contentType && new MIMEType(contentType);
      if (
        mimeType &&
        mimeType.type === 'multipart' &&
        mimeType.subtype === 'mixed'
      ) {
        const observable = readMultipartWebStream(response, mimeType);

        let isFirst = true;
        observable.subscribe({
          next(data) {
            sendPostMessageToEmbed({
              message: {
                // Include the same operation ID in the response message's name
                // so the Explorer knows which operation it's associated with
                name: EXPLORER_QUERY_MUTATION_RESPONSE,
                operationId,
                response: {
                  incremental: data.data.incremental,
                  data: data.data.data,
                  errors: data.data.errors,
                  extensions: data.data.extensions,
                  path: data.data.path,
                  status: response.status,
                  headers: isFirst
                    ? [responseHeaders, ...(data.headers ? [data.headers] : [])]
                    : data.headers,
                  hasNext: true,
                  size: data.size,
                },
              },
              embeddedIFrameElement,
              embedUrl,
            });
            isFirst = false;
          },
          error(err) {
            sendPostMessageToEmbed({
              message: {
                // Include the same operation ID in the response message's name
                // so the Explorer knows which operation it's associated with
                name: EXPLORER_QUERY_MUTATION_RESPONSE,
                operationId,
                response: {
                  data: null,
                  error: {
                    message: err.message,
                    ...(err.stack ? { stack: err.stack } : {}),
                  },
                  size: 0,
                  hasNext: false,
                },
              },
              embeddedIFrameElement,
              embedUrl,
            });
          },
          complete() {
            sendPostMessageToEmbed({
              message: {
                // Include the same operation ID in the response message's name
                // so the Explorer knows which operation it's associated with
                name: EXPLORER_QUERY_MUTATION_RESPONSE,
                operationId,
                response: {
                  data: null,
                  size: 0,
                  status: response.status,
                  headers: isFirst ? responseHeaders : undefined,
                  hasNext: false,
                },
              },
              embeddedIFrameElement,
              embedUrl,
            });
          },
        });
      } else {
        const json = await response.json();

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
              hasNext: false,
            },
          },
          embeddedIFrameElement,
          embedUrl,
        });
      }
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
            hasNext: false,
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
  embedUrl,
  handleRequest,
  operationId,
}: {
  endpointUrl: string;
  embeddedIFrameElement: HTMLIFrameElement;
  headers?: Record<string, string>;
  introspectionRequestBody: string;
  embedUrl: string;
  handleRequest: HandleRequest;
  operationId: string;
}) {
  const { query, operationName } = JSON.parse(introspectionRequestBody) as {
    query: string;
    operationName: string;
  };
  return handleRequest(endpointUrl, {
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
            operationId,
          },
          embeddedIFrameElement,
          embedUrl,
        });
      }
      sendPostMessageToEmbed({
        message: {
          name: SCHEMA_RESPONSE,
          schema: response.data,
          operationId,
        },
        embeddedIFrameElement,
        embedUrl,
      });
    })
    .catch((error) => {
      sendPostMessageToEmbed({
        message: {
          name: SCHEMA_ERROR,
          error: error,
          operationId,
        },
        embeddedIFrameElement,
        embedUrl,
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
