import type { IntrospectionQuery } from 'graphql';
import { EMBEDDABLE_EXPLORER_URL } from './constants';
import { HandleRequest, setupEmbedRelay } from './setupEmbedRelay';

type EmbeddableExplorerOptions = {
  target: string | HTMLElement; // HTMLElement is to accomodate people who might prefer to pass in a ref
  graphRef: string; // e.g. 'graphId@graphVariant'

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

  /** options not included in the public api */

  // optional. default to undefined. don't include in public docs yet
  // throws error if graphRef is also provided
  schema?: string | IntrospectionQuery | undefined;

  // optional. defaults to "parent". don't include in public docs yet
  // throws error if value is 'embed' and `handleRequest` is provided
  sendRequestsFrom?: 'parent' | 'embed';
};

declare global {
  interface Window {
    EmbeddedExplorer: any;
  }
}

window.EmbeddedExplorer = class EmbeddedExplorer {
  options: EmbeddableExplorerOptions;
  handleRequest: HandleRequest;
  embeddedExplorerURL: string;
  constructor(
    options: Omit<EmbeddableExplorerOptions, 'schema' | 'sendRequestsFrom'> &
      { sendRequestsFrom: 'parent' }
  ) {
    this.options = options;
    this.validateOptions();
    this.handleRequest = this.options.handleRequest ?? fetch;
    this.embeddedExplorerURL = this.getEmbeddedExplorerURL()
    const embeddedExplorerIFrameElement = this.injectEmbed();
    setupEmbedRelay({
      embeddedExplorerIFrameElement,
      endpointUrl: this.options.endpointUrl,
      handleRequest: this.handleRequest,
      schema: this.options.schema,
    });
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
    iframeElement.setAttribute('style', "height: 100%; width: 100%")

    element?.appendChild(iframeElement);

    return iframeElement;
  }

  validateOptions() {
    if(!this.options.handleRequest && !this.options.endpointUrl) {
      throw new Error('`endpointUrl` is required unless you write a custom `handleRequest`')
    }

    if(this.options.handleRequest && this.options.sendRequestsFrom === 'embed') {
      throw new Error('You cannot pass a custom `handleRequest` if you have `sendRequestsFrom` set to \"embed\"')
    }

    if(this.options.schema && this.options.graphRef) {
      throw new Error('Both `schema` and `graphRef` cannot be set. You can either send your schema as an IntrospectionQuery or string via the `schema` field, or specifiy a public graphRef.')
    }
  }

  getEmbeddedExplorerURL = () => {
    const { document, variables, headers, displayOptions } = this.options.initialState || {};
    const { graphRef, persistExplorerState, sendRequestsFrom } = this.options;
    const queryParams = {
      graphRef,
      document: document ? encodeURIComponent(document) : undefined,
      variables: variables
        ? encodeURIComponent(JSON.stringify(variables))
        : undefined,
      headers: headers ? encodeURIComponent(JSON.stringify(headers)) : undefined,
      persistExplorerState,
      sendRequestsFrom: sendRequestsFrom  ?? 'parent',
      docsPanelState: displayOptions?.docsPanelState ?? 'open',
      showHeadersAndEnvVars: displayOptions?.showHeadersAndEnvVars,
      theme: displayOptions?.theme ?? 'dark',
    };
    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${EMBEDDABLE_EXPLORER_URL}?${queryString}`;
  };
  
};