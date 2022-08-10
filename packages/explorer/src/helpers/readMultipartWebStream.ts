import type { Observer } from 'zen-observable-ts';
import type { GraphQLError } from 'graphql';
import type { JSONValue } from './types';
import type { ResponseError } from './postMessageRelayHelpers';
import type { TRACE_KEY } from './constants';

export interface MultipartResponse {
  data: {
    path?: Array<string | number>;
    data: Record<string, unknown> | JSONValue;
    errors?: Array<GraphQLError>;
    error?: ResponseError;
    extensions?: { [TRACE_KEY]?: string };
  };
  size: number;
  status?: number;
  headers?: Record<string, string>;
  hasNext?: boolean;
}

export function readMultipartWebStream(
  response: Response,
  contentType: string,
  observer: Observer<MultipartResponse>
) {
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

  // TODO: better parsing of boundary attribute?
  const messageBoundary = `--${(
    contentType.split('boundary=')[1] || '-'
  ).replace(/(^('|"))|(('|")$)/g, '')}`;
  // TODO: End message boundary???
  const reader = response.body.getReader();
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

        // buffer index
        let bi = buffer.indexOf(messageBoundary);
        while (bi > -1) {
          const message = buffer.slice(0, bi);
          buffer = buffer.slice(bi + messageBoundary.length);

          if (message.trim()) {
            const i = message.indexOf('\r\n\r\n');

            // make sure header content type is valid
            message
              .slice(0, i)
              .split('\n')
              .forEach((line) => {
                const indexOfColon = line.indexOf(':');
                if (
                  indexOfColon > -1 &&
                  line.slice(0, indexOfColon).trim().toLowerCase() ===
                    'content-type'
                ) {
                  if (
                    line.slice(indexOfColon + 1).indexOf('application/json') ===
                    -1
                  ) {
                    throw new Error('Unsupported patch content type'); // TODO: handle this case
                  }
                }
              });

            const bodyText = message.slice(i);
            try {
              observer.next?.({
                data: JSON.parse(bodyText),
                size: chunk.length,
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

          bi = buffer.indexOf(messageBoundary);
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
          observer.next?.({ data: err.result, size: Infinity });
        }

        observer.error?.(err);
      });
  }
  readMultipartStream();
}
