import './index.css';
// we alias react & react-dom to the same version in the main package.json
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ApolloExplorerReact } from '../../index';
import { useState } from 'react';
import { exampleSchema } from './exampleSchema';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [schema, setSchema] = useState(exampleSchema);

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
        }
      >
        Click me to change the theme
      </button>
      <ApolloExplorerReact
        className="embedded-explorer"
        graphRef="acephei@current"
        endpointUrl="https://acephei-gateway.herokuapp.com"
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
            theme,
          },
        }}
      />
      Example with manual schema
      <button
        type="button"
        onClick={() =>
          setSchema(`type Query {
            fieldA: String
          }`)
        }
      >
        Click me to change the schema
      </button>
      <ApolloExplorerReact
        className="embedded-explorer"
        schema={schema}
        endpointUrl="https://acephei-gateway.herokuapp.com"
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
            theme: 'light',
          },
        }}
      />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
