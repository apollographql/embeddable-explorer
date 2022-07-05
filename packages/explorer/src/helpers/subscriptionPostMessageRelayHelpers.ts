import type { ExecutionResult } from 'graphql';
import { Client, createClient as createGraphQLWSClient } from 'graphql-ws';
import {
  Observer,
  OperationOptions,
  SubscriptionClient as TransportSubscriptionClient,
} from 'subscriptions-transport-ws';
import type { JSONObject } from './types';
import {
  EXPLORER_SET_SOCKET_STATUS,
  EXPLORER_SET_SOCKET_ERROR,
  EXPLORER_SUBSCRIPTION_RESPONSE,
  EXPLORER_SUBSCRIPTION_TERMINATION,
} from './constants';
import {
  sendPostMessageToEmbed,
  SocketStatus,
} from './postMessageRelayHelpers';

export type GraphQLSubscriptionLibrary =
  | 'subscriptions-transport-ws'
  | 'graphql-ws';

// @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
export function assertUnreachable(x: never): never {
  throw new Error(`Didn't expect to get here ${x}`);
}

class SubscriptionClient {
  protocol: GraphQLSubscriptionLibrary;
  unsubscribeFunctions: Array<() => void> = [];
  url: string;
  headers: Record<string, string> | undefined;
  // Private variables
  private _graphWsClient: Client | undefined;
  private _transportSubscriptionClient: undefined | TransportSubscriptionClient;

  constructor(
    url: string,
    headers: Record<string, string> | undefined,
    protocol: GraphQLSubscriptionLibrary
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

  onConnected(callback: () => void) {
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.on('connected', callback);
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onConnected(callback);
    }
    assertUnreachable(this.protocol);
  }
  onConnecting(callback: () => void) {
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.on('connecting', callback);
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onConnecting(callback);
    }
    assertUnreachable(this.protocol);
  }
  onError(callback: (e: Error) => void) {
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
    if (this.protocol === 'graphql-ws') {
      return;
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onReconnecting(callback);
    }
    assertUnreachable(this.protocol);
  }
  onReconnected(callback: () => void) {
    if (this.protocol === 'graphql-ws') {
      return;
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onReconnected(callback);
    }
    assertUnreachable(this.protocol);
  }
  onDisconnected(callback: () => void) {
    if (this.protocol === 'graphql-ws') {
      return this.graphWsClient.on('closed', callback);
    }
    if (this.protocol === 'subscriptions-transport-ws') {
      return this.transportSubscriptionClient.onDisconnected(callback);
    }
    assertUnreachable(this.protocol);
  }

  request(
    params: OperationOptions & {
      query: string;
      variables: JSONObject;
      operationName: string | undefined;
    }
  ) {
    return {
      subscribe: (subscribeParams: Observer<ExecutionResult<JSONObject>>) => {
        if (this.protocol === 'graphql-ws') {
          this.unsubscribeFunctions.push(
            this.graphWsClient.subscribe(params, {
              ...subscribeParams,
              next: (data) =>
                subscribeParams.next?.(data as ExecutionResult<JSONObject>),
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
  subscriptionUrl,
  protocol,
}: {
  operation: string;
  operationId: string;
  embeddedIFrameElement: HTMLIFrameElement;
  operationName: string | undefined;
  variables?: JSONObject;
  headers?: Record<string, string>;
  embedUrl: string;
  subscriptionUrl: string;
  protocol: GraphQLSubscriptionLibrary;
}) {
  const client = new SubscriptionClient(
    subscriptionUrl,
    headers ?? {},
    protocol
  );

  const checkForSubscriptionTermination = (event: MessageEvent) => {
    if (event.data.name === EXPLORER_SUBSCRIPTION_TERMINATION) {
      client.unsubscribeAll();
      window.removeEventListener('message', checkForSubscriptionTermination);
    }
  };

  window.addEventListener('message', checkForSubscriptionTermination);

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
    })
    .subscribe({
      next(data) {
        sendPostMessageToEmbed({
          message: {
            // Include the same operation ID in the response message's name
            // so the Explorer knows which operation it's associated with
            name: EXPLORER_SUBSCRIPTION_RESPONSE,
            operationId,
            response: { data },
          },
          embeddedIFrameElement,
          embedUrl,
        });
      },
      error: (error) => {
        sendPostMessageToEmbed({
          message: {
            // Include the same operation ID in the response message's name
            // so the Explorer knows which operation it's associated with
            name: EXPLORER_SUBSCRIPTION_RESPONSE,
            operationId,
            response: { error: JSON.parse(JSON.stringify(error)) },
          },
          embeddedIFrameElement,
          embedUrl,
        });
      },
    });
}
