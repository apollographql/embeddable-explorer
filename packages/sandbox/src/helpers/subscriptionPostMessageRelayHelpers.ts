import EventEmitter from 'eventemitter3';
import type { ExecutionResult } from 'graphql';
import { Client, createClient as createGraphQLWSClient } from 'graphql-ws';
import {
  Observer,
  OperationOptions,
  SubscriptionClient as TransportSubscriptionClient,
} from 'subscriptions-transport-ws';
import {
  EXPLORER_SET_SOCKET_ERROR,
  EXPLORER_SET_SOCKET_STATUS,
  EXPLORER_SUBSCRIPTION_RESPONSE,
  EXPLORER_SUBSCRIPTION_TERMINATION,
} from './constants';
import {
  addMessageListener,
  DisposableResource,
  executeOperation,
  HandleRequest,
  sendPostMessageToEmbed,
  SocketStatus,
} from './postMessageRelayHelpers';
import type { JSONObject } from './types';

export type GraphQLSubscriptionLibrary =
  | 'subscriptions-transport-ws'
  | 'graphql-ws'
  | 'http-multipart';

// @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
function assertUnreachable(x: never): never {
  throw new Error(`Didn't expect to get here ${x}`);
}

type HTTPMultipartParams = {
  includeCookies?: boolean;
  handleRequest: HandleRequest;
};

export type HTTPMultipartClient = EventEmitter<
  'connected' | 'error' | 'disconnected'
> & {
  stopListeningCallback: (() => void) | undefined;
};

class SubscriptionClient<Protocol extends GraphQLSubscriptionLibrary> {
  protocol: Protocol;
  unsubscribeFunctions: Array<() => void> = [];
  url: string;
  headers: Record<string, string> | undefined;
  // Private variables
  private _multipartClient: HTTPMultipartClient | undefined;
  private _graphWsClient: Client | undefined;
  private _transportSubscriptionClient: undefined | TransportSubscriptionClient;

  constructor(
    url: string,
    headers: Record<string, string> | undefined,
    protocol: Protocol
  ) {
    this.protocol = protocol;
    this.url = url;
    this.headers = headers;
  }

  public get graphWsClient(): Client {
    const client =
      this._graphWsClient ??
      createGraphQLWSClient({
        url: this.url,
        lazy: true,
        connectionParams: this.headers ?? {},
        keepAlive: 10_000,
      });
    this._graphWsClient = client;
    return client;
  }

  public get transportSubscriptionClient(): TransportSubscriptionClient {
    const client =
      this._transportSubscriptionClient ??
      new TransportSubscriptionClient(this.url, {
        reconnect: true,
        lazy: true,
        connectionParams: this.headers ?? {},
      });
    this._transportSubscriptionClient = client;
    return client;
  }

  public get multipartClient(): HTTPMultipartClient {
    const client =
      this._multipartClient ??
      Object.assign(
        new EventEmitter<'connected' | 'error' | 'disconnected'>(),
        {
          stopListeningCallback: undefined,
        }
      );
    this._multipartClient = client;
    return client;
  }

  onConnected(callback: () => void) {
    if (this.protocol === 'http-multipart') {
      this.multipartClient.on('connected', callback);
      return () => this.multipartClient.off('connected', callback);
    }
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.on('connected', callback);
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onConnected(callback);
    }
    assertUnreachable(this.protocol);
  }
  onConnecting(callback: () => void) {
    if (this.protocol === 'http-multipart') {
      return;
    }
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.on('connecting', callback);
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onConnecting(callback);
    }
    assertUnreachable(this.protocol);
  }
  onError(callback: (e: Error) => void) {
    if (this.protocol === 'http-multipart') {
      this.multipartClient.on('error', callback);
      return () => this.multipartClient.off('error', callback);
    }
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.on('error', (error: unknown) =>
        callback(error as Error)
      );
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onError((e: Error) =>
        callback(e)
      );
    }
    assertUnreachable(this.protocol);
  }
  onReconnecting(callback: () => void) {
    if (this.protocol === 'http-multipart') {
      return;
    }
    if (this.protocol === 'graphql-ws') {
      return;
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onReconnecting(callback);
    }
    assertUnreachable(this.protocol);
  }
  onReconnected(callback: () => void) {
    if (this.protocol === 'http-multipart') {
      return;
    }
    if (this.protocol === 'graphql-ws') {
      return;
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onReconnected(callback);
    }
    assertUnreachable(this.protocol);
  }
  onDisconnected(callback: () => void) {
    if (this.protocol === 'http-multipart') {
      this.multipartClient.on('disconnected', callback);
      return () => this.multipartClient.off('disconnected', callback);
    }
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.on('closed', callback);
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onDisconnected(callback);
    }
    assertUnreachable(this.protocol);
  }
  dispose() {
    if (this.protocol === 'http-multipart') {
      this.multipartClient.stopListeningCallback?.();
      return;
    }
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.dispose();
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.close();
    }
    assertUnreachable(this.protocol);
  }

  request(
    params: OperationOptions & {
      query: string;
      variables: Record<string, string> | undefined;
      operationName: string | undefined;
      httpMultipartParams?: HTTPMultipartParams;
      embeddedIFrameElement: HTMLIFrameElement;
      embedUrl: string;
      operationId: string;
    }
  ) {
    return {
      subscribe: async (
        subscribeParams: Observer<ExecutionResult<Record<string, unknown>>>
      ) => {
        if (this.protocol === 'http-multipart' && params.httpMultipartParams) {
          // we only use subscribeParams for websockets, for http multipart subs
          // we do all responding in executeOperation, since this is where we set
          // up the Observable
          await executeOperation({
            operation: params.query,
            operationName: params.operationName,
            variables: params.variables,
            headers: this.headers ?? {},
            includeCookies: params.httpMultipartParams?.includeCookies ?? false,
            endpointUrl: this.url,
            embeddedIFrameElement: params.embeddedIFrameElement,
            embedUrl: params.embedUrl,
            operationId: params.operationId,
            handleRequest: params.httpMultipartParams?.handleRequest,
            isMultipartSubscription: true,
            multipartSubscriptionClient: this.multipartClient,
          });
        }
        if (this.protocol === 'graphql-ws') {
          this.unsubscribeFunctions.push(
            this.graphWsClient.subscribe(params, {
              ...subscribeParams,
              next: (data) =>
                subscribeParams.next?.(data as Record<string, unknown>),
              error: (error) => subscribeParams.error?.(error as Error),
              complete: () => {},
            })
          );
        }
        if (this.protocol === 'subscriptions-transport-ws') {
          return this.transportSubscriptionClient
            .request(params)
            .subscribe(subscribeParams);
        } else {
          return undefined;
        }
      },
    };
  }

  unsubscribeAll() {
    if (this.protocol === 'http-multipart') {
      this.multipartClient.stopListeningCallback?.();
    }
    if (this.protocol === 'graphql-ws') {
      this.unsubscribeFunctions.forEach((off) => {
        off();
      });
      this.unsubscribeFunctions = [];
    }

    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.unsubscribeAll();
    }
  }
}

function setParentSocketError({
  error,
  embeddedIFrameElement,
  embedUrl,
}: {
  error: Error | undefined;
  embeddedIFrameElement: HTMLIFrameElement;
  embedUrl: string;
}) {
  sendPostMessageToEmbed({
    message: {
      name: EXPLORER_SET_SOCKET_ERROR,
      error,
    },
    embeddedIFrameElement,
    embedUrl,
  });
}

function setParentSocketStatus({
  status,
  embeddedIFrameElement,
  embedUrl,
}: {
  status: SocketStatus;
  embeddedIFrameElement: HTMLIFrameElement;
  embedUrl: string;
}) {
  sendPostMessageToEmbed({
    message: {
      name: EXPLORER_SET_SOCKET_STATUS,
      status,
    },
    embeddedIFrameElement,
    embedUrl,
  });
}

export function executeSubscription({
  operation,
  operationName,
  variables,
  headers,
  embeddedIFrameElement,
  operationId,
  embedUrl,
  embedUrlOrigin,
  subscriptionUrl,
  protocol,
  httpMultipartParams,
}: {
  operation: string;
  operationId: string;
  embeddedIFrameElement: HTMLIFrameElement;
  operationName: string | undefined;
  variables?: Record<string, string>;
  headers?: Record<string, string>;
  embedUrl: string;
  embedUrlOrigin: string;
  subscriptionUrl: string;
  protocol: GraphQLSubscriptionLibrary;
  httpMultipartParams: HTTPMultipartParams;
}): DisposableResource {
  const client = new SubscriptionClient(
    subscriptionUrl,
    headers ?? {},
    protocol
  );

  const checkForSubscriptionTermination = (event: MessageEvent) => {
    if (event.data.name === EXPLORER_SUBSCRIPTION_TERMINATION) {
      client.unsubscribeAll();
      disposeEventListener.dispose();
    }
  };

  const disposeEventListener = addMessageListener(
    embedUrlOrigin,
    checkForSubscriptionTermination
  );

  client.onError((e: Error) =>
    setParentSocketError({
      error: JSON.parse(JSON.stringify(e)),
      embeddedIFrameElement,
      embedUrl,
    })
  );
  client.onConnected(() => {
    setParentSocketError({
      error: undefined,
      embeddedIFrameElement,
      embedUrl,
    });
    setParentSocketStatus({
      status: 'connected',
      embeddedIFrameElement,
      embedUrl,
    });
  });
  client.onReconnected(() => {
    setParentSocketError({
      error: undefined,
      embeddedIFrameElement,
      embedUrl,
    });
    setParentSocketStatus({
      status: 'connected',
      embeddedIFrameElement,
      embedUrl,
    });
  });
  client.onConnecting(() =>
    setParentSocketStatus({
      status: 'connecting',
      embeddedIFrameElement,
      embedUrl,
    })
  );
  client.onReconnecting(() =>
    setParentSocketStatus({
      status: 'connecting',
      embeddedIFrameElement,
      embedUrl,
    })
  );
  client.onDisconnected(() =>
    setParentSocketStatus({
      status: 'disconnected',
      embeddedIFrameElement,
      embedUrl,
    })
  );

  client
    .request({
      query: operation,
      variables: variables ?? {},
      operationName,
      embeddedIFrameElement,
      embedUrl,
      httpMultipartParams,
      operationId,
    })
    .subscribe(
      // we only use these callbacks for websockets, for http multipart subs
      // we do all responding in executeOperation, since this is where we set
      // up the Observable
      {
        next(data) {
          sendPostMessageToEmbed({
            message: {
              name: EXPLORER_SUBSCRIPTION_RESPONSE,
              // Include the same operation ID in the response message's name
              // so the Explorer knows which operation it's associated with
              operationId,
              // we use different versions of graphql in Explorer & here,
              // Explorer expects an Object, which is what this is in reality
              response: { data: data as JSONObject },
            },
            embeddedIFrameElement,
            embedUrl,
          });
        },
        error: (error) => {
          sendPostMessageToEmbed({
            message: {
              name: EXPLORER_SUBSCRIPTION_RESPONSE,
              // Include the same operation ID in the response message's name
              // so the Explorer knows which operation it's associated with
              operationId,
              response: { error: JSON.parse(JSON.stringify(error)) },
            },
            embeddedIFrameElement,
            embedUrl,
          });
        },
      }
    );

  return disposeEventListener;
}
