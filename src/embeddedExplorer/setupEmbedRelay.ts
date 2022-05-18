import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_EXPLORER_URL,
  EXPLORER_LISTENING_FOR_HANDSHAKE,
  EXPLORER_LISTENING_FOR_SCHEMA,
  EXPLORER_QUERY_MUTATION_REQUEST,
  HANDSHAKE_RESPONSE,
} from '../helpers/constants';
import {
  executeOperation,
  handleAuthenticationPostMessage,
  HandleRequest,
  IncomingEmbedMessage,
  sendPostMessageToEmbed,
} from '../helpers/postMessageRelayHelpers';

export function setupEmbedRelay({
  endpointUrl,
  handleRequest,
  embeddedExplorerIFrameElement,
  updateSchemaInEmbed,
  schema,
  graphRef,
  autoInviteOptions,
}: {
  endpointUrl: string;
  handleRequest: HandleRequest;
  embeddedExplorerIFrameElement: HTMLIFrameElement;
  updateSchemaInEmbed: ({
    schema,
  }: {
    schema: string | IntrospectionQuery | undefined;
  }) => void;
  schema?: string | IntrospectionQuery | undefined;
  graphRef?: string | undefined;
  autoInviteOptions?: {
    accountId: string;
    inviteToken: string;
  };
}) {
  const embedUrl = EMBEDDABLE_EXPLORER_URL;
  // Callback definition
  const onPostMessageReceived = (event: IncomingEmbedMessage) => {
    handleAuthenticationPostMessage({
      event,
      embedUrl,
      embeddedIFrameElement: embeddedExplorerIFrameElement,
    });

    const { data } = event;
    // When embed connects, send a handshake message
    if (data.name === EXPLORER_LISTENING_FOR_HANDSHAKE) {
      sendPostMessageToEmbed({
        message: {
          name: HANDSHAKE_RESPONSE,
          graphRef,
          inviteToken: autoInviteOptions?.inviteToken,
          accountId: autoInviteOptions?.accountId,
        },
        embeddedIFrameElement: embeddedExplorerIFrameElement,
        embedUrl,
      });
    }

    // Embedded Explorer sends us a PM when it is ready for a schema
    if (
      'name' in data &&
      data.name === EXPLORER_LISTENING_FOR_SCHEMA &&
      !!schema
    ) {
      updateSchemaInEmbed({ schema });
    }

    // Check to see if the posted message indicates that the user is
    // executing a query or mutation or subscription in the Explorer
    const isQueryOrMutation =
      'name' in data && data.name === EXPLORER_QUERY_MUTATION_REQUEST;

    // If the user is executing a query or mutation or subscription...
    if (isQueryOrMutation && data.operation && data.operationId) {
      // Extract the operation details from the event.data object
      const { operation, operationId, operationName, variables, headers } =
        data;
      if (isQueryOrMutation) {
        executeOperation({
          endpointUrl,
          handleRequest,
          operation,
          operationName,
          variables,
          headers,
          embeddedIFrameElement: embeddedExplorerIFrameElement,
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
