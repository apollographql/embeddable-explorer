import React from 'react';
import {
  EmbeddedExplorer,
  EmbeddableExplorerOptions,
} from './EmbeddedExplorer';

export const ApolloExplorerReact = (
  props: Omit<EmbeddableExplorerOptions, 'target'> & {
    className?: string;
  }
) => {
  return (
    <div
      className={props.className}
      ref={(element) => {
        if (!element) return;
        new EmbeddedExplorer({ ...props, target: element });
      }}
    />
  );
};
