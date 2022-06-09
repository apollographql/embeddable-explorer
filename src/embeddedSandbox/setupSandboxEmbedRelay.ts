import {
  EMBEDDABLE_SANDBOX_URL,
  EXPLORER_LISTENING_FOR_HANDSHAKE,
  EXPLORER_QUERY_MUTATION_REQUEST,
  HANDSHAKE_RESPONSE,
  INTROSPECTION_QUERY_WITH_HEADERS,
} from '../helpers/constants';
import {
  executeIntrospectionRequest,
  executeOperation,
  handleAuthenticationPostMessage,
  HandleRequest,
  IncomingEmbedMessage,
  sendPostMessageToEmbed,
} from '../helpers/postMessageRelayHelpers';

export function setupSandboxEmbedRelay({
  handleRequest,
  embeddedSandboxIFrameElement,
}: {
  handleRequest: HandleRequest;
  embeddedSandboxIFrameElement: HTMLIFrameElement;
}) {
  const embedUrl = EMBEDDABLE_SANDBOX_URL;
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

    if (data && 'name' in data) {
      // When embed connects, send a handshake message
      if (data.name === EXPLORER_LISTENING_FOR_HANDSHAKE) {
        sendPostMessageToEmbed({
          message: {
            name: HANDSHAKE_RESPONSE,
          },
          embeddedIFrameElement: embeddedSandboxIFrameElement,
          embedUrl,
        });
      }

      if (data.name === INTROSPECTION_QUERY_WITH_HEADERS) {
        const {
          introspectionRequestBody,
          introspectionRequestHeaders,
          sandboxEndpointUrl,
        } = data;
        if (sandboxEndpointUrl) {
          executeIntrospectionRequest({
            endpointUrl: sandboxEndpointUrl,
            introspectionRequestBody,
            headers: introspectionRequestHeaders,
            embeddedIFrameElement: embeddedSandboxIFrameElement,
          });
        }
      }

      // Check to see if the posted message indicates that the user is
      // executing a query or mutation or subscription in the Explorer
      const isQueryOrMutation = data.name === EXPLORER_QUERY_MUTATION_REQUEST;

      // If the user is executing a query or mutation or subscription...
      if (isQueryOrMutation && data.operation && data.operationId) {
        // Extract the operation details from the event.data object
        const {
          operation,
          operationId,
          operationName,
          variables,
          headers,
          sandboxEndpointUrl,
        } = data;
        if (isQueryOrMutation && sandboxEndpointUrl) {
          executeOperation({
            endpointUrl: sandboxEndpointUrl,
            handleRequest,
            operation,
            operationName,
            variables,
            headers,
            embeddedIFrameElement: embeddedSandboxIFrameElement,
            operationId,
            embedUrl,
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