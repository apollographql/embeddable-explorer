---
'@apollo/explorer': major
'@apollo/sandbox': major
---

This major release makes a small change to default functionality of the `includeCookies` configuration option for the embedded Sandbox & the embedded Explorer. Previously, when a user passed `includeCookies: false` or omitted this option, we would make fetch requests with `{ credentials: same-origin }`. However, embedded Sandbox often runs on the same origin as the endpoint users are fetching against, so cookies would still be included. This change passes `{ credentials: omit }` instead of `{ credentials: same-origin }` in the default & false case. No change to the `includeCookies: true` case.
