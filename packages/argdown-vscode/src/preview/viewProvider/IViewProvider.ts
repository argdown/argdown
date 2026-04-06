import type { TextDocument } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import type { ArgdownPreviewConfiguration } from "../ArgdownPreviewConfiguration";
import type { IArgdownPreviewState } from "../IArgdownPreviewState";

export interface IViewProvider {
  generateView(
    argdownEngine: ArgdownEngine,
    argdownDocument: TextDocument,
    config: ArgdownPreviewConfiguration,
    nonce: string
  ): string;
  generateSubMenu(): string;
  generateOnDidChangeTextDocumentMessage(
    argdownEngine: ArgdownEngine,
    argdownDocument: TextDocument,
    config: ArgdownPreviewConfiguration
  ): Promise<Record<string, unknown>> | Record<string, unknown>;
  contributeToInitialState(
    data: IArgdownPreviewState,
    argdownEngine: ArgdownEngine,
    argdownDocument: TextDocument,
    config: ArgdownPreviewConfiguration
  ): Promise<IArgdownPreviewState> | IArgdownPreviewState;
  scripts: string[];
}
