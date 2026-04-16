import {
  EMBEDDABLE_SANDBOX_URL_ORIGIN,
  EXPLORER_LISTENING_FOR_HANDSHAKE,
  EXPLORER_QUERY_MUTATION_REQUEST,
  EXPLORER_SUBSCRIPTION_REQUEST,
  HANDSHAKE_RESPONSE,
  INTROSPECTION_QUERY_WITH_HEADERS,
} from './helpers/constants';
import {
  addMessageListener,
  DisposableResource,
  executeIntrospectionRequest,
  executeOperation,
  handleAuthenticationPostMessage,
  HandleRequest,
  IncomingEmbedMessage,
  ModifyHeaders,
  sendPostMessageToEmbed,
} from './helpers/postMessageRelayHelpers';
import { executeSubscription } from './helpers/subscriptionPostMessageRelayHelpers';

export function setupSandboxEmbedRelay({
  handleRequest,
  modifyHeaders,
  embeddedSandboxIFrameElement,
  __testLocal__,
}: {
  handleRequest: HandleRequest;
  modifyHeaders?: ModifyHeaders;
  embeddedSandboxIFrameElement: HTMLIFrameElement;
  __testLocal__: boolean;
}): DisposableResource {
  const embedUrlOrigin = EMBEDDABLE_SANDBOX_URL_ORIGIN(__testLocal__);
  // Callback definition
  const onPostMessageReceived = async (event: IncomingEmbedMessage) => {
    handleAuthenticationPostMessage({
      event,
      embedUrlOrigin,
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
            parentHref: window.location.href,
          },
          embeddedIFrameElement: embeddedSandboxIFrameElement,
          embedUrlOrigin,
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
            embedUrlOrigin,
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
        const { operation, variables, operationName, operationId, headers: originalHeaders } =
          data;

        if (isQueryOrMutation) {
          const { endpointUrl, includeCookies } = data;
          if (!endpointUrl) {
            throw new Error(
              'Something went wrong, we should not have gotten here. The sandbox endpoint url was not sent.'
            );
          }
          // If the user has provided a function to modify headers, call it
          const headers = modifyHeaders
            ? await modifyHeaders(endpointUrl, originalHeaders)
            : originalHeaders;
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
            embedUrlOrigin,
            isMultipartSubscription: false,
          });
        } else if (isSubscription) {
          const { httpMultipartParams } = data;
          // If the user has provided a function to modify headers, call it
          const headers = modifyHeaders
            ? await modifyHeaders(data.subscriptionUrl, originalHeaders)
            : originalHeaders;
          executeSubscription({
            operation,
            operationName,
            variables,
            headers,
            embeddedIFrameElement: embeddedSandboxIFrameElement,
            operationId,
            embedUrlOrigin,
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
  return addMessageListener(embedUrlOrigin, onPostMessageReceived);
}
