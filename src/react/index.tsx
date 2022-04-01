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

  const [currentEmbed, setCurrentEmbed] = useState<EmbeddedExplorer>();

  useEffect(() => {
    if (!wrapperElement) return;

    setCurrentEmbed((prevEmbed) => {
      prevEmbed?.dispose();

      return new EmbeddedExplorer({
        ...props,
        target: wrapperElement,
      });
    });

    return () => currentEmbed?.dispose();
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
