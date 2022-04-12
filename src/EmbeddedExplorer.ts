import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_EXPLORER_URL,
  IFRAME_DOM_ID,
  SCHEMA_RESPONSE,
} from './constants';
import { HandleRequest, setupEmbedRelay } from './setupEmbedRelay';

export interface BaseEmbeddableExplorerOptions {
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
}

interface EmbeddableExplorerOptionsWithSchema
  extends BaseEmbeddableExplorerOptions {
  schema: string | IntrospectionQuery;
  graphRef?: never;
}

interface EmbeddableExplorerOptionsWithGraphRef
  extends BaseEmbeddableExplorerOptions {
  graphRef: string;
  schema?: never;
}

export type EmbeddableExplorerOptions =
  | EmbeddableExplorerOptionsWithSchema
  | EmbeddableExplorerOptionsWithGraphRef;

export class EmbeddedExplorer {
  options: EmbeddableExplorerOptions;
  handleRequest: HandleRequest;
  embeddedExplorerURL: string;
  embeddedExplorerIFrameElement: HTMLIFrameElement;
  private disposable: { dispose: () => void };
  constructor(options: EmbeddableExplorerOptions) {
    this.options = options;
    this.validateOptions();
    this.handleRequest = this.options.handleRequest ?? fetch;
    this.embeddedExplorerURL = this.getEmbeddedExplorerURL();
    this.embeddedExplorerIFrameElement = this.injectEmbed();
    this.disposable = setupEmbedRelay({
      embeddedExplorerIFrameElement: this.embeddedExplorerIFrameElement,
      endpointUrl: this.options.endpointUrl,
      handleRequest: this.handleRequest,
      updateSchemaInEmbed: this.updateSchemaInEmbed,
      schema: 'schema' in this.options ? this.options.schema : undefined,
    });
  }

  dispose() {
    // remove the dom element
    document.getElementById(IFRAME_DOM_ID)?.remove();
    // remove the listener
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
    const iframeElement = document.createElement('iframe');
    iframeElement.src = this.embeddedExplorerURL;

    iframeElement.id = IFRAME_DOM_ID;
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

    if ('schema' in this.options && 'graphRef' in this.options) {
      throw new Error(
        'Both `schema` and `graphRef` cannot be set. You can either send your schema as an IntrospectionQuery or string via the `schema` field, or specifiy a public graphRef.'
      );
    }

    if (!('schema' in this.options || 'graphRef' in this.options)) {
      throw new Error('You must set either `schema` or `graphRef`.');
    }
  }

  getEmbeddedExplorerURL = () => {
    const { document, variables, headers, displayOptions } =
      this.options.initialState || {};
    const { persistExplorerState } = this.options;
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
      shouldPersistState: !!persistExplorerState,
      sendRequestsFrom: 'parent',
      docsPanelState: displayOptions?.docsPanelState ?? 'open',
      showHeadersAndEnvVars: displayOptions?.showHeadersAndEnvVars !== false,
      theme: displayOptions?.theme ?? 'dark',
    };

    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${EMBEDDABLE_EXPLORER_URL}?${queryString}`;
  };

  updateSchemaInEmbed({
    schema,
  }: {
    schema?: string | IntrospectionQuery | undefined;
  }) {
    this.embeddedExplorerIFrameElement.contentWindow?.postMessage(
      {
        name: SCHEMA_RESPONSE,
        schema,
      },
      EMBEDDABLE_EXPLORER_URL
    );
  }
}
