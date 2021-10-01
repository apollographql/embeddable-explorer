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
    searchQuery?: string;
    displayOptions: {
      docsPanelState?: 'open' | 'closed'; // default to 'open',
      showHeadersAndEnvVars?: boolean; // default to `false`
      theme?: 'dark' | 'light';
    };
  };
  persistExplorerState?: boolean; // defaults to 'false'

  endpointUrl: string;
  subscriptionEndpointUrl?: string | undefined;

  // optional. defaults to `return fetch(url, fetchOptions)`
  handleRequest?: HandleRequest;

  // optional. default to undefined. don't include in public docs yet
  // throws error if graphRef is also provided
  schema?: string | IntrospectionQuery | undefined;

  // optional. defaults to "parent". don't include in public docs yet
  // throws error if value is 'embed' and `handleRequest` is provided
  sendRequestsFrom?: 'parent' | 'embed';
};

const defaultRequestHandler = (
  endpointUrl: string,
  // force headers to just be a Record<string, string> instead of the RequestInit.headers type, 
  // which is more flexible.
  options: Omit<RequestInit, 'headers'> & { headers: Record<string, string> }
) => {
  return fetch(endpointUrl, options);
};

declare global {
  interface Window {
    EmbeddedExplorer: any;
  }
}

window.EmbeddedExplorer = class EmbeddedExplorer {
  options: EmbeddableExplorerOptions;
  handleRequest: HandleRequest;
  constructor(options: EmbeddableExplorerOptions) {
    this.options = options;
    this.validateOptions(options);
    this.handleRequest = this.options.handleRequest ?? defaultRequestHandler;
    const embeddedExplorerIFrameElement = this.injectEmbed();
    setupEmbedRelay({
      embeddedExplorerIFrameElement,
      endpointUrl: this.options.endpointUrl,
      // subscriptionUrl: this.options.subscriptionEndpointUrl,
      handleRequest: this.handleRequest,
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
    iframeElement.src =
      EMBEDDABLE_EXPLORER_URL +
      getQueryParamsFromOptions(this.options);

      iframeElement.id = 'apollo-embedded-explorer';
      iframeElement.setAttribute('style', "height: 100%; width: 100%")

    element?.appendChild(iframeElement);

    return iframeElement;
  }

  validateOptions(options: EmbeddableExplorerOptions) {
    if(!options.handleRequest && !options.endpointUrl) {
      throw new Error('`endpointUrl` is required unless you write a custom `handleRequest`')
    }

    if(options.handleRequest && options.sendRequestsFrom === 'embed') {
      throw new Error('You cannot pass a custom `handleRequest` if you have `sendRequestsFrom` set to \"embed\"')
    }

    if(options.schema && options.graphRef) {
      throw new Error('Both `schema` and `graphRef` cannot be set. You can either send your schema as an IntrospectionQuery or string via the `schema` field, or specifiy a public graphRef.')
    }
  }
};

const getQueryParamsFromOptions = ({
  graphRef,
  persistExplorerState,
  sendRequestsFrom,
  initialState,
}: EmbeddableExplorerOptions) => {
  const { document, variables, headers, displayOptions } = initialState || {};
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
  let queryString = '';
  Object.entries(queryParams)
    .filter(([_, value]) => value)
    .forEach(([key, value]) => {
      queryString += `&${key}=${value}`;
    });
  queryString = "?" + queryString.slice(1)
  return queryString;
};
