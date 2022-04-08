import React, { useEffect, useRef, useState } from 'react';
import {
  EmbeddedExplorer,
  EmbeddableExplorerOptions,
} from '../EmbeddedExplorer';

export function ApolloExplorerReact(
  props: Omit<EmbeddableExplorerOptions, 'target'> & {
    className?: string;
  }
) {
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>();

  const currentEmbedRef = useRef<EmbeddedExplorer>();

  useEffect(() => {
    if (!wrapperElement) return;
    currentEmbedRef.current?.dispose();

    currentEmbedRef.current = new EmbeddedExplorer({
      ...props,
      target: wrapperElement,
    });

    return () => currentEmbedRef.current?.dispose();
  }, [props, wrapperElement]);

  return (
    <div
      className={props.className}
      ref={(element) => {
        setWrapperElement(element);
      }}
    />
  );
}
