---
'@apollo/explorer': major
'@apollo/sandbox': major
---

This major release affects how we send cookies to your embedded Sandbox and embedded Explorer. Previously, when a user passed the `includeCookies` config option we would set cookies on the default `fetch` request. However, when working in sandbox or explorer in Studio we let users set `includeCookies` in their connection settings. This change deprecates the old `includeCookies` option and passes the `includeCookies` value set in explorer to your embedded Explorer or embedded Sandbox. In embedded Sandbox, you can configure this feature with `initialState.includeCookies`, and can show/hide the connection settings toggle with `hideCookieToggle`. This change is backwards compatible and will keep the same functionality of the deprecated `includeCookies` option if you would like to keep using it.