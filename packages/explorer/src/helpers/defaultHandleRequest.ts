import type { HandleRequest } from './postMessageRelayHelpers';

export const defaultHandleRequest = ({
  legacyIncludeCookies,
}: {
  legacyIncludeCookies?: boolean;
}): HandleRequest => {
  const handleRequestWithCookiePref: HandleRequest = (endpointUrl, options) =>
    fetch(endpointUrl, {
      ...options,
      ...(legacyIncludeCookies
        ? { credentials: 'include' }
        : // if the user doesn't pass this value then we should use the credentials option sent from the
        // studio postMessage request. otherwise this would overwrite it.
        legacyIncludeCookies !== undefined
        ? { credentials: 'omit' }
        : {}),
    });
  return handleRequestWithCookiePref;
};
