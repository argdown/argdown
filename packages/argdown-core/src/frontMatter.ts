import * as yaml from "js-yaml";
import defaultsDeep from "lodash.defaultsdeep";
import merge from "lodash.merge";
import { IArgdownRequest } from "./index.js";
import { isObject } from "./utils.js";

export type FrontMatterSettingsMode = "ignore" | "default" | "priority";

const frontMatterPattern =
  /^[\s\r\n]*(={3,})[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*\1[ \t]*(?:\r?\n|$)/;

/**
 * Replaces leading frontmatter characters with spaces while preserving line
 * endings. Parsers that do not have a frontmatter token can therefore ignore
 * the block without shifting diagnostic and source-occurrence locations.
 */
export const maskFrontMatter = (input: string): string => {
  const match = frontMatterPattern.exec(input);
  if (!match) return input;
  const masked = match[0].replace(/[^\r\n]/g, " ");
  return masked + input.slice(match[0].length);
};

/**
 * Parses and applies document frontmatter before any processor is prepared.
 * This is intentionally independent of the AST so parser/model configuration
 * can affect the same run in which it is declared.
 */
export const applyFrontMatterSettings = (request: IArgdownRequest): unknown => {
  if (!request.input) return undefined;
  const match = frontMatterPattern.exec(request.input);
  if (!match) return undefined;

  const data = yaml.load(match[2]);
  if (!data || !isObject(data)) return data;

  const configuredMode =
    request.data &&
    (request.data as { frontMatterSettingsMode?: FrontMatterSettingsMode })
      .frontMatterSettingsMode;
  const mode = configuredMode || "priority";
  if (mode === "default") {
    defaultsDeep(request, data);
  } else if (mode !== "ignore") {
    merge(request, data);
  }
  return data;
};
