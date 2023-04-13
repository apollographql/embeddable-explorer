import type { JSONObject } from './types';

export type FileVariable = {
  variableKey: string;
  files: File[] | undefined;
  isMultiFile: boolean;
};

export interface OperationRequestBody {
  query: string;
  variables: JSONObject | null;
  operationName: string | undefined;
}

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

const isFileVariableWithFile = (
  fileVariable: FileVariable
): fileVariable is FileVariable & {
  files: NonNullable<FileVariable['files']>;
} => {
  return !!fileVariable.files && fileVariable.files.length > 0;
};

export type FileVariableFromTransfer = {
  variableKey: string;
  files: { arrayBuffer: ArrayBuffer; fileName: string }[];
  isMultiFile: boolean;
};

export const getFileListFromTransfer = ({
  fileVariables: inputtedFileVariables,
}: {
  fileVariables: FileVariableFromTransfer[];
}) =>
  inputtedFileVariables.map((fileVariable) => ({
    ...fileVariable,
    files: fileVariable.files.map(
      ({ arrayBuffer, fileName }) =>
        new File([new Blob([arrayBuffer])], fileName)
    ),
  }));

const getSharedMultipartFormComponents = ({
  fileVariables,
  requestBody,
}: {
  fileVariables: FileVariable[];
  requestBody: OperationRequestBody;
}) => {
  // the map element of a FormData maps indices to a single item array of variable names
  // as seen here https://github.com/jaydenseric/graphql-multipart-request-spec#file-list
  const map: Record<number, string[]> = {};
  let i = 0;
  // map must be the first thing in the form, followed by the files
  // other wise you get the error:
  // Misordered multipart fields; files should follow ‘map’ (https://github.com/jaydenseric/graphql-multipart-request-spec).
  const filesToAppend: {
    indexString: string;
    value: File;
    fileName: string;
  }[] = [];
  // variables are added to the operation body with null values, the variable
  // name is used to match them to files uploaded in the later part of the request
  // according to the spec https://github.com/jaydenseric/graphql-multipart-request-spec
  let variablesWithNullsForFiles = requestBody.variables;
  fileVariables.forEach(
    ({ files, variableKey, isMultiFile }, fileVariableIndex) => {
      if (files?.length) {
        variablesWithNullsForFiles = {
          ...(typeof variablesWithNullsForFiles === 'object'
            ? variablesWithNullsForFiles
            : {}),
          [variableKey]: isMultiFile
            ? new Array(files.length).fill(null)
            : null,
        };
        Array.from(files).forEach((file) => {
          map[i] = [
            `${
              fileVariables.length > 1 ? `${fileVariableIndex}.` : ''
            }variables.${variableKey}${isMultiFile ? `.${i}` : ''}`,
          ];
          // in the request, there is expected to be a number appended that corresponds to each file
          // https://github.com/jaydenseric/graphql-multipart-request-spec#file-list
          filesToAppend.push({
            indexString: i.toString(),
            value: file,
            fileName: file.name,
          });
          i++;
        });
      }
    }
  );
  return { variablesWithNullsForFiles, filesToAppend, map };
};

export const constructMultipartForm = async ({
  fileVariables: inputtedFileVariables,
  requestBody,
}: {
  fileVariables: FileVariable[];
  requestBody: OperationRequestBody;
}) => {
  const fileVariables: {
    variableKey: string;
    files: File[];
    isMultiFile: boolean;
  }[] = inputtedFileVariables.filter(isFileVariableWithFile);

  const { map, variablesWithNullsForFiles, filesToAppend } =
    getSharedMultipartFormComponents({
      fileVariables,
      requestBody,
    });

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
    form.append(item.indexString, item.value, item.fileName);
  });

  return form;
};

// Mostly from https://github.com/xxorax/node-shell-escape/blob/ebdb90e58050d74dbda9b8177f7de11cbb355d94/shell-escape.js#L4-L17
function escapeShellArgument(argument: string) {
  if (!/[^A-Za-z0-9_\/:=-]/.test(argument)) {
    return argument;
  }
  const escapedArgument = `'${argument.replace(/'/g, "'\\''")}'`;
  return escapedArgument
    .replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
    .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
}

export const constructMultipartCurlString = ({
  fileVariables: inputtedFileVariables,
  requestBody,
  processedHeaders,
  url,
}: {
  fileVariables: FileVariable[];
  requestBody: OperationRequestBody;
  processedHeaders: Record<string, string>;
  url: string | undefined;
}) => {
  const fileVariables: {
    variableKey: string;
    files: File[];
    isMultiFile: boolean;
  }[] = inputtedFileVariables.filter(isFileVariableWithFile);
  const { map, variablesWithNullsForFiles, filesToAppend } =
    getSharedMultipartFormComponents({
      fileVariables,
      requestBody,
    });
  const curlString = `curl ${escapeShellArgument(url || '<GRAPH_URL>')} \\${
    `${Object.entries(processedHeaders)
      .map(
        ([key, value]) =>
          `\n    -H ${escapeShellArgument(`${key}: ${value}`)} \\`
      )
      .join('')}` +
    `\n -F operations='${serializeFetchParameter(
      {
        query: requestBody.query,
        operationName: requestBody.operationName,
        variables: variablesWithNullsForFiles,
      },
      'Payload'
    )}' \\`
  }\n -F map='${JSON.stringify(map)}' \\${filesToAppend
    .map((file) => `\n -F ${file.indexString}=@${file.fileName} \\`)
    .join()}`;

  return curlString;
};
