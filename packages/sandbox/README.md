# Apollo Studio Embeddable Sandbox 

This repo hosts the source for Apollo Studio's Embeddable Sandbox

[See docs for usage details](https://www.apollographql.com/docs/studio/explorer/sandbox/#embedding-sandbox)

## Using the [@apollo/sandbox npm package](https://www.npmjs.com/package/@apollo/sandbox)

You can download the @apollo/sandbox npm package with `npm install @apollo/sandbox`. Then, you can import the ApolloSandbox class or ApolloSandbox React component like so:

```
import { ApolloSandbox } from '@apollo/sandbox';
import { ApolloSandbox } from '@apollo/sandbox/react';
```

When you call the EmbeddedSandbox constructor with a `target` of an html div you have in your app, the Sandbox will show up in an iframe in that element. Check out all the [configuration options](https://www.apollographql.com/docs/studio/explorer/sandbox/#options) for your graph.

### React

```
import { ApolloSandbox } from '@apollo/sandbox/react';

function App() {

  return (
    <ApolloSandbox />
  );
}
```

### Vanilla JS

```
import { ApolloSandbox } from '@apollo/sandbox';

function App() {

  ...
  new ApolloSandbox({
      target: '#embeddableSandbox',
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
<div id="embeddableSandbox" />

```

### Examples from the raw cdn hosted umd file

- [Embedding a registered public graph](./src/examples/graphRef.html)
- [Usage by directly passing in schema](./src/examples/manualSchema.html)

## Developing embedded Sandbox

run `npm run build:umd` to build umd files where EmbeddedSandbox is exposed on window.

Open `examples/localDevelopmentExample.html` to test your changes. (if origin is not set, run localDevelopmentExample.html from `Live Server`)

Install the `Live Server` extension on VSCode, then go to `localDevelopmentExample.html` and click 'Go Live'
<img width="279" alt="Screen Shot 2022-04-27 at 4 34 53 PM" src="https://user-images.githubusercontent.com/16390269/165626464-8252abcd-2577-4d97-90a8-f487da807a64.png">

### Developing embedded Sandbox with the React example

run `npm run build:cjs-esm` to build cjs & esm files where ApolloSandbox & ApolloSandbox React are named exports.

We have a React example app that uses our ApolloSandbox React component to render the embedded Sandbox located in src/examples/react-example. To run this example, `npm run build` and `npm run start` in `react-example`. Make sure you delete the .parcel-cache folder before you rebuild for new changes. (TODO remove parcel caching)

