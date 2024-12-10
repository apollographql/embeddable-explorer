import type { JSONValue } from './types';

export type FileVariable = {
  variableKey: string;
  files: { arrayBuffer: ArrayBuffer; fileName: string }[];
  isMultiFile: boolean;
};

// https://github.com/apollographql/apollo-client/blob/cbcf951256b22553bdb065dfa0d32c0a4ca804d3/src/link/http/serializeFetchParameter.ts
export const serializeFetchParameter = (p: any, label: string) => {
  let serialized;
  try {
    serialized = JSON.stringify(p);
  } catch (e) {
    const parseError = new Error(
      `Network request failed. ${label} is not serializable`
    );
    throw parseError;
  }
  return serialized;
};

export const constructMultipartForm = async ({
  fileVariables: inputtedFileVariables,
  requestBody,
}: {
  fileVariables: FileVariable[];
  requestBody: {
    operationName?: string;
    query: string;
    variables?: Record<string, string>;
  };
}) => {
  const fileVariables: {
    variableKey: string;
    files: File[];
    isMultiFile: boolean;
  }[] = inputtedFileVariables.map((fileVariable) => ({
    ...fileVariable,
    files: fileVariable.files.map(
      ({ arrayBuffer, fileName }) =>
        new File([new Blob([arrayBuffer])], fileName)
    ),
  }));

  // the map element of a FormData maps indices to a single item array of variable names
  // as seen here https://github.com/jaydenseric/graphql-multipart-request-spec#file-list
  const map: Record<number, string[]> = {};
  let i = 0;
  // map must be the first thing in the form, followed by the files
  // other wise you get the error:
  // Misordered multipart fields; files should follow ‘map’ (https://github.com/jaydenseric/graphql-multipart-request-spec).
  const filesToAppend: [string, File, string][] = [];
  // variables are added to the operation body with null values, the variable
  // name is used to match them to files uploaded in the later part of the request
  // according to the spec https://github.com/jaydenseric/graphql-multipart-request-spec
  let variablesWithNullsForFiles:
    | Record<string, JSONValue | undefined | null | null[]>
    | undefined = requestBody.variables;

  let counterMap = {};

  fileVariables.forEach(
    ({ files, variableKey, isMultiFile }, fileVariableIndex) => {
      if (files?.length) {
        variablesWithNullsForFiles = {
          ...variablesWithNullsForFiles,
          [variableKey]: isMultiFile
            ? new Array(files.length).fill(null)
            : null,
        };
        Array.from(files).forEach((file) => {
          map[i] = [
            `variables.${variableKey}${isMultiFile ? `.${fileVariableIndex}` : ''}`,
          ];
          // in the request, there is expected to be a number appended that corresponds to each file
          // https://github.com/jaydenseric/graphql-multipart-request-spec#file-list
          filesToAppend.push([i.toString(), file, file.name]);
          i++;
        });
      }
    }
  );
  const form = new FormData();
  form.append(
    'operations',
    serializeFetchParameter(
      {
        query: requestBody.query,
        operationName: requestBody.operationName,
        variables: variablesWithNullsForFiles,
      },
      'Payload'
    )
  );

  form.append('map', JSON.stringify(map));
  filesToAppend.forEach((item) => {
    form.append(item[0], item[1], item[2]);
  });

  return form;
};
