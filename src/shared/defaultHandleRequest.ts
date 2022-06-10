import type { HandleRequest } from './postMessageRelayHelpers';

export const defaultHandleRequest = ({
  includeCookies,
}: {
  includeCookies: boolean;
}): HandleRequest => {
  const handleRequestWithCookiePref: HandleRequest = (endpointUrl, options) =>
    fetch(endpointUrl, {
      ...options,
      ...(includeCookies ? { credentials: 'include' } : {}),
    });
  return handleRequestWithCookiePref;
};
