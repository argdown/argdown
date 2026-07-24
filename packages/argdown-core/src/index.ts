"use strict";
import { IArgdownLogger } from "./IArgdownLogger.js";

/**
 * IProcess objects are IArgdownRequest objects with a mandatory process field.
 * They can not contain processes themselves.
 *
 * In all other respects they are identical to IArgdownRequests.
 */
export interface IProcess extends IArgdownRequest {
  /**
   * A list of processors to be run or a name of a built-in process (like "export-svg").
   */
  process: string[] | string;
  /**
   * Processes can currently not contain definitions of other processes
   */
  processes: undefined;
}

// Exporting interfaces here that are meant to be augmented by external plugins
export interface IArgdownRequest {
  title?: string;
  subTitle?: string;
  abstract?: string;
  author?: string | string[];
  date?: string;
  /**
   * The Argdown input that should be parsed.
   */
  input?: string;
  /**
   * If an array is used: the processors that should be executed in order by the [[ArgdownApplication]] during the current run.
   *
   * If a string is used: the name of the process to be found in [[IArgdownRequest.processes]]. ArgdownApplication will then try to run the processors defined in that process.
   */
  process?: string[] | string;
  /**
   * A dictionary of processes that can be run by using `run({process: "processName", input: ..., processes: ...})`.
   *
   * Keys are the process names, values are [[IProcess]] objects.
   */
  processes?: { [name: string]: IProcess };
  /**
   * Set to "verbose" to get a lot of infos.
   */
  logLevel?: string;
  /**
   * Should the application throw exceptions from plugins?
   */
  throwExceptions?: boolean;
  /**
   * Should exceptions thrown by plugins be logged?
   */
  logExceptions?: boolean;
  logger?: IArgdownLogger;
}

export interface IArgdownResponse {
  /**
   * Errors thrown by plugins.
   *
   * Provided by any plugin throwing an exception.
   */
  exceptions?: Error[];
}
export interface ISelectionSettings {
  /**
   * Can be used to only select arguments and statements with certain tags
   */
  selectedTags?: string[];
  /**
   * Should arguments and statements without tags be excluded from the selection?
   * This is only relevant, if [[ISelectionSettings.selectedTags]] is used.
   */
  selectElementsWithoutTag?: boolean;
  /**
   *
   * A list of headings that can be used to only selected arguments and statements from certain sections in the texts.
   */
  selectedSections?: string[];
  /**
   * Should arguments and statements that are defined under no heading be excluded from the selection?
   * This is only relevant if [[ISelectionSettings.selectedSections]] is used.
   */
  selectElementsWithoutSection?: boolean;
  // /**
  //  * Allows to select all elements within a maximum distance of a selected element.
  //  *
  //  * Use [[ISelectionSettings.selectNeighbourhood.maxDistance]] to set the maximum distance.
  //  */
  // selectNeighbourhood?: {
  //   /**
  //    * the title of the selected element
  //    */
  //   element?: string;
  //   /**
  //    * The type of the selected element. Can be either [[ArgdownTypes.ARGUMENT]] or [[ArgdownTypes.EQUIVALENCE_CLASS]]
  //    */
  //   elementType?: ArgdownTypes.ARGUMENT | ArgdownTypes.EQUIVALENCE_CLASS;
  //   /**
  //    * If [[ISelectionSettings.selectNeighbourhood.selectedElement]] is set, minimum number of edges between the selectedElement and any other element are calculated.
  //    *
  //    * The maxDistance determines which elements will be preselected. If the minimum number of edges between the selected element and another element is higher than maxDistance, the other element will be excluded.
  //    *
  //    * Default is 2.
  //    */
  //   maxDistance?: number;
  // };
  /**
   * Titles of statements that should be represented as nodes in the map.
   *
   * This does not automatically exclude all other statements from being put into the map as nodes.
   * It works similarly to using the isInMap:true flag for the included statements.
   * Which other statements are selected depends on the other selection methods used.
   */
  includeStatements?: string[];
  /**
   * Titles of statements that should be excluded from the map.
   */
  excludeStatements?: string[];
  /**
   * Titles of arguments that should not be in the map.
   */
  excludeArguments?: string[];
  /**
   * If true, the isInMap data flag is ignored.
   */
  ignoreIsInMap?: boolean;
}

//export { tokenize } from "./lexer";
export * from "./lexer.js";
export { tokenMatcher } from "chevrotain";
export * from "./RuleNames.js";
export * from "./TokenNames.js";
export * from "./parser.js";
export * from "./ArgdownTreeWalker.js";
export * from "./ArgdownApplication.js";
export * from "./argdown.js";
export * from "./Logger.js";
export * from "./plugins/ModelPlugin.js";
export * from "./plugins/ParserPlugin.js";
export * from "./plugins/DataPlugin.js";
export * from "./plugins/RegroupPlugin.js";
export * from "./plugins/ClosedGroupPlugin.js";
export * from "./plugins/ColorPlugin.js";
export * from "./plugins/HtmlExportPlugin.js";
export * from "./plugins/PreselectionPlugin.js";
export * from "./plugins/ArgumentSelectionPlugin.js";
export * from "./plugins/StatementSelectionPlugin.js";
export * from "./plugins/MapPlugin.js";
export * from "./plugins/GroupPlugin.js";
export * from "./plugins/JSONExportPlugin.js";
export * from "./plugins/DotExportPlugin.js";
export * from "./plugins/GraphMLExportPlugin.js";
export * from "./plugins/HighlightSourcePlugin.js";
export * from "./plugins/WebComponentExportPlugin.js";
export * from "./plugins/ExplodeArgumentsPlugin.js";
export * from "./plugins/MapNodeImagesPlugin.js";
export * from "./plugins/SyncDotToSvgExportPlugin.js";
export * from "./plugins/SaysWhoPlugin.js";
export * from "./plugins/shortcodes.js";
export * from "./IArgdownPlugin.js";
export * from "./IArgdownLogger.js";
export * from "./ArgdownPluginError.js";
export * from "./model/model.js";
export * from "./model/toJSON.js";
export * from "./utils.js";
export * from "./deriveImplicitRelations.js";
export * from "./plugins/IncludePositionsPlugin.js"
