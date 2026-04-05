import * as vscode from "vscode";
import { ArgdownEngine } from "./ArgdownEngine";
import { IArgdownRequest } from "@argdown/core";

export class ArgdownConfiguration {
  public argdownConfig?: IArgdownRequest;
  public readonly argdownConfigFile?: string;

  constructor(resource: vscode.Uri, argdownEngine: ArgdownEngine) {
    const argdownConfig = vscode.workspace.getConfiguration(
      "argdown",
      resource
    );
    this.argdownConfigFile = argdownConfig.get<string | undefined>(
      "configFile",
      undefined
    );
    void this.refreshArgdownConfig(resource, argdownEngine);
  }

  async refreshArgdownConfig(
    resource: vscode.Uri,
    argdownEngine: ArgdownEngine
  ) {
    this.argdownConfig =
      (await argdownEngine.loadConfig(this.argdownConfigFile, resource)) || {};
  }
}
