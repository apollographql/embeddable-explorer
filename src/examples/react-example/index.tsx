import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ApolloExplorerReact } from '../../index';

const App = () => {
  return (
    <div>
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
          },
        }}
      />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
