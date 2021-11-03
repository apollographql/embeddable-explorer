import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_EXPLORER_URL,
  EXPLORER_LISTENING_FOR_SCHEMA,
  EXPLORER_QUERY_MUTATION_REQUEST,
  EXPLORER_QUERY_MUTATION_RESPONSE,
  SCHEMA_RESPONSE,
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
      key => key.toLowerCase() !== 'content-type'
    )
  ) {
    headersWithContentType['content-type'] = 'application/json';
  }
  return headersWithContentType;
}

async function executeOperation({
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
  operationName?: string;
  variables?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const response = await handleRequest(endpointUrl, {
    method: 'POST',
    headers: getHeadersWithContentType(headers),
    body: JSON.stringify({
      query: operation,
      variables,
      operationName,
    }),
  });
  await response.json().then(response => {
    // After the operation completes, post a response message to the
    // iframe that includes the response data
    embeddedExplorerIFrameElement?.contentWindow?.postMessage(
      {
        // Include the same operation ID in the response message's name
        // so the Explorer knows which operation it's associated with
        name: EXPLORER_QUERY_MUTATION_RESPONSE,
        operationId,
        response,
      },
      EMBEDDABLE_EXPLORER_URL
    );
  });
}

export function setupEmbedRelay({
  endpointUrl,
  handleRequest,
  embeddedExplorerIFrameElement,
  schema,
}: {
  endpointUrl: string;
  handleRequest: HandleRequest;
  embeddedExplorerIFrameElement: HTMLIFrameElement;
  schema?: string | IntrospectionQuery | undefined;
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
    } = event.data
    // Embedded Explorer sends us a PM when it is ready for a schema
    if ('name' in data && data.name === EXPLORER_LISTENING_FOR_SCHEMA  && !!schema) {
      embeddedExplorerIFrameElement.contentWindow?.postMessage(
        {
          name: SCHEMA_RESPONSE,
          schema,
        },
        EMBEDDABLE_EXPLORER_URL
      );
    }

    // Check to see if the posted message indicates that the user is
    // executing a query or mutation or subscription in the Explorer
    const isQueryOrMutation =
      'name' in data &&
      data.name === EXPLORER_QUERY_MUTATION_REQUEST;

    // If the user is executing a query or mutation or subscription...
    if (
      (isQueryOrMutation) &&
      data.operation &&
      data.operationId
    ) {
      // Extract the operation details from the event.data object
      const {
        operation,
        operationId,
        operationName,
        variables,
        headers,
      } = data;
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
}
