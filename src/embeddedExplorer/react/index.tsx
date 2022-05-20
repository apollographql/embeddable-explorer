import type { IntrospectionQuery } from 'graphql';
import React, { useEffect, useRef, useState } from 'react';
import {
  BaseEmbeddableExplorerOptions,
  EmbeddedExplorer,
} from '../EmbeddedExplorer';
import useDeepCompareEffect from 'use-deep-compare-effect';

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
  // we need to default to empty objects for the objects type props
  // that show up in the useDeepCompareEffect below, because useDeepCompareEffect
  // will throw if all of its deps are primitives (undefined instead of objects)
  const {
    endpointUrl,
    handleRequest,
    initialState = {},
    persistExplorerState,
    graphRef,
    autoInviteOptions = {},
    includeCookies,
    className,
    schema,
  } = props;

  useDeepCompareEffect(
    () => {
      if (!wrapperElement) return;
      currentEmbedRef.current?.dispose();

      currentEmbedRef.current = new EmbeddedExplorer({
        ...props,
        target: wrapperElement,
      });

      return () => currentEmbedRef.current?.dispose();
    },
    // we purposely exclude schema here
    // when the schema changes we don't want to tear down and render a new embed,
    // we just want to pm the new schema to the embed in the below useEffect
    [
      endpointUrl,
      handleRequest,
      initialState,
      persistExplorerState,
      graphRef,
      autoInviteOptions,
      includeCookies,
      className,
      wrapperElement,
    ]
  );

  useEffect(() => {
    if (schema) currentEmbedRef.current?.updateSchemaInEmbed({ schema });
  }, [schema, currentEmbedRef.current]);

  return (
    <div
      className={className}
      ref={(element) => {
        setWrapperElement(element);
      }}
    />
  );
}
