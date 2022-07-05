import React, { useEffect, useRef, useState } from 'react';
import { EmbeddedSandbox, EmbeddableSandboxOptions } from '../EmbeddedSandbox';

export function ApolloSandboxReact(
  props: Omit<EmbeddableSandboxOptions, 'target'> & { className?: string }
) {
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>();

  const currentEmbedRef = useRef<EmbeddedSandbox>();
  // we need to default to empty objects for the objects type props
  // that show up in the useDeepCompareEffect below, because useDeepCompareEffect
  // will throw if all of its deps are primitives (undefined instead of objects)
  const { handleRequest, includeCookies, className } = props;

  useEffect(() => {
    if (!wrapperElement) return;
    currentEmbedRef.current?.dispose();

    currentEmbedRef.current = new EmbeddedSandbox({
      ...props,
      target: wrapperElement,
    });

    return () => currentEmbedRef.current?.dispose();
  }, [handleRequest, includeCookies, className, wrapperElement]);

  return (
    <div
      className={className}
      ref={(element) => {
        setWrapperElement(element);
      }}
    />
  );
}
