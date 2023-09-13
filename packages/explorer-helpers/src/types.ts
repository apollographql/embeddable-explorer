import type { GraphQLError } from 'graphql';

export type JSONPrimitive = boolean | null | string | number;
export type JSONObject = { [key in string]?: JSONValue };
export type JSONValue = JSONPrimitive | JSONValue[] | JSONObject;
const TRACE_KEY = 'ftv1';
export const QUERY_PLAN_KEY = 'apolloQueryPlan';

type PlanNode =
  | {
      kind: 'Defer';
      deferred: {
        node: PlanNode | null | undefined;
        label: string | null | undefined;
      }[];
      primary: { node: PlanNode | null | undefined };
    }
  | { kind: 'Sequence'; nodes: PlanNode[]; operation: string }
  | { kind: 'Parallel'; nodes: PlanNode[] }
  | { kind: 'Fetch'; serviceName: string; operation?: string }
  | {
      kind: 'Flatten';
      path: (string | number)[];
      node: PlanNode;
      operation?: string;
    };

export interface QueryPlan {
  node: PlanNode;
}

export interface QueryPlanResponse {
  text: string;
  object: QueryPlan;
}
export interface Extensions {
  [TRACE_KEY]?: string;
  [QUERY_PLAN_KEY]?: QueryPlanResponse;
}

export interface ResponseData {
  data: Record<string, unknown> | JSONValue | undefined;
  path?: Array<string | number>;
  errors?: Array<GraphQLError>;
  extensions?: Extensions;
}

export type ResponseError = {
    message: string;
    extensions?: {
        stack?: string;
    }
};
