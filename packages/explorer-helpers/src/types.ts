import type { GraphQLError } from 'graphql';
import type { ObjMap } from 'graphql/jsutils/ObjMap';

export type JSONPrimitive = boolean | null | string | number;
export type JSONObject = { [key in string]?: JSONValue };
export type JSONValue = JSONPrimitive | JSONValue[] | JSONObject;
const TRACE_KEY = 'ftv1';
export interface ResponseData {
  data?: Record<string, unknown> | JSONValue | ObjMap<unknown>;
  path?: Array<string | number>;
  errors?: readonly GraphQLError[];
  extensions?: { [TRACE_KEY]?: string };
}
