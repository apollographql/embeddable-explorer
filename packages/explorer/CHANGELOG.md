# @apollo/explorer

## 2.0.2

### Patch Changes

- [#196](https://github.com/apollographql/embeddable-explorer/pull/196) [`3101b4f`](https://github.com/apollographql/embeddable-explorer/commit/3101b4f5b059d2f1854fc20413b7a3f0a2f7beb7) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Fix cjs build to point to correct file names

## 2.0.1

### Patch Changes

- [#183](https://github.com/apollographql/embeddable-explorer/pull/183) [`8f9038a`](https://github.com/apollographql/embeddable-explorer/commit/8f9038a0d36a50afeff4c465d2705b006af1dfec) Thanks [@mayakoneval](https://github.com/mayakoneval)! - 🐛 Fixes Issue#160: name cjs files .cjs so they don't conflict with type:module

* [#179](https://github.com/apollographql/embeddable-explorer/pull/179) [`d8c7096`](https://github.com/apollographql/embeddable-explorer/commit/d8c709608ea2a65ce048733589f3e67750a7c33f) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Support Generic MessageEvent type now that we are on TS4 :)

## 2.0.0

### Major Changes

- [#177](https://github.com/apollographql/embeddable-explorer/pull/177) [`bcff038`](https://github.com/apollographql/embeddable-explorer/commit/bcff038e9fbfffd0b215c94fefff319646114a85) Thanks [@bigman73](https://github.com/bigman73)! - This major release makes a small change to default functionality of the `includeCookies` configuration option for the embedded Sandbox & the embedded Explorer. Previously, when a user passed `includeCookies: false` or omitted this option, we would make fetch requests with `{ credentials: same-origin }`. However, embedded Sandbox often runs on the same origin as the endpoint users are fetching against, so cookies would still be included. This change passes `{ credentials: omit }` instead of `{ credentials: same-origin }` in the default & false case. No change to the `includeCookies: true` case.

### Patch Changes

- [#168](https://github.com/apollographql/embeddable-explorer/pull/168) [`cb50087`](https://github.com/apollographql/embeddable-explorer/commit/cb50087679bbd51115133fd74bfcd82f7f9d2069) Thanks [@mayakoneval](https://github.com/mayakoneval)! - lil logic cleanup

* [#171](https://github.com/apollographql/embeddable-explorer/pull/171) [`4ea1cd9`](https://github.com/apollographql/embeddable-explorer/commit/4ea1cd93c1e8f4b30814ffcf80bd0e07b4abb9f6) Thanks [@mayakoneval](https://github.com/mayakoneval)! - TS 3.6 -> 4.8!

## 1.2.0

### Minor Changes

- [#153](https://github.com/apollographql/embeddable-explorer/pull/153) [`f0200e0`](https://github.com/apollographql/embeddable-explorer/commit/f0200e0a022e46017774e1e56870699d2a887817) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Inject the Apollo Favicon if there is none on the page

* [#155](https://github.com/apollographql/embeddable-explorer/pull/155) [`102024e`](https://github.com/apollographql/embeddable-explorer/commit/102024e6fda9b83165d78fad5a0a9c11487e0ac9) Thanks [@William010x](https://github.com/William010x)! - Added support for @defer and @stream

- [#162](https://github.com/apollographql/embeddable-explorer/pull/162) [`2542e4e`](https://github.com/apollographql/embeddable-explorer/commit/2542e4e6840ba9e134eaa934344b727b7670dac8) Thanks [@Jephuff](https://github.com/Jephuff)! - Update defer support

### Patch Changes

- [#150](https://github.com/apollographql/embeddable-explorer/pull/150) [`a313cde`](https://github.com/apollographql/embeddable-explorer/commit/a313cdefaf5b3e8bfcc2fec2868ee49ab127b883) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Add opt-in query param for Studio telemetry & cookie notice

## 1.1.1

### Patch Changes

- [#144](https://github.com/apollographql/embeddable-explorer/pull/144) [`423182e`](https://github.com/apollographql/embeddable-explorer/commit/423182e50171c3468c34efaa7d65222ac794fabc) Thanks [@mayakoneval](https://github.com/mayakoneval)! - fix dependency issue - move required deps into individual package jsons, not root package jsons

## 1.1.0

### Minor Changes

- [#133](https://github.com/apollographql/embeddable-explorer/pull/133) [`e3029e8`](https://github.com/apollographql/embeddable-explorer/commit/e3029e8c6abcf456cb9ad85356c4747607d37917) Thanks [@William010x](https://github.com/William010x)! - Support subscriptions in the embed

### Patch Changes

- [#142](https://github.com/apollographql/embeddable-explorer/pull/142) [`7a4e8ad`](https://github.com/apollographql/embeddable-explorer/commit/7a4e8ad6711647e014ac769282d92fff67447605) Thanks [@William010x](https://github.com/William010x)! - Fix react-example alias

## 1.0.0

### Major Changes

- [#138](https://github.com/apollographql/embeddable-explorer/pull/138) [`9893948`](https://github.com/apollographql/embeddable-explorer/commit/9893948e8b459169e912dd18790dfe247bee29f6) Thanks [@mayakoneval](https://github.com/mayakoneval)! - New import syntax for @apollo/expplorer & first release of @apollo/sandbox

### Minor Changes

- [#136](https://github.com/apollographql/embeddable-explorer/pull/136) [`c6b246c`](https://github.com/apollographql/embeddable-explorer/commit/c6b246c737e42fdc6334f1cbc269866951b66548) Thanks [@William010x](https://github.com/William010x)! - Add initialState config for sandbox

## 0.6.0

### Minor Changes

- [#134](https://github.com/apollographql/embeddable-explorer/pull/134) [`c488c4b`](https://github.com/apollographql/embeddable-explorer/commit/c488c4bdcea5e362d9b10cd62d7215eb1305192e) Thanks [@mayakoneval](https://github.com/mayakoneval)! - NEBULA-1330 Shareable links from embed copy parent url

### Patch Changes

- [#114](https://github.com/apollographql/embeddable-explorer/pull/114) [`4150ba4`](https://github.com/apollographql/embeddable-explorer/commit/4150ba40c1254f033fdf11baba4a41e58af0ef75) Thanks [@William010x](https://github.com/William010x)! - NEBULA-1286: Pretty print variables on new lines

* [#121](https://github.com/apollographql/embeddable-explorer/pull/121) [`91a4ff2`](https://github.com/apollographql/embeddable-explorer/commit/91a4ff2c94b4a0ba820fbbda6c7fe6ad25080edd) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Make deps required until the vanilla js export can be imported without them. This looks like a major change, but this was the case all along to use the vanilla export.

## 0.5.2

### Patch Changes

- [#64](https://github.com/apollographql/embeddable-explorer/pull/64) [`bfebd0c`](https://github.com/apollographql/embeddable-explorer/commit/bfebd0c179033c6bbf3cec328a58e6aaeda6487d) Thanks [@mayakoneval](https://github.com/mayakoneval)! - 🚨 Remove `sendRequestsFrom` 🚨 DON'T MERGE UNTIL https://github.com/mdg-private/studio-ui/pull/6154 IS OUT 🚨

* [#112](https://github.com/apollographql/embeddable-explorer/pull/112) [`d07cfb2`](https://github.com/apollographql/embeddable-explorer/commit/d07cfb226d62dfd057fbc66e42c2395ae0cfba43) Thanks [@mayakoneval](https://github.com/mayakoneval)! - 🐛 🩹 always send `shouldShowGlobalHeader` as true from this repo

## 0.5.1

### Patch Changes

- [#109](https://github.com/apollographql/embeddable-explorer/pull/109) [`a387e0d`](https://github.com/apollographql/embeddable-explorer/commit/a387e0d5837694dd25dbad77cbe023d7090379d7) Thanks [@mayakoneval](https://github.com/mayakoneval)! - respect classes that folks applied to their embed elements

* [#108](https://github.com/apollographql/embeddable-explorer/pull/108) [`7c741b8`](https://github.com/apollographql/embeddable-explorer/commit/7c741b860e756dc3104b65e5cd5e404d757f50ac) Thanks [@mayakoneval](https://github.com/mayakoneval)! - get rid of 'cannot use in operator' type error shown in development

## 0.5.0

### Minor Changes

- [#103](https://github.com/apollographql/embeddable-explorer/pull/103) [`72ff775`](https://github.com/apollographql/embeddable-explorer/commit/72ff775d016dd95c34ee38be2f415bb5eaaa5076) Thanks [@mayakoneval](https://github.com/mayakoneval)! - add config option: `includeCookies`

* [#105](https://github.com/apollographql/embeddable-explorer/pull/105) [`e2fbfc8`](https://github.com/apollographql/embeddable-explorer/commit/e2fbfc8622dd7c553945b1d9edf2227da6e291f1) Thanks [@William010x](https://github.com/William010x)! - Add logout messages to parent

### Patch Changes

- [#101](https://github.com/apollographql/embeddable-explorer/pull/101) [`0f83338`](https://github.com/apollographql/embeddable-explorer/commit/0f83338b1cde200a191ba16c9b839ee0254a9ad4) Thanks [@mayakoneval](https://github.com/mayakoneval)! - listen for auth stuff in sandbox too

## 0.4.2

### Patch Changes

- [#97](https://github.com/apollographql/embeddable-explorer/pull/97) [`2770795`](https://github.com/apollographql/embeddable-explorer/commit/277079565779d89215261363fdff79388225faf5) Thanks [@mayakoneval](https://github.com/mayakoneval)! - move index to root

## 0.4.1

### Patch Changes

- [#93](https://github.com/apollographql/embeddable-explorer/pull/93) [`d69e2da`](https://github.com/apollographql/embeddable-explorer/commit/d69e2daf9e561ae7147a1d8c25959fe99b42b63d) Thanks [@mayakoneval](https://github.com/mayakoneval)! - point to correct index file for cjs/esm build

## 0.4.0

### Minor Changes

- [#92](https://github.com/apollographql/embeddable-explorer/pull/92) [`18b6a09`](https://github.com/apollographql/embeddable-explorer/commit/18b6a0986a252d91f62c2707950f5290f4e83bf8) Thanks [@William010x](https://github.com/William010x)! - Add optional config for inviteToken and accountId

* [#88](https://github.com/apollographql/embeddable-explorer/pull/88) [`55e957a`](https://github.com/apollographql/embeddable-explorer/commit/55e957af5e88a7f04c50c681df6e009ff715f8ae) Thanks [@William010x](https://github.com/William010x)! - Add new post messages and listeners for local storage tokens

- [#71](https://github.com/apollographql/embeddable-explorer/pull/71) [`fb3097f`](https://github.com/apollographql/embeddable-explorer/commit/fb3097f625e717a65d6ffa65ee34a20fa183fa08) Thanks [@William010x](https://github.com/William010x)! - Add handshake on connection for Embedded Explorer

* [#71](https://github.com/apollographql/embeddable-explorer/pull/71) [`fb3097f`](https://github.com/apollographql/embeddable-explorer/commit/fb3097f625e717a65d6ffa65ee34a20fa183fa08) Thanks [@William010x](https://github.com/William010x)! - Add support for embeddable Sandbox in the embedded-explorer repo. The embeddable Sandbox is only built and pushed to our CDN bucket for use in Apollo Server right now.

### Patch Changes

- [#86](https://github.com/apollographql/embeddable-explorer/pull/86) [`89a94e3`](https://github.com/apollographql/embeddable-explorer/commit/89a94e3b8da54ab7c20715c15842fb8b95b49790) Thanks [@mayakoneval](https://github.com/mayakoneval)! - remove grey border on default iframes

* [#36](https://github.com/apollographql/embeddable-explorer/pull/36) [`13e9d2b`](https://github.com/apollographql/embeddable-explorer/commit/13e9d2bf4297a6886ddc560a2877f7c20edcb52b) Thanks [@renovate](https://github.com/apps/renovate)! - chore(deps): update dependency typescript to v4

- [#84](https://github.com/apollographql/embeddable-explorer/pull/84) [`2d47591`](https://github.com/apollographql/embeddable-explorer/commit/2d475911411ce9602ac630eb5ebbaf76da92ea74) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Send status & headers to embed

## 0.3.2

### Patch Changes

- [#62](https://github.com/apollographql/embeddable-explorer/pull/62) [`94b3a78`](https://github.com/apollographql/embeddable-explorer/commit/94b3a783b2955d952cce63bd846a1de1b658af91) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Expose hidden field schema on ApolloExplorerReact

* [#63](https://github.com/apollographql/embeddable-explorer/pull/63) [`ad65bf8`](https://github.com/apollographql/embeddable-explorer/commit/ad65bf8acf8359bf485f29c0188d34206a2981a7) Thanks [@mayakoneval](https://github.com/mayakoneval)! - PM schema to embed instead of rerendering

- [#44](https://github.com/apollographql/embeddable-explorer/pull/44) [`5eed697`](https://github.com/apollographql/embeddable-explorer/commit/5eed6970bb227c7a0f9580dac926f1c30919a865) Thanks [@renovate](https://github.com/apps/renovate)! - upgrade react to v18

## 0.3.1

### Patch Changes

- [#58](https://github.com/apollographql/embeddable-explorer/pull/58) [`5445b82`](https://github.com/apollographql/embeddable-explorer/commit/5445b82b495eff87490861a97529b6539ff381cd) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Fix a react bug where there might be two embeds showing up instead of one.

## 0.3.0

### Minor Changes

- [#30](https://github.com/apollographql/embeddable-explorer/pull/30) [`005d42d`](https://github.com/apollographql/embeddable-explorer/commit/005d42dfdd29ba7cf41b97a6d696e0422b980c0c) Thanks [@mayakoneval](https://github.com/mayakoneval)! - react & react-dom are now peers deps

### Patch Changes

- [#46](https://github.com/apollographql/embeddable-explorer/pull/46) [`f4c81cb`](https://github.com/apollographql/embeddable-explorer/commit/f4c81cb6db080bbebd85ce55120ddc5643bfcd81) Thanks [@mayakoneval](https://github.com/mayakoneval)! - For React npm Embed component: dispose of Embed when the props change and rerender

## 0.2.1

### Patch Changes

- [#20](https://github.com/apollographql/embeddable-explorer/pull/20) [`4b414fc`](https://github.com/apollographql/embeddable-explorer/commit/4b414fc39cc6839247d1f438856cfbec89f7d148) Thanks [@mayakoneval](https://github.com/mayakoneval)! - Initialize Changesets on embeddable-explorer repo
