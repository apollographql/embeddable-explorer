import React, { useEffect } from 'react';
import {
  EmbeddedExplorer,
  EmbeddableExplorerOptions,
} from './EmbeddedExplorer';

const DEFAULT_TARGET = 'apollo-explorer';

export const ApolloExplorerReact = (
  props: Omit<EmbeddableExplorerOptions, 'target'> & {
    className?: string;
    target?: string;
  }
) => {
  useEffect(() => {
    new EmbeddedExplorer({ ...props, target: props.target ?? DEFAULT_TARGET });
  }, []);

  return (
    <div className={props.className} id={props.target ?? DEFAULT_TARGET} />
  );
};
