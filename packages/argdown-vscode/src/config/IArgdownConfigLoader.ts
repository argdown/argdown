import type { IArgdownRequest } from "@argdown/core";
import type { Logger } from "../Logger";
import type { Uri } from "vscode";

export interface IArgdownConfigLoader {
  (
    configFile: string | undefined,
    resource: Uri,
    logger: Logger
  ): Promise<IArgdownRequest>;
}
