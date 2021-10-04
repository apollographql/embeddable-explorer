import {
  EMBEDDABLE_EXPLORER_URL,
  EXPLORER_QUERY_MUTATION_REQUEST,
  EXPLORER_QUERY_MUTATION_RESPONSE,
  EXPLORER_SUBSCRIPTION_REQUEST,
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
  operationName?: string;
  variables?: Record<string, string>;
  headers?: Record<string, string>;
  embeddedExplorerIFrameElement?: HTMLIFrameElement;
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
}: {
  endpointUrl: string;
  handleRequest: HandleRequest;
  embeddedExplorerIFrameElement: HTMLIFrameElement;
}) {
  // Callback definition
  const onPostMessageReceived = (event: MessageEvent) => {
    // Check to see if the posted message indicates that the user is
    // executing a query or mutation or subscription in the Explorer
    const isQueryOrMutation =
      'name' in event.data &&
      event.data.name === EXPLORER_QUERY_MUTATION_REQUEST;
    const isSubscription =
      'name' in event.data && event.data.name === EXPLORER_SUBSCRIPTION_REQUEST;

    // If the user is executing a query or mutation or subscription...
    if (
      (isQueryOrMutation || isSubscription) &&
      event.data.name &&
      event.data.operation &&
      event.data.operationId
    ) {
      // Extract the operation details from the event.data object
      const {
        operation,
        operationId,
        operationName,
        variables,
        headers,
      } = event.data;
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
