import { IArgdownResponse } from "./index.js";
import { HasLocation } from "./model/model.js";

export type ArgdownDiagnosticSeverity = "error" | "warning" | "information";

export interface IArgdownDiagnostic extends HasLocation {
  code: string;
  severity: ArgdownDiagnosticSeverity;
  message: string;
  source?: string;
}

declare module "./index.js" {
  interface IArgdownResponse {
    diagnostics?: IArgdownDiagnostic[];
  }
}

export const addDiagnostic = (
  response: IArgdownResponse,
  diagnostic: IArgdownDiagnostic,
  location?: HasLocation
): IArgdownDiagnostic => {
  const locatedDiagnostic = location
    ? {
        ...diagnostic,
        startLine: location.startLine,
        endLine: location.endLine,
        startOffset: location.startOffset,
        endOffset: location.endOffset,
        startColumn: location.startColumn,
        endColumn: location.endColumn
      }
    : diagnostic;
  if (!response.diagnostics) response.diagnostics = [];
  response.diagnostics.push(locatedDiagnostic);
  return locatedDiagnostic;
};
