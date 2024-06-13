import { Observable } from 'zen-observable-ts';
import type { GraphQLError } from 'graphql';
import type MIMEType from 'whatwg-mimetype';
import type { ResponseData, ResponseError } from './types';

export interface MultipartResponse {
  data: ResponseData & {
    incremental?: Array<
      ResponseData & { path: NonNullable<ResponseData['path']> }
    >;
    error?: ResponseError;
    hasNext?: boolean;
  };
  headers?: Record<string, string> | Record<string, string>[];
  size: number;
}

// https://apollographql.quip.com/mkWRAJfuxa7L/Multipart-subscriptions-protocol-spec
export interface MultipartSubscriptionResponse {
  data: {
    errors?: Array<GraphQLError>;
    payload:
      | (ResponseData & {
          error?: ResponseError;
        })
      | null;
  };
  headers?: Record<string, string> | Record<string, string>[];
  size: number;
  // True if --graphql-- message boundary is in the response
  shouldTerminate?: boolean;
}

export function readMultipartWebStream(response: Response, mimeType: MIMEType) {
  if (response.body === null) {
    throw new Error('Missing body');
  } else if (typeof response.body.tee !== 'function') {
    // not sure if we actually need this check in explorer?
    throw new Error(
      'Streaming bodies not supported by provided fetch implementation'
    );
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const messageBoundary = `--${mimeType.parameters.get('boundary') || '-'}`;
  const subscriptionTerminationMessageBoundary = '--graphql--';

  const reader = response.body.getReader();
  return {
    closeReadableStream: () => reader.cancel(),
    observable: new Observable<
      MultipartResponse | MultipartSubscriptionResponse
    >((observer) => {
      function readMultipartStream() {
        reader
          .read()
          .then((iteration) => {
            if (iteration.done) {
              observer.complete?.();
              return;
            }

            const chunk = decoder.decode(iteration.value);
            buffer += chunk;

            let boundaryIndex = buffer.indexOf(messageBoundary);
            while (boundaryIndex > -1) {
              const message = buffer.slice(0, boundaryIndex);
              buffer = buffer.slice(boundaryIndex + messageBoundary.length);

              if (message.trim()) {
                const newLineSequence = '\r\n\r\n';
                let messageStartIndex: number | undefined;
                // if there are two instances of newLineSequence, this is a response with multiple parts
                // and the first part is a heartbeat: https://www.apollographql.com/docs/router/executing-operations/subscription-multipart-protocol/
                if (
                  message.lastIndexOf(newLineSequence) !==
                  message.indexOf(newLineSequence)
                ) {
                  const heartbeatStartIndex =
                    message.indexOf(newLineSequence) + newLineSequence.length;
                  messageStartIndex =
                    message
                      .substring(heartbeatStartIndex)
                      .indexOf(newLineSequence) + heartbeatStartIndex;
                } else {
                  messageStartIndex = message.indexOf(newLineSequence);
                }

                const chunkHeaders = Object.fromEntries(
                  message
                    .slice(0, messageStartIndex)
                    .split('\n')
                    .map((line) => {
                      const i = line.indexOf(':');
                      if (i > -1) {
                        const name = line.slice(0, i).trim();
                        const value = line.slice(i + 1).trim();
                        return [name, value] as const;
                      } else {
                        return null;
                      }
                    })
                    .filter((h): h is NonNullable<typeof h> => !!h)
                );

                if (
                  chunkHeaders['content-type']
                    ?.toLowerCase()
                    .indexOf('application/json') === -1
                ) {
                  throw new Error('Unsupported patch content type');
                }

                const bodyText = message.slice(messageStartIndex);
                try {
                  observer.next?.({
                    data: JSON.parse(bodyText),
                    headers: chunkHeaders,
                    size: chunk.length,
                    ...(chunk.indexOf(subscriptionTerminationMessageBoundary) >
                    -1
                      ? { shouldTerminate: true }
                      : {}),
                  });
                } catch (err) {
                  // const parseError = err as ServerParseError;
                  // parseError.name = 'ServerParseError';
                  // parseError.response = response;
                  // parseError.statusCode = response.status;
                  // parseError.bodyText = bodyText;
                  throw err;
                }
              }

              boundaryIndex = buffer.indexOf(messageBoundary);
            }

            readMultipartStream();
          })
          .catch((err) => {
            if (err.name === 'AbortError') return;
            // if it is a network error, BUT there is graphql result info fire
            // the next observer before calling error this gives apollo-client
            // (and react-apollo) the `graphqlErrors` and `networkErrors` to
            // pass to UI this should only happen if we *also* have data as
            // part of the response key per the spec
            if (err.result && err.result.errors && err.result.data) {
              // if we don't call next, the UI can only show networkError
              // because AC didn't get any graphqlErrors this is graphql
              // execution result info (i.e errors and possibly data) this is
              // because there is no formal spec how errors should translate to
              // http status codes. So an auth error (401) could have both data
              // from a public field, errors from a private field, and a status
              // of 401
              // {
              //  user { // this will have errors
              //    firstName
              //  }
              //  products { // this is public so will have data
              //    cost
              //  }
              // }
              //
              // the result of above *could* look like this:
              // {
              //   data: { products: [{ cost: "$10" }] },
              //   errors: [{
              //      message: 'your session has timed out',
              //      path: []
              //   }]
              // }
              // status code of above would be a 401
              // in the UI you want to show data where you can, errors as data where you can
              // and use correct http status codes
              observer.next?.({
                data: err.result,
                size: Infinity,
              });
            }

            observer.error?.(err);
          });
      }
      readMultipartStream();
    }),
  };
}
