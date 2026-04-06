import type { IArgdownRequest } from "@argdown/core";
import { type Uri, workspace } from "vscode";
import type { ArgdownEngine } from "../ArgdownEngine";

export class ArgdownConfiguration {
  public argdownConfig?: IArgdownRequest;
  public readonly argdownConfigFile?: string;

  constructor(resource: Uri, argdownEngine: ArgdownEngine) {
    const argdownConfig = workspace.getConfiguration("argdown", resource);
    this.argdownConfigFile = argdownConfig.get<string | undefined>(
      "configFile",
      undefined
    );
    void this.refreshArgdownConfig(resource, argdownEngine);
  }

  async refreshArgdownConfig(resource: Uri, argdownEngine: ArgdownEngine) {
    this.argdownConfig =
      (await argdownEngine.loadConfig(this.argdownConfigFile, resource)) || {};
  }
}
