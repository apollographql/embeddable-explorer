import React, { useEffect, useState } from 'react';
import {
  EmbeddedExplorer,
  EmbeddableExplorerOptions,
} from '../EmbeddedExplorer';

export const ApolloExplorerReact = (
  props: Omit<EmbeddableExplorerOptions, 'target'> & {
    className?: string;
  }
) => {
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>();

  useEffect(() => {
    if (!wrapperElement) return;
    const embed = new EmbeddedExplorer({
      ...props,
      target: wrapperElement,
    });

    return () => embed.dispose();
  }, [props, wrapperElement]);

  return (
    <div
      className={props.className}
      ref={(element) => {
        setWrapperElement(element);
      }}
    />
  );
};
