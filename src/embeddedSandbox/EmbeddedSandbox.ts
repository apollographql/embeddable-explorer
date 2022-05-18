import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_SANDBOX_URL,
  EMBEDDABLE_SANDBOX_URL_STAGING,
  IFRAME_DOM_ID,
  SCHEMA_RESPONSE,
} from '../helpers/constants';
import { defaultHandleRequest } from '../helpers/defaultHandleRequest';
import {
  HandleRequest,
  sendPostMessageToEmbed,
} from '../helpers/postMessageRelayHelpers';
import { setupSandboxEmbedRelay } from './setupSandboxEmbedRelay';

export interface EmbeddableSandboxOptions {
  target: string | HTMLElement; // HTMLElement is to accomodate people who might prefer to pass in a ref
  initialEndpoint?: string;

  // optional. defaults to `return fetch(url, fetchOptions)`
  handleRequest?: HandleRequest;
  // defaults to false. If you pass `handleRequest` that will override this.
  includeCookies?: boolean;

  /**
   * Only for Apollo team testing
   */
  apolloStudioEnv?: 'staging' | 'prod';
}

export function getEmbeddedSandboxBaseUrl(
  apolloStudioEnv: 'staging' | 'prod' | undefined
) {
  return apolloStudioEnv === 'prod'
    ? EMBEDDABLE_SANDBOX_URL
    : EMBEDDABLE_SANDBOX_URL_STAGING;
}

let idCounter = 0;

export class EmbeddedSandbox {
  options: EmbeddableSandboxOptions;
  handleRequest: HandleRequest;
  embeddedSandboxIFrameElement: HTMLIFrameElement;
  uniqueEmbedInstanceId: number;
  private disposable: { dispose: () => void };
  constructor(options: EmbeddableSandboxOptions) {
    this.options = options;
    this.validateOptions();
    this.handleRequest =
      this.options.handleRequest ??
      defaultHandleRequest({ includeCookies: !!this.options.includeCookies });
    this.uniqueEmbedInstanceId = idCounter++;
    this.embeddedSandboxIFrameElement = this.injectEmbed();
    this.disposable = setupSandboxEmbedRelay({
      embeddedSandboxIFrameElement: this.embeddedSandboxIFrameElement,
      handleRequest: this.handleRequest,
      apolloStudioEnv: this.options.apolloStudioEnv || 'staging',
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
    let element;
    const { target } = this.options;

    if (typeof target === 'string') {
      element = document?.querySelector?.(target);
    } else {
      element = target;
    }
    const iframeElement = document.createElement('iframe');
    iframeElement.src = `${getEmbeddedSandboxBaseUrl(
      this.options.apolloStudioEnv
    )}${
      this.options.initialEndpoint
        ? `?endpoint=${this.options.initialEndpoint}`
        : ''
    }`;

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
      embedUrl: getEmbeddedSandboxBaseUrl(this.options.apolloStudioEnv),
    });
  }
}
