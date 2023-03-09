import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_EXPLORER_URL,
  IFRAME_DOM_ID,
  SCHEMA_RESPONSE,
} from './helpers/constants';
import { defaultHandleRequest } from './helpers/defaultHandleRequest';
import {
  HandleRequest,
  sendPostMessageToEmbed,
} from './helpers/postMessageRelayHelpers';
import { setupEmbedRelay } from './setupEmbedRelay';
import packageJSON from '../package.json';
import type { JSONObject } from './helpers/types';

export interface BaseEmbeddableExplorerOptions {
  target: string | HTMLElement; // HTMLElement is to accomodate people who might prefer to pass in a ref

  initialState?: {
    document?: string;
    variables?: JSONObject;
    headers?: Record<string, string>;
    /**
     * If you pass a collectionId & operationId, we ignore document, variables, headers
     * above, and embed the document, headers, variables associated with this operation id
     * if you have access to the operation via your collections.
     */
    collectionId?: string;
    operationId?: string;
    displayOptions: {
      docsPanelState?: 'open' | 'closed'; // default to 'open',
      showHeadersAndEnvVars?: boolean; // default to `false`
      theme?: 'dark' | 'light';
    };
  };
  /**
   * defaults to 'false'
   */
  persistExplorerState?: boolean;

  /**
   * optional. defaults to `return fetch(url, fetchOptions)`
   */
  handleRequest?: HandleRequest;
  /**
   * If this is passed, its value will take precedence over your variant's default `includeCookies` value.
   * If you pass `handleRequest`, that will override this value and its behavior.
   *
   * @deprecated Use the connection setting on your variant in Studio to choose whether or not to include cookies
   */
  includeCookies?: boolean;

  /**
   * If this object has values for `inviteToken` and `accountId`,
   * any users who can see your embeddable Explorer are automatically
   * invited to the account your graph is under with the role specified by the `inviteToken`.
   */
  autoInviteOptions?: {
    accountId: string;
    inviteToken: string;
  };
}

interface EmbeddableExplorerOptionsWithSchema
  extends BaseEmbeddableExplorerOptions {
  schema: string | IntrospectionQuery;
  endpointUrl: string;
  graphRef?: never;
}

interface EmbeddableExplorerOptionsWithGraphRef
  extends BaseEmbeddableExplorerOptions {
  graphRef: string;
  schema?: never;
  endpointUrl?: never;
}

export type EmbeddableExplorerOptions =
  | EmbeddableExplorerOptionsWithSchema
  | EmbeddableExplorerOptionsWithGraphRef;

type InternalEmbeddableExplorerOptions = EmbeddableExplorerOptions & {
  __testLocal__?: boolean;
  runtime?: string;
};

let idCounter = 0;

export class EmbeddedExplorer {
  options: InternalEmbeddableExplorerOptions;
  handleRequest: HandleRequest;
  embeddedExplorerURL: string;
  embeddedExplorerIFrameElement: HTMLIFrameElement;
  uniqueEmbedInstanceId: number;
  __testLocal__: boolean;
  private disposable: { dispose: () => void };
  constructor(options: EmbeddableExplorerOptions) {
    this.options = options as InternalEmbeddableExplorerOptions;
    this.__testLocal__ = !!this.options.__testLocal__;
    this.validateOptions();
    this.handleRequest =
      this.options.handleRequest ??
      defaultHandleRequest({
        legacyIncludeCookies: this.options.includeCookies,
      });
    this.uniqueEmbedInstanceId = idCounter++;
    this.embeddedExplorerURL = this.getEmbeddedExplorerURL();
    this.embeddedExplorerIFrameElement = this.injectEmbed();
    this.disposable = setupEmbedRelay({
      embeddedExplorerIFrameElement: this.embeddedExplorerIFrameElement,
      endpointUrl: this.options.endpointUrl,
      handleRequest: this.handleRequest,
      updateSchemaInEmbed: this.updateSchemaInEmbed.bind(this),
      schema: 'schema' in this.options ? this.options.schema : undefined,
      graphRef: 'graphRef' in this.options ? this.options.graphRef : undefined,
      autoInviteOptions: this.options.autoInviteOptions,
      __testLocal__: this.__testLocal__,
    });
  }

  dispose() {
    // remove the dom element
    document
      .getElementById(IFRAME_DOM_ID(this.uniqueEmbedInstanceId))
      ?.remove();
    // remove the listener
    this.disposable.dispose();
  }

  injectEmbed() {
    let element: HTMLElement | null;
    const { target } = this.options;

    if (typeof target === 'string') {
      element = document?.querySelector?.(target);
    } else {
      element = target;
    }
    const iframeElement = document.createElement('iframe');
    iframeElement.src = this.embeddedExplorerURL;

    iframeElement.id = IFRAME_DOM_ID(this.uniqueEmbedInstanceId);
    iframeElement.setAttribute(
      'style',
      'height: 100%; width: 100%; border: none;'
    );

    element?.appendChild(iframeElement);

    // inject the Apollo favicon if there is not one on this page
    fetch(`${window.location.origin}/favicon.ico`)
      .then((response) => {
        if (response.status === 404) {
          var existingLink = document.querySelector('link[rel*="icon"]');
          if (!existingLink) {
            var darkMode = window.matchMedia(
              '(prefers-color-scheme: dark)'
            ).matches;
            ['icon', 'apple-touch-icon'].forEach((id) => {
              var link = document.createElement('link');
              link.rel = id;
              link.href = `https://embeddable-explorer.cdn.apollographql.com/_latest/public/assets/favicon${
                darkMode ? '-dark' : ''
              }.png`;
              document.head.appendChild(link);
            });
          }
        }
      })
      .catch(() => {
        // do nothing with the error
      });

    return iframeElement;
  }

  validateOptions() {
    if (!this.options.target) {
      throw new Error('"target" is required');
    }

    if (this.options.includeCookies !== undefined) {
      console.warn(
        'Passing `includeCookies` is deprecated. Remove `includeCookies` from your config, and use the setting for your variant on Studio to set whether or not to include cookies.'
      );
    }

    if ('endpointUrl' in this.options && 'graphRef' in this.options) {
      // we can't throw here for backwards compat reasons. Folks on the cdn _latest bundle
      // will still be passing this
      console.warn(
        'You may only specify an endpointUrl if you are manually passing a `schema`. If you pass a `graphRef`, you must configure your endpoint on your Studio graph.'
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
    const {
      document,
      variables,
      headers,
      displayOptions,
      operationId,
      collectionId,
    } = this.options.initialState || {};
    const { persistExplorerState } = this.options;
    const graphRef =
      'graphRef' in this.options ? this.options.graphRef : undefined;
    const queryParams = {
      runtime: this.options.runtime,
      graphRef,
      defaultCollectionEntryId: operationId,
      defaultCollectionId: collectionId,
      defaultDocument: document ? encodeURIComponent(document) : undefined,
      defaultVariables: variables
        ? encodeURIComponent(JSON.stringify(variables, null, 2))
        : undefined,
      defaultHeaders: headers
        ? encodeURIComponent(JSON.stringify(headers))
        : undefined,
      shouldPersistState: !!persistExplorerState,
      docsPanelState: displayOptions?.docsPanelState ?? 'open',
      showHeadersAndEnvVars: displayOptions?.showHeadersAndEnvVars !== false,
      theme: displayOptions?.theme ?? 'dark',
      shouldShowGlobalHeader: true,
      parentSupportsSubscriptions: !!graphRef,
      version: packageJSON.version,
      runTelemetry: true,
    };

    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${EMBEDDABLE_EXPLORER_URL(this.__testLocal__)}?${queryString}`;
  };

  updateSchemaInEmbed({
    schema,
  }: {
    schema?: string | IntrospectionQuery | undefined;
  }) {
    sendPostMessageToEmbed({
      message: {
        name: SCHEMA_RESPONSE,
        schema,
      },
      embeddedIFrameElement: this.embeddedExplorerIFrameElement,
      embedUrl: EMBEDDABLE_EXPLORER_URL(this.__testLocal__),
    });
  }
}
