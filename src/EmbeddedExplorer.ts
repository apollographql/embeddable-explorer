import { IntrospectionQuery } from 'graphql';
import { EMBEDDABLE_EXPLORER_URL } from './constants';
import { HandleRequest, setupEmbedRelay } from './setupEmbedRelay';

export type EmbeddableExplorerOptions = {
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

export class EmbeddedExplorer {
  options: InternalEmbeddableExplorerOptions;
  handleRequest: HandleRequest;
  embeddedExplorerURL: string;
  private disposable: { dispose: () => void };
  constructor(options: EmbeddableExplorerOptions) {
    this.options = options as InternalEmbeddableExplorerOptions;
    this.validateOptions();
    this.handleRequest = this.options.handleRequest ?? fetch;
    this.embeddedExplorerURL = this.getEmbeddedExplorerURL();
    const embeddedExplorerIFrameElement = this.injectEmbed();
    this.disposable = setupEmbedRelay({
      embeddedExplorerIFrameElement,
      endpointUrl: this.options.endpointUrl,
      handleRequest: this.handleRequest,
      schema: 'schema' in this.options ? this.options.schema : undefined,
    });
  }

  dispose() {
    this.disposable.dispose();
  }

  injectEmbed() {
    let element;
    const { target } = this.options;

    if (typeof target === 'string') {
      element = document?.querySelector?.(target);
    } else {
      element = target;
    }
    console.log('injecting embed', target, element, this.embeddedExplorerURL);
    const iframeElement = document.createElement('iframe');
    iframeElement.src = this.embeddedExplorerURL;

    iframeElement.id = 'apollo-embedded-explorer';
    iframeElement.setAttribute('style', 'height: 100%; width: 100%');

    element?.appendChild(iframeElement);

    return iframeElement;
  }

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
