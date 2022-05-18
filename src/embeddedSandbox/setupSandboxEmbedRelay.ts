import {
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
import { getEmbeddedSandboxBaseUrl } from './EmbeddedSandbox';

export function setupSandboxEmbedRelay({
  handleRequest,
  embeddedSandboxIFrameElement,
  apolloStudioEnv,
}: {
  handleRequest: HandleRequest;
  embeddedSandboxIFrameElement: HTMLIFrameElement;
  apolloStudioEnv: 'staging' | 'prod';
}) {
  const embedUrl = getEmbeddedSandboxBaseUrl(apolloStudioEnv);
  // Callback definition
  const onPostMessageReceived = (event: IncomingEmbedMessage) => {
    handleAuthenticationPostMessage({
      event,
      embedUrl,
      embeddedIFrameElement: embeddedSandboxIFrameElement,
    });

    const { data } = event;

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
          apolloStudioEnv,
        });
      }
    }

    // Check to see if the posted message indicates that the user is
    // executing a query or mutation or subscription in the Explorer
    const isQueryOrMutation =
      'name' in data && data.name === EXPLORER_QUERY_MUTATION_REQUEST;

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
  };
  // Execute our callback whenever window.postMessage is called
  window.addEventListener('message', onPostMessageReceived);
  return {
    dispose: () => window.removeEventListener('message', onPostMessageReceived),
  };
}
