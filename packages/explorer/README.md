# Apollo Studio Embeddable Explorer

This repo hosts the source for Apollo Studio's Embeddable Explorer

[See docs for usage details](https://www.apollographql.com/docs/studio/embed-explorer/)

## Using the [@apollo/explorer npm package](https://www.npmjs.com/package/@apollo/explorer)

You can download the @apollo/explorer npm package with `npm install @apollo/explorer`. Then, you can import the ApolloExplorer class or ApolloExplorer component like so:

```
import { ApolloExplorer } from '@apollo/explorer';
import { ApolloExplorer } from '@apollo/explorer/react';
```

When you call the EmbeddedExplorer constructor with a `target` of an html div you have in your app, the Explorer will show up in an iframe in that element. Check out all the [configuration options](https://www.apollographql.com/docs/studio/explorer/embed-explorer/#options) for your graph.

### React

```
import { ApolloExplorer } from '@apollo/explorer/react';

function App() {

  return (
    <ApolloExplorer
      graphRef='acephei@current',
      endpointUrl='https://acephei-gateway.herokuapp.com',
      initialState={{
        document: `query Example {
me {
  id
}
}`,
        variables: {
          test: 'abcxyz',
        },
        displayOptions: {
          showHeadersAndEnvVars: true,
        },
      }}
    />
  );
}
```

### Vanilla JS

```
import { ApolloExplorer } from '@apollo/explorer';

function App() {

  ...
  new ApolloExplorer({
      target: '#embeddableExplorer',
      graphRef: 'acephei@current',
      endpointUrl: 'https://acephei-gateway.herokuapp.com',
      initialState: {
        document: `query Example {
me {
  id
}
}`,
        variables: {
          test: 'abcxyz',
        },
        displayOptions: {
          showHeadersAndEnvVars: true,
        },
      },
  })
  ...

}

...
// style the iframe for your site
<style>
  iframe {
    height: 100%;
    width: 100%;
    border: none;
  }
</style>
<div id="embeddableExplorer" />
```

### Examples from the raw cdn hosted umd file

- [Embedding a registered public graph](./src/examples/graphRef.html)
- [Usage by directly passing in schema](./src/examples/manualSchema.html)

## Developing embedded Explorer

`cd` into `packages/explorer` and run `npm run build:umd` to build umd files where EmbeddedExplorer is exposed on window.

Open `examples/embeddedExplorer/localDevelopmentExample.html` to test your changes. (if origin is not set, run localDevelopmentExample.html from `Live Server`)

Install the `Live Server` extension on VSCode, then go to `localDevelopmentExample.html` and click 'Go Live'
<img width="279" alt="Screen Shot 2022-04-27 at 4 34 53 PM" src="https://user-images.githubusercontent.com/16390269/165626464-8252abcd-2577-4d97-90a8-f487da807a64.png">

### Developing embedded Explorer with the React example

`cd` into `packages/explorer` and run `npm run build:cjs-esm` to build cjs & esm files where ApolloExplorer & ApolloExplorer React are named exports.

We have a React example app that uses our ApolloExplorer React component to render the embedded Explorer located in src/examples/react-example. To run this example, `npm run build` and `npm run start` in `react-example`. Make sure you delete the .parcel-cache folder before you rebuild for new changes. (TODO remove parcel caching)

### Sequence Diagrams

#### Connecting to unregistered graphs by directly passing in schema
```mermaid
sequenceDiagram
    participant Parent as Parent Page
    participant Embed as Embedded Explorer

    note over Parent: Render iframe loading embed and start listening for messages.
    Parent->>Embed: Embed loads with initial state <br>(gql operation, variables, headers, persistence preference etc) <br>in the query params of the iframe.
    note over Embed: Loaded and sets initial state<br> from query params.
    note over Embed: Start listening for messages

    Embed->>Parent: Handshake message asking for schema
    Parent->>Embed: Responds with schema

    note over Embed: Loads in given schema to explorer

    Embed --> Parent: Set up finished
    
    note over Embed: User submits operation
    Embed->>Parent: Send request contents
    note over Parent: Makes actual network request via `handleRequest()`
    Parent->>Embed: Send network response back
    note over Embed: Processes and renders response
```


#### Connecting to registered graphs by authentication

```mermaid
sequenceDiagram
    participant Parent as Parent Page
    participant Embed as Embedded Explorer
    participant Login as Studio Login Page at <br>studio.apollographql.com

    note over Parent: Render iframe loading embed and start listening for messages.
    Parent->>Embed: Embed loads with initial state <br>(gql operation, variables, headers, persistence preference etc) <br>in the query params of the iframe.
    note over Embed: Loaded and sets initial state<br> from query params.
    note over Embed: Start listening for messages

    Embed->>Parent: Handshake message asking for graphRef, <br>account id & account invite token if provided
        
    Parent->>Embed: Responds with graphRef, account id, account invite token

    Embed->>Parent: Authentication message asking for second half of<br> authentication token from parent page local storage

    alt when parent page has authentication token or graph is public
        Parent->>Embed: Responds with half auth token<br> from parent page local storage
    else when parent page doesn't have authentication token
        note over Embed: Renders login page
        note over Embed: User clicks 'login' on embed
        Embed ->>Login: Embed opens a new tab to <br>login page via window.open
        note over Login: Asks user to authenticate and<br> authorize this embed to use account
        note over Login: User accepts
        note over Login: Login page generates new <br>Studio API Key for this user
        Login ->> Embed: Sends Studio API Key over <br>postMessage via window.opener
        note over Embed: Splits key in 2, <br>stores half in local storage
        Embed ->> Parent: Sends other half of key to parent page
        note over Parent: Stores half of key in local storage
        Parent->>Embed: Responds with half auth token<br> from parent page local storage
    end


    note over Embed: Merges half key from parent page & half from embed local storage. <br>Uses this key for all future requests to Studio backend.

    note over Embed: Loads in schema & operation <br>collections for given graphRef from Studio servers

    Parent --> Login: Set up finished
    
    note over Embed: User submits operation
    Embed->>Parent: Send request contents
    note over Parent: Makes actual network request via `handleRequest()`
    Parent->>Embed: Send network response back
    note over Embed: Processes and renders response
```
