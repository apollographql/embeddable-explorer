# @apollo/sandbox

## 2.7.2

### Patch Changes

- [#329](https://github.com/apollographql/embeddable-explorer/pull/329) [`8c7be6b`](https://github.com/apollographql/embeddable-explorer/commit/8c7be6b4ffcf8f76287fc01d43b210073d571fd6) Thanks [@esilverm](https://github.com/esilverm)! - fix a CSRF vulnerability that allowed attackers to pass through authenticated cookies though postMessage requests

## 2.7.1

### Patch Changes

- [#313](https://github.com/apollographql/embeddable-explorer/pull/313) [`3e3c434`](https://github.com/apollographql/embeddable-explorer/commit/3e3c434999e686a9f82db6118bf88adf3a57dd96) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump elliptic from 6.5.4 to 6.6.1

* [#322](https://github.com/apollographql/embeddable-explorer/pull/322) [`b5107f2`](https://github.com/apollographql/embeddable-explorer/commit/b5107f27a02ffe347ba7a559f89ca31ac1f20cd8) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump axios and bundlewatch

- [#315](https://github.com/apollographql/embeddable-explorer/pull/315) [`2ce1938`](https://github.com/apollographql/embeddable-explorer/commit/2ce1938cd74754654a0f16ec26f1e3e165cd06bf) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump ws from 7.5.7 to 7.5.10

* [#321](https://github.com/apollographql/embeddable-explorer/pull/321) [`074fe71`](https://github.com/apollographql/embeddable-explorer/commit/074fe71a15d3027ed49e591e2a67840024ecfd53) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump follow-redirects from 1.15.2 to 1.15.9

- [#314](https://github.com/apollographql/embeddable-explorer/pull/314) [`e7670dd`](https://github.com/apollographql/embeddable-explorer/commit/e7670ddb976c10922e4dd79b39b390eba4342ec9) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump rollup from 2.75.6 to 2.79.2

## 2.7.0

### Minor Changes

- [#300](https://github.com/apollographql/embeddable-explorer/pull/300) [`bbcdabf`](https://github.com/apollographql/embeddable-explorer/commit/bbcdabf19a3d05e3b9b619475676e34774dd9ea9) Thanks [@tayrrible](https://github.com/tayrrible)! - Adding support for `initialRequestConnectorsDebugging` to `EmbeddedSandbox`

## 2.6.0

### Minor Changes

- [#288](https://github.com/apollographql/embeddable-explorer/pull/288) [`d4ce484`](https://github.com/apollographql/embeddable-explorer/commit/d4ce48459dc9dd08cc28ee1158363a5fa06a1886) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Support Explorer preflight OAuth in embeds

* [#277](https://github.com/apollographql/embeddable-explorer/pull/277) [`5cd64d9`](https://github.com/apollographql/embeddable-explorer/commit/5cd64d9b8de3fdb1592d9468da96953c0f99008f) Thanks [@mayakoneval](https://github.com/mayakoneval)! - sendOperationHeadersInIntrospection config option, default to true

## 2.5.1

### Patch Changes

- [#269](https://github.com/apollographql/embeddable-explorer/pull/269) [`1a57130`](https://github.com/apollographql/embeddable-explorer/commit/1a5713028b5510748d0ece50d8e61568772a381b) Thanks [@mayakoneval](https://github.com/mayakoneval)! - We were out of protocol for HTTP Multipart Subscriptions. I was using an older version of the draft protocol. This should update to use the real HTTP Multipart Subscription protocol: https://www.apollographql.com/docs/router/executing-operations/subscription-multipart-protocol/.

## 2.5.0

### Minor Changes

- [#261](https://github.com/apollographql/embeddable-explorer/pull/261) [`7212121`](https://github.com/apollographql/embeddable-explorer/commit/7212121cad97028b007e974956dc951ce89d683c) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Allow opting out of adding dynamic styles to the iframe rendered by Embedded Explorer / Sandbox

## 2.4.0

### Minor Changes

- [#236](https://github.com/apollographql/embeddable-explorer/pull/236) [`afe5ebd`](https://github.com/apollographql/embeddable-explorer/commit/afe5ebd4908cadae28472f157a202c216e524a3a) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Allow users to pass in `runTelemetry: false` to stop telemetry from running on the embeds

## 2.3.0

### Minor Changes

- [#225](https://github.com/apollographql/embeddable-explorer/pull/225) [`c84387f`](https://github.com/apollographql/embeddable-explorer/commit/c84387f03211de9e0521037fe6a80505814758d9) Thanks [@mayakoneval](https://github.com/mayakoneval)! - File upload support for operations

## 2.2.0

### Minor Changes

- [#224](https://github.com/apollographql/embeddable-explorer/pull/224) [`70e9a34`](https://github.com/apollographql/embeddable-explorer/commit/70e9a34c546db5a419bda89cb8ff227d22442159) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Multipart subscription support in @apollo/sandbox. This feature is feature flagged, announcement to come.

### Patch Changes

- [#231](https://github.com/apollographql/embeddable-explorer/pull/231) [`e0fe994`](https://github.com/apollographql/embeddable-explorer/commit/e0fe994e401b13bac8fab143f8496bcf0c11cc19) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Update multipart subscription protocol & support multi part subscriptions in the explorer in addition to the sandbox

## 2.1.1

### Patch Changes

- [#221](https://github.com/apollographql/embeddable-explorer/pull/221) [`58165cf`](https://github.com/apollographql/embeddable-explorer/commit/58165cf7452dbad480c7cb85e7acba085b3bac1d) Thanks [@mayakoneval](https://github.com/mayakoneval)! - send referrer to studio via query param

## 2.1.0

### Minor Changes

- [#206](https://github.com/apollographql/embeddable-explorer/pull/206) [`a7a3315`](https://github.com/apollographql/embeddable-explorer/commit/a7a3315471b58b65cdd4e82dec7f85006d3baf1c) Thanks [@mayakoneval](https://github.com/mayakoneval)! - _New features!!_: Now users have the ability to set the initial autopoll state, set whether or not your sandbox endpoint is editable, be able to embed an Apollo operation collection, and set sharedHeaders in Sandbox for all folks using your embed.

## 2.0.0

### Major Changes

- [#215](https://github.com/apollographql/embeddable-explorer/pull/215) [`e542db7`](https://github.com/apollographql/embeddable-explorer/commit/e542db737e8d66aa25f3fb971f10f3437a8c4037) Thanks [@esilverm](https://github.com/esilverm)! - This major release affects how we send cookies to your embedded Sandbox and embedded Explorer. Previously, when a user passed the `includeCookies` config option we would set cookies on the default `fetch` request. However, when working in Sandbox or Explorer in Studio we let users set `includeCookies` in their connection settings. This change deprecates the old `includeCookies` option and passes the `includeCookies` value set in Explorer to your embedded Explorer or embedded Sandbox. In embedded Sandbox, you can configure whether cookies are initially on or off for your users on first load with the new config option `initialState.includeCookies`. You can decide to show or hide the connection settings toggle for your users with the config option `hideCookieToggle`. This change is backwards compatible, so if you are using the deprecated `includeCookies` config option, that overrides all other config options & your Studio settings.

## 1.0.3

### Patch Changes

- [#196](https://github.com/apollographql/embeddable-explorer/pull/196) [`3101b4f`](https://github.com/apollographql/embeddable-explorer/commit/3101b4f5b059d2f1854fc20413b7a3f0a2f7beb7) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Fix cjs build to point to correct file names

## 1.0.2

### Patch Changes

- [#183](https://github.com/apollographql/embeddable-explorer/pull/183) [`8f9038a`](https://github.com/apollographql/embeddable-explorer/commit/8f9038a0d36a50afeff4c465d2705b006af1dfec) Thanks [@mayakoneval](https://github.com/mayakoneval)! - 🐛 Fixes Issue#160: name cjs files .cjs so they don't conflict with type:module

* [#179](https://github.com/apollographql/embeddable-explorer/pull/179) [`d8c7096`](https://github.com/apollographql/embeddable-explorer/commit/d8c709608ea2a65ce048733589f3e67750a7c33f) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Support Generic MessageEvent type now that we are on TS4 :)

## 1.0.1

### Patch Changes

- [#182](https://github.com/apollographql/embeddable-explorer/pull/182) [`58eda3b`](https://github.com/apollographql/embeddable-explorer/commit/58eda3bd2b6cf03bb3997e97dd14c67a14d2a763) Thanks [@bigman73](https://github.com/bigman73)! - fix: Issue 181, use handleRequest to perform introspection queries

## 1.0.0

### Major Changes

- [#177](https://github.com/apollographql/embeddable-explorer/pull/177) [`bcff038`](https://github.com/apollographql/embeddable-explorer/commit/bcff038e9fbfffd0b215c94fefff319646114a85) Thanks [@bigman73](https://github.com/bigman73)! - This major release makes a small change to default functionality of the `includeCookies` configuration option for the embedded Sandbox & the embedded Explorer. Previously, when a user passed `includeCookies: false` or omitted this option, we would make fetch requests with `{ credentials: same-origin }`. However, embedded Sandbox often runs on the same origin as the endpoint users are fetching against, so cookies would still be included. This change passes `{ credentials: omit }` instead of `{ credentials: same-origin }` in the default & false case. No change to the `includeCookies: true` case.

### Patch Changes

- [#168](https://github.com/apollographql/embeddable-explorer/pull/168) [`cb50087`](https://github.com/apollographql/embeddable-explorer/commit/cb50087679bbd51115133fd74bfcd82f7f9d2069) Thanks [@mayakoneval](https://github.com/mayakoneval)! - lil logic cleanup

* [#171](https://github.com/apollographql/embeddable-explorer/pull/171) [`4ea1cd9`](https://github.com/apollographql/embeddable-explorer/commit/4ea1cd93c1e8f4b30814ffcf80bd0e07b4abb9f6) Thanks [@mayakoneval](https://github.com/mayakoneval)! - TS 3.6 -> 4.8!

## 0.3.0

### Minor Changes

- [#153](https://github.com/apollographql/embeddable-explorer/pull/153) [`f0200e0`](https://github.com/apollographql/embeddable-explorer/commit/f0200e0a022e46017774e1e56870699d2a887817) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Inject the Apollo Favicon if there is none on the page

* [#155](https://github.com/apollographql/embeddable-explorer/pull/155) [`102024e`](https://github.com/apollographql/embeddable-explorer/commit/102024e6fda9b83165d78fad5a0a9c11487e0ac9) Thanks [@William010x](https://github.com/William010x)! - Added support for @defer and @stream

- [#162](https://github.com/apollographql/embeddable-explorer/pull/162) [`2542e4e`](https://github.com/apollographql/embeddable-explorer/commit/2542e4e6840ba9e134eaa934344b727b7670dac8) Thanks [@Jephuff](https://github.com/Jephuff)! - Update defer support

### Patch Changes

- [#150](https://github.com/apollographql/embeddable-explorer/pull/150) [`a313cde`](https://github.com/apollographql/embeddable-explorer/commit/a313cdefaf5b3e8bfcc2fec2868ee49ab127b883) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Add opt-in query param for Studio telemetry & cookie notice

* [#158](https://github.com/apollographql/embeddable-explorer/pull/158) [`2b345a0`](https://github.com/apollographql/embeddable-explorer/commit/2b345a07e5dd09eb517093ba69e4d7546287d918) Thanks [@Jephuff](https://github.com/Jephuff)! - Addded internal query plan initial value type and param

## 0.2.1

### Patch Changes

- [#144](https://github.com/apollographql/embeddable-explorer/pull/144) [`423182e`](https://github.com/apollographql/embeddable-explorer/commit/423182e50171c3468c34efaa7d65222ac794fabc) Thanks [@mayakoneval](https://github.com/mayakoneval)! - fix dependency issue - move required deps into individual package jsons, not root package jsons

## 0.2.0

### Minor Changes

- [#133](https://github.com/apollographql/embeddable-explorer/pull/133) [`e3029e8`](https://github.com/apollographql/embeddable-explorer/commit/e3029e8c6abcf456cb9ad85356c4747607d37917) Thanks [@William010x](https://github.com/William010x)! - Support subscriptions in the embed

### Patch Changes

- [#142](https://github.com/apollographql/embeddable-explorer/pull/142) [`7a4e8ad`](https://github.com/apollographql/embeddable-explorer/commit/7a4e8ad6711647e014ac769282d92fff67447605) Thanks [@William010x](https://github.com/William010x)! - Fix react-example alias

## 0.1.0

### Minor Changes

- [#138](https://github.com/apollographql/embeddable-explorer/pull/138) [`9893948`](https://github.com/apollographql/embeddable-explorer/commit/9893948e8b459169e912dd18790dfe247bee29f6) Thanks [@mayakoneval](https://github.com/mayakoneval)! - New import syntax for @apollo/expplorer & first release of @apollo/sandbox
