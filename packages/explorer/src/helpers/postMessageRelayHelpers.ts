import type {
  ExecutionResult,
  GraphQLError,
  IntrospectionQuery,
} from 'graphql';
import {
  PARTIAL_AUTHENTICATION_TOKEN_RESPONSE,
  EXPLORER_QUERY_MUTATION_RESPONSE,
  HANDSHAKE_RESPONSE,
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
} from './constants';
import MIMEType from 'whatwg-mimetype';
import { readMultipartWebStream } from './readMultipartWebStream';
import type { JSONObject, JSONValue } from './types';
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import type {
  GraphQLSubscriptionLibrary,
  HTTPMultipartClient,
} from './subscriptionPostMessageRelayHelpers';

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

export interface ResponseData {
  data?: Record<string, unknown> | JSONValue | ObjMap<unknown>;
  path?: Array<string | number>;
  errors?: readonly GraphQLError[];
  extensions?: { [TRACE_KEY]?: string };
}
type ExplorerResponse = ResponseData & {
  incremental?: Array<
    ResponseData & { path: NonNullable<ResponseData['path']> }
  >;
  error?: ResponseError;
  status?: number;
  headers?: Record<string, string> | Record<string, string>[];
  hasNext?: boolean;
  size?: number;
};

// https://apollographql.quip.com/mkWRAJfuxa7L/Multipart-subscriptions-protocol-spec
export interface MultipartSubscriptionResponse {
  data: {
    errors?: Array<GraphQLError>;
    payload:
      | (ResponseData & {
          error?: { message: string; stack?: string };
        })
      | null;
  };
  headers?: Record<string, string> | Record<string, string>[];
  size: number;
  status?: number;
}

export type ExplorerSubscriptionResponse =
  // websocket response
  | {
      data?: ExecutionResult<JSONObject>;
      error?: Error;
      errors?: GraphQLError[];
    }
  // http multipart response options below
  | MultipartSubscriptionResponse
  | {
      data: null;
      // this only exists in the PM MultipartSubscriptionResponse
      // type, not in the one in explorer, because we want to send
      // caught errors like CORS errors through to the embed
      error?: ResponseError;
      status?: number;
      headers?: Record<string, string> | Record<string, string>[];
    };

export type OutgoingEmbedMessage =
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
      response: ExplorerResponse;
    }
  | {
      name: typeof EXPLORER_SUBSCRIPTION_RESPONSE;
      operationId: string;
      response: ExplorerSubscriptionResponse;
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
      // TODO (evan, 2023-02): We should make includeCookies non-optional in a few months to account for service workers refreshing
      includeCookies?: boolean;
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
      // only used for multipart protocol
      httpMultipartParams: {
        includeCookies: boolean | undefined;
      };
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
    }>;

export async function executeOperation({
  endpointUrl,
  handleRequest,
  operation,
  operationName,
  variables,
  headers,
  includeCookies,
  embeddedIFrameElement,
  operationId,
  embedUrl,
  isMultipartSubscription,
  multipartSubscriptionClient,
}: {
  endpointUrl: string;
  handleRequest: HandleRequest;
  operation: string;
  operationId: string;
  embeddedIFrameElement: HTMLIFrameElement;
  operationName: string | undefined;
  variables?: Record<string, string>;
  headers?: Record<string, string>;
  includeCookies?: boolean;
  embedUrl: string;
  isMultipartSubscription: boolean;
  multipartSubscriptionClient?: HTTPMultipartClient;
}) {
  return handleRequest(endpointUrl, {
    method: 'POST',
    headers: getHeadersWithContentType(headers),
    body: JSON.stringify({
      query: operation,
      variables,
      operationName,
    }),
    ...(!!includeCookies
      ? { credentials: 'include' }
      : { credentials: 'omit' }),
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
        multipartSubscriptionClient?.emit('connected');
        const { observable, closeReadableStream } = readMultipartWebStream(
          response,
          mimeType
        );

        let isFirst = true;

        const observableSubscription = observable.subscribe({
          next(data) {
            // if shouldTerminate is true, we got a server error
            // we handle this in Explorer, but we need to disconnect from
            // the readableStream & subscription here
            if ('payload' in data.data) {
              if ('shouldTerminate' in data && data.shouldTerminate) {
                observableSubscription.unsubscribe();
                closeReadableStream();
                // the status being disconnected will be handled in the Explorer
                // but we send a pm just in case
                sendPostMessageToEmbed({
                  message: {
                    name: EXPLORER_SET_SOCKET_STATUS,
                    status: 'disconnected',
                  },
                  embeddedIFrameElement,
                  embedUrl,
                });
              }
              sendPostMessageToEmbed({
                message: {
                  name: EXPLORER_SUBSCRIPTION_RESPONSE,
                  // Include the same operation ID in the response message's name
                  // so the Explorer knows which operation it's associated with
                  operationId,
                  response: {
                    data: data.data,
                    status: response.status,
                    headers: isFirst
                      ? [
                          responseHeaders,
                          ...(Array.isArray(data.headers)
                            ? data.headers
                            : data.headers
                            ? [data.headers]
                            : []),
                        ]
                      : data.headers,
                    size: data.size,
                  },
                },
                embeddedIFrameElement,
                embedUrl,
              });
            } else {
              sendPostMessageToEmbed({
                message: {
                  name: EXPLORER_QUERY_MUTATION_RESPONSE,
                  // Include the same operation ID in the response message's name
                  // so the Explorer knows which operation it's associated with
                  operationId,
                  response: {
                    incremental: data.data.incremental,
                    data: data.data.data,
                    errors: data.data.errors,
                    extensions: data.data.extensions,
                    path: data.data.path,
                    status: response.status,
                    headers: isFirst
                      ? [
                          responseHeaders,
                          ...(Array.isArray(data.headers)
                            ? data.headers
                            : data.headers
                            ? [data.headers]
                            : []),
                        ]
                      : data.headers,
                    hasNext: true,
                    size: data.size,
                  },
                },
                embeddedIFrameElement,
                embedUrl,
              });
            }
            isFirst = false;
          },
          error(err: unknown) {
            const error =
              err &&
              typeof err === 'object' &&
              'message' in err &&
              typeof err.message === 'string'
                ? {
                    message: err.message,
                    ...('stack' in err && typeof err.stack === 'string'
                      ? { stack: err.stack }
                      : {}),
                  }
                : undefined;
            sendPostMessageToEmbed({
              message: {
                name: isMultipartSubscription
                  ? EXPLORER_SUBSCRIPTION_RESPONSE
                  : EXPLORER_QUERY_MUTATION_RESPONSE,
                // Include the same operation ID in the response message's name
                // so the Explorer knows which operation it's associated with
                operationId,
                response: {
                  data: null,
                  error,
                  ...(!isMultipartSubscription ? { hasNext: false } : {}),
                },
              },
              embeddedIFrameElement,
              embedUrl,
            });
          },
          complete() {
            sendPostMessageToEmbed({
              message: {
                name: isMultipartSubscription
                  ? EXPLORER_SUBSCRIPTION_RESPONSE
                  : EXPLORER_QUERY_MUTATION_RESPONSE,
                // Include the same operation ID in the response message's name
                // so the Explorer knows which operation it's associated with
                operationId,
                response: {
                  data: null,
                  status: response.status,
                  headers: isFirst ? responseHeaders : undefined,
                  ...(!isMultipartSubscription ? { hasNext: false } : {}),
                },
              },
              embeddedIFrameElement,
              embedUrl,
            });
          },
        });
        if (multipartSubscriptionClient) {
          multipartSubscriptionClient.stopListeningCallback = () => {
            closeReadableStream();
            observableSubscription.unsubscribe();
          };
        }
      } else {
        const json = await response.json();

        // if we didn't get the mime type multi part response,
        // something went wrong with this multipart subscription
        multipartSubscriptionClient?.emit('error');
        multipartSubscriptionClient?.emit('disconnected');
        sendPostMessageToEmbed({
          message: {
            name: isMultipartSubscription
              ? EXPLORER_SUBSCRIPTION_RESPONSE
              : EXPLORER_QUERY_MUTATION_RESPONSE,
            // Include the same operation ID in the response message's name
            // so the Explorer knows which operation it's associated with
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
    .catch((err) => {
      multipartSubscriptionClient?.emit('error', err);
      multipartSubscriptionClient?.emit('disconnected');
      const error =
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string'
          ? {
              message: err.message,
              ...('stack' in err && typeof err.stack === 'string'
                ? { stack: err.stack }
                : {}),
            }
          : undefined;
      sendPostMessageToEmbed({
        message: {
          name: isMultipartSubscription
            ? EXPLORER_SUBSCRIPTION_RESPONSE
            : EXPLORER_QUERY_MUTATION_RESPONSE,
          // Include the same operation ID in the response message's name
          // so the Explorer knows which operation it's associated with
          operationId,
          response: {
            data: null,
            error,
            ...(!isMultipartSubscription ? { hasNext: false } : {}),
          },
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
