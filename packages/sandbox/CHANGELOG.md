# @apollo/sandbox

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
