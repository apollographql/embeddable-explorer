import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_SANDBOX_URL,
  IFRAME_DOM_ID,
  SCHEMA_RESPONSE,
} from './helpers/constants';
import { defaultHandleRequest } from './helpers/defaultHandleRequest';
import {
  HandleRequest,
  sendPostMessageToEmbed,
} from './helpers/postMessageRelayHelpers';
import { setupSandboxEmbedRelay } from './setupSandboxEmbedRelay';
import packageJSON from '../package.json';
import type { JSONObject } from './helpers/types';

export interface EmbeddableSandboxOptions {
  target: string | HTMLElement; // HTMLElement is to accommodate people who might prefer to pass in a ref
  initialEndpoint?: string;

  initialState?: {
    document?: string;
    variables?: JSONObject;
    headers?: Record<string, string>;
  };

  // optional. defaults to `return fetch(url, fetchOptions)`
  handleRequest?: HandleRequest;
  // defaults to false. If you pass `handleRequest` that will override this.
  includeCookies?: boolean;
}

type InternalEmbeddableSandboxOptions = EmbeddableSandboxOptions & {
  __testLocal__?: boolean;
  initialRequestQueryPlan?: boolean;
};

let idCounter = 0;

export class EmbeddedSandbox {
  options: InternalEmbeddableSandboxOptions;
  handleRequest: HandleRequest;
  embeddedSandboxIFrameElement: HTMLIFrameElement;
  uniqueEmbedInstanceId: number;
  __testLocal__: boolean;
  private disposable: { dispose: () => void };
  constructor(options: EmbeddableSandboxOptions) {
    this.options = options as InternalEmbeddableSandboxOptions;
    this.__testLocal__ = !!this.options.__testLocal__;
    this.validateOptions();
    this.handleRequest =
      this.options.handleRequest ??
      defaultHandleRequest({ includeCookies: !!this.options.includeCookies });
    this.uniqueEmbedInstanceId = idCounter++;
    this.embeddedSandboxIFrameElement = this.injectEmbed();
    this.disposable = setupSandboxEmbedRelay({
      embeddedSandboxIFrameElement: this.embeddedSandboxIFrameElement,
      handleRequest: this.handleRequest,
      __testLocal__: !!this.__testLocal__,
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

    const {
      document: initialDocument,
      variables,
      headers,
    } = this.options.initialState || {};

    const queryParams = {
      endpoint: this.options.initialEndpoint,
      defaultDocument: initialDocument
        ? encodeURIComponent(initialDocument)
        : undefined,
      defaultVariables: variables
        ? encodeURIComponent(JSON.stringify(variables, null, 2))
        : undefined,
      defaultHeaders: headers
        ? encodeURIComponent(JSON.stringify(headers))
        : undefined,
      parentSupportsSubscriptions: true,
      version: packageJSON.version,
      runTelemetry: true,
      initialRequestQueryPlan: this.options.initialRequestQueryPlan ?? false,
    };

    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    if (typeof target === 'string') {
      element = document?.querySelector?.(target);
    } else {
      element = target;
    }
    const iframeElement = document.createElement('iframe');
    iframeElement.src = `${EMBEDDABLE_SANDBOX_URL(
      this.__testLocal__
    )}?${queryString}`;

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
            var link = document.createElement('link');
            link.rel = 'icon';
            link.href = `https://embeddable-sandbox.cdn.apollographql.com/_latest/public/assets/favicon${
              darkMode ? '-dark' : ''
            }.png`;
            document.head.appendChild(link);
            var touchLink = document.createElement('link');
            touchLink.rel = 'apple-touch-icon';
            touchLink.href = `https://embeddable-sandbox.cdn.apollographql.com/_latest/public/assets/favicon${
              darkMode ? '-dark' : ''
            }.png`;
            document.head.appendChild(link);
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
  }

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
      embeddedIFrameElement: this.embeddedSandboxIFrameElement,
      embedUrl: EMBEDDABLE_SANDBOX_URL(this.__testLocal__),
    });
  }
}
