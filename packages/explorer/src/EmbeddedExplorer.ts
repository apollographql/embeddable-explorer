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
    displayOptions: {
      docsPanelState?: 'open' | 'closed'; // default to 'open',
      showHeadersAndEnvVars?: boolean; // default to `false`
      theme?: 'dark' | 'light';
    };
  };
  persistExplorerState?: boolean; // defaults to 'false'

  // optional. defaults to `return fetch(url, fetchOptions)`
  handleRequest?: HandleRequest;
  // defaults to false. If you pass `handleRequest` that will override this.
  includeCookies?: boolean;
  // If this object has values for `inviteToken` and `accountId`,
  // any users who can see your embeddable Explorer are automatically
  // invited to the account your graph is under with the role specified by the `inviteToken`.
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

let idCounter = 0;

export class EmbeddedExplorer {
  options: EmbeddableExplorerOptions;
  handleRequest: HandleRequest;
  embeddedExplorerURL: string;
  embeddedExplorerIFrameElement: HTMLIFrameElement;
  uniqueEmbedInstanceId: number;
  private disposable: { dispose: () => void };
  constructor(options: EmbeddableExplorerOptions) {
    this.options = options;
    this.validateOptions();
    this.handleRequest =
      this.options.handleRequest ??
      defaultHandleRequest({ includeCookies: !!this.options.includeCookies });
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

    return iframeElement;
  }

  validateOptions() {
    if (!this.options.target) {
      throw new Error('"target" is required');
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
    const { document, variables, headers, displayOptions } =
      this.options.initialState || {};
    const { persistExplorerState } = this.options;
    const graphRef =
      'graphRef' in this.options ? this.options.graphRef : undefined;
    const queryParams = {
      graphRef,
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
      parentSupportsSubscriptions: false,
      version: packageJSON.version,
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
    sendPostMessageToEmbed({
      message: {
        name: SCHEMA_RESPONSE,
        schema,
      },
      embeddedIFrameElement: this.embeddedExplorerIFrameElement,
      embedUrl: EMBEDDABLE_EXPLORER_URL,
    });
  }
}
