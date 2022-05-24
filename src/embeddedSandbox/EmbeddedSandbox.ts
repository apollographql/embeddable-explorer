import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_SANDBOX_URL,
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
    iframeElement.src = `${EMBEDDABLE_SANDBOX_URL}${
      this.options.initialEndpoint
        ? `?endpoint=${this.options.initialEndpoint}`
        : ''
    }`;

    iframeElement.id = IFRAME_DOM_ID(this.uniqueEmbedInstanceId);
    iframeElement.setAttribute(
      'style',
      'height: 100%; width: 100%; border: none;'
    );

    // if there is no className applied to the element, add height & width via the `style` attribute.
    // the `style` attribute overrides any className, so we want to default to the users className always
    if (element && !element.className) {
      Object.assign(element, {
        style: element.style ?? {},
      });
      Object.assign(element.style, {
        height: element.style.height.length ? element.style.height : '100%',
      });
      Object.assign(element.style, {
        width: element.style.width.length ? element.style.width : '100%',
      });
      console.log('element', element.style);
    }

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
      embedUrl: EMBEDDABLE_SANDBOX_URL,
    });
  }
}
