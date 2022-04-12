import type { IntrospectionQuery } from 'graphql';
import React, { useEffect, useRef, useState } from 'react';
import {
  BaseEmbeddableExplorerOptions,
  EmbeddedExplorer,
} from '../EmbeddedExplorer';

// Need to extend from the base, b/c Omit<UnionType> doesn't carry over
// the conditional never's established here
interface EmbeddableExplorerOptionsWithSchema
  extends Omit<BaseEmbeddableExplorerOptions, 'target'> {
  schema: string | IntrospectionQuery;
  graphRef?: never;
}

interface EmbeddableExplorerOptionsWithGraphRef
  extends Omit<BaseEmbeddableExplorerOptions, 'target'> {
  graphRef: string;
  schema?: never;
}

export type EmbeddableExplorerOptions =
  | EmbeddableExplorerOptionsWithSchema
  | EmbeddableExplorerOptionsWithGraphRef;

export function ApolloExplorerReact(
  props: EmbeddableExplorerOptions & { className?: string }
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
