import { EMBEDDABLE_SANDBOX_URL, IFRAME_DOM_ID } from './helpers/constants';
import { defaultHandleRequest } from './helpers/defaultHandleRequest';
import type { HandleRequest } from './helpers/postMessageRelayHelpers';
import { setupSandboxEmbedRelay } from './setupSandboxEmbedRelay';
import packageJSON from '../package.json';
import type { JSONObject } from './helpers/types';
/**
 * Pass collectionId, operationId to embed the document, headers, variables associated
 * with this operation id if you have access to the operation via your collections.
 */
type InitialCollectionOperationId =
  | {
      collectionId: string;
      operationId: string;
    }
  | {
      collectionId?: never;
      operationId?: never;
    };

type InitialState = {
  /**
   * optional. Set headers for every operation a user triggers from this Sandbox.
   * Users can check and uncheck these headers, but not edit them.
   */
  sharedHeaders?: Record<string, string>;
  /**
   * optional. defaults to false
   */
  includeCookies?: boolean;
  /**
   * defaults to true. If false, sandbox will not poll your endpoint for your schema.
   * */
  pollForSchemaUpdates?: boolean;
} & (
  | InitialCollectionOperationId
  | {
      document?: string;
      variables?: JSONObject;
      headers?: Record<string, string>;
    }
);
export interface EmbeddableSandboxOptions {
  target: string | HTMLElement; // HTMLElement is to accommodate people who might prefer to pass in a ref
  initialEndpoint?: string;
  initialState?: InitialState;

  /**
   * optional. defaults to `return fetch(url, fetchOptions)`
   */
  handleRequest?: HandleRequest;

  /**
   * optional. If this is passed, its value will take precedence over your sandbox connection settings `includeCookies` value.
   * If you pass `handleRequest`, that will override this value and its behavior.
   *
   * @deprecated Use `initialState.includeCookies` instead
   */
  includeCookies?: boolean;

  /**
   * optional. defaults to `true`.
   * Set this to `false` if you want individual users to be able to choose whether
   * to include cookies in their request from their connection settings.
   */
  hideCookieToggle?: boolean;
  /**
   * optional. defaults to true.
   * If false, the endpoint box at the top of sandbox will be `initialEndpoint` permanently
   */
  endpointIsEditable?: boolean;
}

type InternalEmbeddableSandboxOptions = EmbeddableSandboxOptions & {
  __testLocal__?: boolean;
  initialRequestQueryPlan?: boolean;
  runtime?: string;
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
      defaultHandleRequest({
        legacyIncludeCookies: this.options.includeCookies,
      });
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

    const { includeCookies, sharedHeaders } = this.options.initialState || {};

    const queryParams = {
      runtime: this.options.runtime,
      endpoint: this.options.initialEndpoint,
      ...(this.options.initialState &&
      'collectionId' in this.options.initialState
        ? {
            defaultCollectionEntryId: this.options.initialState.operationId,
            defaultCollectionId: this.options.initialState.collectionId,
          }
        : {}),
      ...(this.options.initialState && 'document' in this.options.initialState
        ? {
            defaultDocument: this.options.initialState.document
              ? encodeURIComponent(this.options.initialState.document)
              : undefined,
            defaultVariables: this.options.initialState.variables
              ? encodeURIComponent(
                  JSON.stringify(this.options.initialState.variables, null, 2)
                )
              : undefined,
            defaultHeaders: this.options.initialState.headers
              ? encodeURIComponent(
                  JSON.stringify(this.options.initialState.headers)
                )
              : undefined,
          }
        : {}),
      sharedHeaders: sharedHeaders
        ? encodeURIComponent(JSON.stringify(sharedHeaders))
        : undefined,
      defaultIncludeCookies: includeCookies,
      hideCookieToggle: this.options.hideCookieToggle ?? true,
      parentSupportsSubscriptions: true,
      version: packageJSON.version,
      runTelemetry: true,
      initialRequestQueryPlan: this.options.initialRequestQueryPlan ?? false,
      shouldDefaultAutoupdateSchema:
        this.options.initialState?.pollForSchemaUpdates ?? true,
      endpointIsEditable: this.options.endpointIsEditable,
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
        'Passing `includeCookies` is deprecated. If you would like to set a default includeCookies value, please use `initialState.includeCookies` instead.'
      );
    }

    if (
      this.options.includeCookies !== undefined &&
      (this.options.hideCookieToggle !== undefined ||
        this.options.initialState?.includeCookies !== undefined)
    ) {
      throw new Error(
        'Passing `includeCookies` is deprecated and will override your sandbox connection settings configuration.'
      );
    }
  }
}
