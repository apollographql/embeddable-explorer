import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_EXPLORER_URL,
  EXPLORER_LISTENING_FOR_HANDSHAKE,
  EXPLORER_LISTENING_FOR_SCHEMA,
  EXPLORER_QUERY_MUTATION_REQUEST,
  EXPLORER_QUERY_MUTATION_RESPONSE,
  HANDSHAKE_RESPONSE,
  OutgoingEmbedMessage,
} from './constants';

export type HandleRequest = (
  endpointUrl: string,
  options: Omit<RequestInit, 'headers'> & { headers: Record<string, string> }
) => Promise<Response>;

// Helper function that adds content-type: application/json
// to each request's headers if not present
function getHeadersWithContentType(
  headers: Record<string, string> | undefined
) {
  const headersWithContentType = headers ?? {};
  if (
    Object.keys(headersWithContentType).every(
      (key) => key.toLowerCase() !== 'content-type'
    )
  ) {
    headersWithContentType['content-type'] = 'application/json';
  }
  return headersWithContentType;
}

function executeOperation({
  endpointUrl,
  handleRequest,
  operation,
  operationName,
  variables,
  headers,
  embeddedExplorerIFrameElement,
  operationId,
}: {
  endpointUrl: string;
  handleRequest: HandleRequest;
  operation: string;
  operationId: string;
  embeddedExplorerIFrameElement: HTMLIFrameElement;
  operationName: string | undefined;
  variables?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  return handleRequest(endpointUrl, {
    method: 'POST',
    headers: getHeadersWithContentType(headers),
    body: JSON.stringify({
      query: operation,
      variables,
      operationName,
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      const message: OutgoingEmbedMessage = {
        // Include the same operation ID in the response message's name
        // so the Explorer knows which operation it's associated with
        name: EXPLORER_QUERY_MUTATION_RESPONSE,
        operationId,
        response,
      };
      // After the operation completes, post a response message to the
      // iframe that includes the response data
      embeddedExplorerIFrameElement?.contentWindow?.postMessage(
        message,
        EMBEDDABLE_EXPLORER_URL
      );
    });
}

export function setupEmbedRelay({
  endpointUrl,
  handleRequest,
  embeddedExplorerIFrameElement,
  updateSchemaInEmbed,
  schema,
  graphRef,
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
}) {
  // Callback definition
  const onPostMessageReceived = (event: MessageEvent) => {
    const data: {
      name: string;
      operationName?: string;
      operation: string;
      operationId: string;
      variables?: Record<string, string>;
      headers?: Record<string, string>;
    } = event.data;
    // When embed connects, send a handshake message
    if (data.name === EXPLORER_LISTENING_FOR_HANDSHAKE) {
      const message: OutgoingEmbedMessage = {
        name: HANDSHAKE_RESPONSE,
        graphRef,
      };
      embeddedExplorerIFrameElement.contentWindow?.postMessage(
        message,
        EMBEDDABLE_EXPLORER_URL
      );
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
          embeddedExplorerIFrameElement,
          operationId,
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
