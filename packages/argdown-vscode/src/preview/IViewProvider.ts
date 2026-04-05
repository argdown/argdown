import { ArgdownEngine } from "../ArgdownEngine";
import { ArgdownPreviewConfiguration } from "./ArgdownPreviewConfiguration";
import { IArgdownPreviewState } from "./IArgdownPreviewState";
import * as vscode from "vscode";
export interface IViewProvider {
  generateView(
    argdownEngine: ArgdownEngine,
    argdownDocument: vscode.TextDocument,
    config: ArgdownPreviewConfiguration,
    nonce: string
  ): string;
  generateSubMenu(): string;
  generateOnDidChangeTextDocumentMessage(
    argdownEngine: ArgdownEngine,
    argdownDocument: vscode.TextDocument,
    config: ArgdownPreviewConfiguration
  ): Promise<Record<string, unknown>> | Record<string, unknown>;
  contributeToInitialState(
    data: IArgdownPreviewState,
    argdownEngine: ArgdownEngine,
    argdownDocument: vscode.TextDocument,
    config: ArgdownPreviewConfiguration
  ): Promise<IArgdownPreviewState> | IArgdownPreviewState;
  scripts: string[];
}
