export type JSONPrimitive = boolean | null | string | number;
export type JSONObject = { [key in string]?: JSONValue };
export type JSONValue = JSONPrimitive | JSONValue[] | JSONObject;
