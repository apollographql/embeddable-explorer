import type { IntrospectionQuery } from 'graphql';
import { HandleRequest, executeOperation } from './setupEmbedRelay';
import {
  EMBEDDABLE_EXPLORER_URL,
  EXPLORER_LISTENING_FOR_SCHEMA,
  EXPLORER_QUERY_MUTATION_REQUEST,
  SCHEMA_RESPONSE,
} from './constants';

type EmbeddableExplorerOptions = {
  target: string | HTMLElement; // HTMLElement is to accomodate people who might prefer to pass in a ref
  graphRef: string;

  initialState?: {
    document?: string;
    variables?: Record<string, any>;
    headers?: Record<string, string>;
    displayOptions: {
      docsPanelState?: 'open' | 'closed'; // default to 'open',
      showHeadersAndEnvVars?: boolean; // default to `false`
      theme?: 'dark' | 'light';
    };
  };
  persistExplorerState?: boolean; // defaults to 'false'

  endpointUrl: string;

  // optional. defaults to `return fetch(url, fetchOptions)`
  handleRequest?: HandleRequest;
};

type InternalEmbeddableExplorerOptions = {
  target: string | HTMLElement; // HTMLElement is to accomodate people who might prefer to pass in a ref

  initialState?: {
    document?: string;
    variables?: Record<string, any>;
    headers?: Record<string, string>;
    displayOptions: {
      docsPanelState?: 'open' | 'closed'; // default to 'open',
      showHeadersAndEnvVars?: boolean; // default to `false`
      theme?: 'dark' | 'light';
    };
  };
  persistExplorerState?: boolean; // defaults to 'false'

  endpointUrl: string;

  // optional. defaults to `return fetch(url, fetchOptions)`
  handleRequest?: HandleRequest;

  // optional. defaults to "parent". don't include in public docs yet
  // throws error if value is 'embed' and `handleRequest` is provided
  sendRequestsFrom?: 'parent' | 'embed';
} & (
  | { graphRef: string; schema: never }
  | { schema: string | IntrospectionQuery; graphRef: never }
);

let wtf: Function | undefined;

class EmbeddedExplorer {
  options: InternalEmbeddableExplorerOptions;
  handleRequest: HandleRequest;
  embeddedExplorerURL: string;
  embeddedExplorerIFrameElement: HTMLIFrameElement
  id: number;

  constructor(options: EmbeddableExplorerOptions) {
    this.options = options as InternalEmbeddableExplorerOptions;
    this.validateOptions();
    this.id = new Date().getTime();
    this.handleRequest = this.options.handleRequest ?? fetch;
    this.embeddedExplorerURL = this.getEmbeddedExplorerURL();
    this.embeddedExplorerIFrameElement = this.injectEmbed();
    
    this.setupEmbedRelay();
  }

  injectEmbed() {
    let element;
    const { target } = this.options;

    if (typeof target === 'string') {
      element = document?.querySelector?.(target);
    } else {
      element = target;
    }
    const iframeElement = document.createElement('iframe');
    iframeElement.src = this.embeddedExplorerURL;

    iframeElement.id = 'apollo-embedded-explorer';
    iframeElement.setAttribute('style', 'height: 100%; width: 100%');

    element?.appendChild(iframeElement);

    return iframeElement;
  }

  setupEmbedRelay = () => {
    // Callback definition
    
    // Execute our callback whenever window.postMessage is called
    if (wtf) {
      // @ts-ignore
      window.removeEventListener('message', wtf);
    }
    window.addEventListener('message', this.onPostMessageReceived);
    wtf = this.onPostMessageReceived;
  }

  onPostMessageReceived = (event: MessageEvent) => {
    console.log('message received: ', event, this);
    const data: {
      name: string;
      operationName?: string;
      operation: string;
      operationId: string;
      variables?: Record<string, string>;
      headers?: Record<string, string>;
    } = event.data;  
    const schema = 'schema' in this.options ? this.options.schema : undefined;
    // Embedded Explorer sends us a PM when it is ready for a schema
    if (
      'name' in data &&
      data.name === EXPLORER_LISTENING_FOR_SCHEMA &&
      !!schema
    ) {
      this.embeddedExplorerIFrameElement.contentWindow?.postMessage(
        {
          name: SCHEMA_RESPONSE,
          schema,
        },
        EMBEDDABLE_EXPLORER_URL
      );
    }

    // Check to see if the posted message indicates that the user is
    // executing a query or mutation or subscription in the Explorer
    const isQueryOrMutation =
      'name' in data && data.name === EXPLORER_QUERY_MUTATION_REQUEST;

    // If the user is executing a query or mutation or subscription...
    if (isQueryOrMutation && data.operation && data.operationId) {
      // Extract the operation details from the event.data object
      const { operation, operationId, operationName, variables, headers } =
        data;
      if (isQueryOrMutation) {
        executeOperation({
          endpointUrl: this.options.endpointUrl,
          handleRequest: this.handleRequest,
          operation,
          operationName,
          variables,
          headers,
          embeddedExplorerIFrameElement: this.embeddedExplorerIFrameElement,
          operationId,
        });
      }
    }
  };

  validateOptions() {
    if (!this.options.target) {
      throw new Error('"target" is required');
    }

    if (!this.options.handleRequest && !this.options.endpointUrl) {
      throw new Error(
        '`endpointUrl` is required unless you write a custom `handleRequest`'
      );
    }

    if (
      this.options.handleRequest &&
      this.options.sendRequestsFrom === 'embed'
    ) {
      throw new Error(
        'You cannot pass a custom `handleRequest` if you have `sendRequestsFrom` set to "embed"'
      );
    }

    if ('schema' in this.options && 'graphRef' in this.options) {
      throw new Error(
        'Both `schema` and `graphRef` cannot be set. You can either send your schema as an IntrospectionQuery or string via the `schema` field, or specifiy a public graphRef.'
      );
    }
  }

  getEmbeddedExplorerURL = () => {
    const { document, variables, headers, displayOptions } =
      this.options.initialState || {};
    const { persistExplorerState, sendRequestsFrom } = this.options;
    const graphRef =
      'graphRef' in this.options ? this.options.graphRef : undefined;
    const queryParams = {
      graphRef,
      document: document ? encodeURIComponent(document) : undefined,
      variables: variables
        ? encodeURIComponent(JSON.stringify(variables))
        : undefined,
      headers: headers
        ? encodeURIComponent(JSON.stringify(headers))
        : undefined,
      shouldPersistState: persistExplorerState ? true : false,
      sendRequestsFrom: sendRequestsFrom ?? 'parent',
      docsPanelState: displayOptions?.docsPanelState ?? 'open',
      showHeadersAndEnvVars:
        displayOptions?.showHeadersAndEnvVars === false ? false : true,
      theme: displayOptions?.theme ?? 'dark',
    };

    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${EMBEDDABLE_EXPLORER_URL}?${queryString}`;
  };
}

export default EmbeddedExplorer;
