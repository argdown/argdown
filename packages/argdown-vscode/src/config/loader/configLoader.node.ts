import importFresh from "import-fresh";
import { type Uri, workspace } from "vscode";
import { Utils } from "vscode-uri";
import type { IArgdownConfigLoader } from "../IArgdownConfigLoader";

export const nodeConfigLoader: IArgdownConfigLoader = async (
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
  const extName = Utils.extname(configPath);
  if (extName === ".json") {
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
  } else if (extName === ".js" && configPath.scheme === "file") {
    // For Js config files we have to use loadJSFile which is synchronous
    try {
      const jsModuleExports = loadJSFile(configPath.fsPath);

      if (
        jsModuleExports &&
        typeof jsModuleExports === "object" &&
        "config" in jsModuleExports
      ) {
        return (jsModuleExports as { config: unknown }).config;
      } else {
        // let's try the default export
        return jsModuleExports;
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.log(
          "verbose",
          "[AsyncArgdownApplication]: No config found: " + e.toString()
        );
      }
    }
  }
  return {};
};
/**
 * Taken from eslint: https://github.com/eslint/eslint/blob/master/lib/config/config-file.js
 * Loads a JavaScript configuration from a file.
 * @param {string} filePath The filename to load.
 * @returns {Object} The configuration object from the file.
 * @throws {Error} If the file cannot be read.
 * @private
 */
const loadJSFile = (filePath: string): unknown => {
  try {
    return importFresh(filePath);
  } catch (e) {
    if (e instanceof Error) {
      e.message = `Cannot read file: ${filePath}\nError: ${e.message}`;
    }
    throw e;
  }
};
