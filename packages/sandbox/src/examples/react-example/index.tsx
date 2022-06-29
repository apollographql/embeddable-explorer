import './index.css';
// we alias react & react-dom to the same version in the main package.json
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloSandbox } from '../../react';

function App() {
  return (
    <div>
      <ApolloSandbox className="embedded-explorer" />
    </div>
  );
}

const container = document.getElementById('root');
const root = container ? createRoot(container) : undefined;
root?.render(<App />);
