import type { IntrospectionQuery } from 'graphql';
import {
  EMBEDDABLE_EXPLORER_URL,
  EMBEDDABLE_EXPLORER_URL_ORIGIN,
  EXPLORER_LISTENING_FOR_HANDSHAKE,
  EXPLORER_LISTENING_FOR_SCHEMA,
  EXPLORER_QUERY_MUTATION_REQUEST,
  EXPLORER_SUBSCRIPTION_REQUEST,
  HANDSHAKE_RESPONSE,
} from './helpers/constants';
import {
  addMessageListener,
  DisposableResource,
  executeOperation,
  handleAuthenticationPostMessage,
  HandleRequest,
  IncomingEmbedMessage,
  sendPostMessageToEmbed,
} from './helpers/postMessageRelayHelpers';
import {
  executeSubscription,
  setParentSocketError,
} from './helpers/subscriptionPostMessageRelayHelpers';

export function setupEmbedRelay({
  endpointUrl,
  handleRequest,
  embeddedExplorerIFrameElement,
  updateSchemaInEmbed,
  schema,
  graphRef,
  autoInviteOptions,
  __testLocal__,
}: {
  endpointUrl: string | undefined;
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
  __testLocal__: boolean;
}): DisposableResource {
  const embedUrl = EMBEDDABLE_EXPLORER_URL(__testLocal__);
  const embedUrlOrigin = EMBEDDABLE_EXPLORER_URL_ORIGIN(__testLocal__);
  // Callback definition
  const onPostMessageReceived = (event: IncomingEmbedMessage) => {
    handleAuthenticationPostMessage({
      event,
      embedUrl,
      embeddedIFrameElement: embeddedExplorerIFrameElement,
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
            graphRef,
            inviteToken: autoInviteOptions?.inviteToken,
            accountId: autoInviteOptions?.accountId,
            parentHref: window.location.href,
          },
          embeddedIFrameElement: embeddedExplorerIFrameElement,
          embedUrl,
        });
      }

      // Embedded Explorer sends us a PM when it is ready for a schema
      if (data.name === EXPLORER_LISTENING_FOR_SCHEMA && !!schema) {
        updateSchemaInEmbed({ schema });
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
        const { operation, operationId, operationName, variables, headers } =
          data;

        if (isQueryOrMutation) {
          const { includeCookies } = data;
          // we support the old way of using the embed when we didn't require folks to have
          // studio graphs, which is to pass in an endpoint manually. However, we use the
          // endpoint sent to us from studio if there is no endpoint passed in manually
          const endpointUrlToUseInExecution = endpointUrl ?? data.endpointUrl;
          if (!endpointUrlToUseInExecution) {
            throw new Error(
              'Something went wrong, we should not have gotten here. Please double check that you are passing `endpointUrl` in your config if you are using an older version of embedded Explorer'
            );
          }
          executeOperation({
            endpointUrl: endpointUrlToUseInExecution,
            handleRequest,
            operation,
            operationName,
            variables,
            headers,
            includeCookies,
            embeddedIFrameElement: embeddedExplorerIFrameElement,
            operationId,
            embedUrl,
            isMultipartSubscription: false,
            fileVariables:
              'fileVariables' in data ? data.fileVariables : undefined,
          });
        } else if (isSubscription) {
          const { httpMultipartParams } = data;
          if (!!schema) {
            setParentSocketError({
              error: new Error(
                'you cannot run subscriptions from this embed, since you are not embedding with a registered Studio graph'
              ),
              embeddedIFrameElement: embeddedExplorerIFrameElement,
              embedUrl,
            });
          } else {
            executeSubscription({
              operation,
              operationName,
              variables,
              headers,
              embeddedIFrameElement: embeddedExplorerIFrameElement,
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
    }
  };
  // Execute our callback whenever window.postMessage is called
  return addMessageListener(embedUrlOrigin, onPostMessageReceived);
}
