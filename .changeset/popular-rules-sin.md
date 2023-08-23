---
"@apollo/explorer": patch
"@apollo/sandbox": patch
"@apollo/explorer-helpers": patch
---

We were out of protocol for HTTP Multipart Subscriptions. I was using an older version of the draft protocol. This should update to use the real HTTP Multipart Subscription protocol: https://www.apollographql.com/docs/router/executing-operations/subscription-multipart-protocol/.
