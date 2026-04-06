import { type Uri, workspace } from "vscode";
import { Utils } from "vscode-uri";
import type { IArgdownConfigLoader } from "../IArgdownConfigLoader";

export const browserConfigLoader: IArgdownConfigLoader = async (
  configFile,
  resource,
  logger
) => {
  if (!configFile) {
    return {};
  }
  const workspaceFolder = workspace.getWorkspaceFolder(resource);

  let configPath: Uri;
  if (workspaceFolder) {
    configPath = Utils.resolvePath(workspaceFolder.uri, configFile);
  } else {
    const rootPath = Utils.dirname(resource);
    configPath = Utils.resolvePath(rootPath, configFile);
  }

  try {
    const data = await workspace.fs.readFile(configPath);
    const str = Buffer.from(data).toString("utf8");
    return JSON.parse(str);
  } catch (e) {
    if (e instanceof Error) {
      logger.log(
        "verbose",
        "[AsyncArgdownApplication]: No config found: " + e.toString()
      );
    }
  }
};
