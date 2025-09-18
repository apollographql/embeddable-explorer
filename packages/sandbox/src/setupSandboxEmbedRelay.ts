import {
  EMBEDDABLE_SANDBOX_URL,
  EXPLORER_LISTENING_FOR_HANDSHAKE,
  EXPLORER_QUERY_MUTATION_REQUEST,
  EXPLORER_SUBSCRIPTION_REQUEST,
  HANDSHAKE_RESPONSE,
  INTROSPECTION_QUERY_WITH_HEADERS,
} from './helpers/constants';
import {
  executeIntrospectionRequest,
  executeOperation,
  handleAuthenticationPostMessage,
  HandleRequest,
  IncomingEmbedMessage,
  sendPostMessageToEmbed,
} from './helpers/postMessageRelayHelpers';
import { executeSubscription } from './helpers/subscriptionPostMessageRelayHelpers';

export function setupSandboxEmbedRelay({
  handleRequest,
  embeddedSandboxIFrameElement,
  __testLocal__,
}: {
  handleRequest: HandleRequest;
  embeddedSandboxIFrameElement: HTMLIFrameElement;
  __testLocal__: boolean;
}) {
  const embedUrl = EMBEDDABLE_SANDBOX_URL(__testLocal__);
  // Callback definition
  const onPostMessageReceived = (event: IncomingEmbedMessage) => {
    handleAuthenticationPostMessage({
      event,
      embedUrl,
      embeddedIFrameElement: embeddedSandboxIFrameElement,
    });

    // Any pm can be listened for here, not just the ones we know the
    // structure of. Some have a data field that is not an object
    const data = typeof event.data === 'object' ? event.data : undefined;

    if (data && 'name' in data && event.origin === embedUrl) {
      // When embed connects, send a handshake message
      if (data.name === EXPLORER_LISTENING_FOR_HANDSHAKE) {
        sendPostMessageToEmbed({
          message: {
            name: HANDSHAKE_RESPONSE,
            parentHref: window.location.href,
          },
          embeddedIFrameElement: embeddedSandboxIFrameElement,
          embedUrl,
        });
      }

      if (data.name === INTROSPECTION_QUERY_WITH_HEADERS) {
        const {
          introspectionRequestBody,
          introspectionRequestHeaders,
          includeCookies,
          sandboxEndpointUrl,
          operationId,
        } = data;
        if (sandboxEndpointUrl) {
          executeIntrospectionRequest({
            endpointUrl: sandboxEndpointUrl,
            introspectionRequestBody,
            headers: introspectionRequestHeaders,
            includeCookies,
            embeddedIFrameElement: embeddedSandboxIFrameElement,
            embedUrl,
            handleRequest,
            operationId,
          });
        }
      }

      // Check to see if the posted message indicates that the user is
      // executing a query or mutation or subscription in the Explorer
      const isQueryOrMutation = data.name === EXPLORER_QUERY_MUTATION_REQUEST;
      const isSubscription = data.name === EXPLORER_SUBSCRIPTION_REQUEST;

      // If the user is executing a query or mutation or subscription...
      if (
        (isQueryOrMutation || isSubscription) &&
        data.operation &&
        data.operationId
      ) {
        // Extract the operation details from the event.data object
        const { operation, variables, operationName, operationId, headers } =
          data;

        if (isQueryOrMutation) {
          const { endpointUrl, includeCookies } = data;
          if (!endpointUrl) {
            throw new Error(
              'Something went wrong, we should not have gotten here. The sandbox endpoint url was not sent.'
            );
          }
          executeOperation({
            endpointUrl,
            handleRequest,
            headers,
            includeCookies,
            embeddedIFrameElement: embeddedSandboxIFrameElement,
            operationId,
            operation,
            variables,
            fileVariables:
              'fileVariables' in data ? data.fileVariables : undefined,
            operationName,
            embedUrl,
            isMultipartSubscription: false,
          });
        } else if (isSubscription) {
          const { httpMultipartParams } = data;
          executeSubscription({
            operation,
            operationName,
            variables,
            headers,
            embeddedIFrameElement: embeddedSandboxIFrameElement,
            operationId,
            embedUrl,
            subscriptionUrl: data.subscriptionUrl,
            protocol: data.protocol,
            httpMultipartParams: {
              ...httpMultipartParams,
              handleRequest,
            },
          });
        }
      }
    }
  };
  // Execute our callback whenever window.postMessage is called
  window.addEventListener('message', onPostMessageReceived);
  return {
    dispose: () => window.removeEventListener('message', onPostMessageReceived),
  };
}
