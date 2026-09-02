import { tokenMatcher } from "chevrotain";
import * as argdownLexer from "./../lexer.js";
import { IArgdownPlugin, IRequestHandler } from "../IArgdownPlugin.js";
import { IRuleNodeHandler, ITokenNodeHandler } from "../ArgdownTreeWalker.js";
import {
  ArgdownPluginError,
  checkResponseFields
} from "../ArgdownPluginError.js";
import { IArgdownRequest, IArgdownResponse } from "../index.js";
import defaultsDeep from "lodash.defaultsdeep";
import last from "lodash.last";
import union from "lodash.union";
import merge from "lodash.merge";
import {
  IEquivalenceClass,
  ArgdownTypes,
  IConclusion,
  IArgument,
  RelationType,
  IStatement,
  IInference,
  IRange,
  IRelation,
  IRuleNode,
  ISection,
  RelationMember,
  StatementRole,
  ITokenNode,
  IPCSStatement,
  RangeType,
  DiscussionPointType,
  isReconstructed,
  isRuleNode,
  isTokenNode,
  IArgumentDescription,
  IDiscussionPoint,
  IExcerpt
} from "../model/model.js";
import { RuleNames } from "../RuleNames.js";
import { TokenNames } from "../TokenNames.js";
import {
  stringToClassName,
  isObject,
  mergeDefaults,
  ensure,
  DefaultSettings
} from "../utils.js";
import { other } from "../utils.js";
import { ISpecialCharacterDictionary, shortcodes } from "./shortcodes.js";
import { addDiagnostic } from "../diagnostics.js";

export interface ITagData {
  tag: string;
  cssClass?: string;
  color?: string;
  occurrenceIndex?: number;
  priority?: number;
}
export enum InterpretationModes {
  LOOSE = "loose",
  STRICT = "strict"
}

export interface IModelPluginSettings {
  mode?: InterpretationModes;
  removeTagsFromText?: boolean;
  transformArgumentRelations?: boolean;
  shortcodes?: ISpecialCharacterDictionary;
  explodeArguments?: boolean;
}
declare module "../index.js" {
  interface IArgdownRequest {
    /**
     * Settings for the [[ModelPlugin]]
     **/
    model?: IModelPluginSettings;
  }
  interface IArgdownResponse {
    /**
     * Unified discussion point index.
     * Keys are canonical DP keys: `[ID]`, `[?ID]`, `[@ID]`, `<ID>`.
     *
     * Provided by the [[ModelPlugin]]
     */
    discussionPoints?: { [key: string]: IDiscussionPoint };
    /** Exact Excerpt text artifacts, keyed by explicit or generated identifier. */
    excerpts?: { [title: string]: IExcerpt };
    /**
     * A dictionary of all arguments defined in the Argdown input.
     * The keys are the argument titles. The values are [[Argument]] objects.
     *
     * Provided by the [[ModelPlugin]]
     */
    arguments?: { [title: string]: IArgument };
    /**
     * A dictionary of all statement equivalence classes defined in the Argdown input.
     * The keys are statement titles. The values are [[EquivalenceClass]] objects.
     *
     * The actual [[Statement]] objects are stored in the [[EquivalenceClass.members]] array.
     *
     * Provided by the [[ModelPlugin]]
     */
    statements?: { [title: string]: IEquivalenceClass };
    /**
     * A list of all relations defined in the Argdown input.
     *
     * Provided by the [[ModelPlugin]]
     */
    relations?: IRelation[];
    /**
     * A tree structure of all sections defined in the Argdown input.
     *
     * Provided by the [[ModelPlugin]]
     */
    sections?: ISection[];
    maxSectionLevel?: number;
    /**
     * All tags used augmented by additional data
     *
     * Provided by the [[ModelPlugin]]
     *
     * Color is provided by the [[ColorPlugin]]
     */
    tags?: { [tagName: string]: ITagData };
  }
}
const defaultSettings: DefaultSettings<IModelPluginSettings> = {
  mode: InterpretationModes.LOOSE,
  removeTagsFromText: false,
  transformArgumentRelations: true,
  shortcodes: ensure.object<ISpecialCharacterDictionary>(shortcodes)
};
/**
 * The ModelPlugin builds the basic data model from the abstract syntax tree (AST) in the [[IArgdownResponse.ast]] response property that is provided by the [[ParserPlugin]].
 * This includes the following response object properties:
 *
 *  - [[IArgdownResponse.statements]]
 *  - [[IArgdownResponse.arguments]]
 *  - [[IArgdownResponse.relations]]
 *  - [[IArgdownResponse.sections]]
 *
 * Most of the other plugins depend on the data produced by this plugin. Whenever possible plugins should use the
 * data processed by this plugin instead of working with the AST nodes directly.
 *
 * depends on data from: [[ParserPlugin]]
 */
export class ModelPlugin implements IArgdownPlugin {
  name: string = "ModelPlugin";
  defaults: IModelPluginSettings = {};
  ruleListeners: { [eventId: string]: IRuleNodeHandler };
  tokenListeners: { [eventId: string]: ITokenNodeHandler };
  getSettings = (request: IArgdownRequest) => {
    if (!isObject(request.model)) {
      request.model = {};
    }
    return request.model;
  };
  prepare: IRequestHandler = (request, response) => {
    const explicitlyLoose =
      request.parser &&
      (request.parser.syntax === "argdown+" ||
        request.parser.syntax === "micro-argdown+") &&
      request.model &&
      request.model.mode === InterpretationModes.LOOSE;
    mergeDefaults(this.getSettings(request), this.defaults);
    if (
      request.parser &&
      (request.parser.syntax === "argdown+" ||
        request.parser.syntax === "micro-argdown+")
    ) {
      if (explicitlyLoose) {
        addDiagnostic(response, {
          code: "adp-loose-mode-ignored",
          severity: "warning",
          source: "ModelPlugin",
          message:
            "Argdown+ requires strict model semantics; the explicitly requested loose mode was ignored."
        });
      }
      // ADP conformance is strict by definition.
      this.getSettings(request).mode = InterpretationModes.STRICT;
      // ADP keeps argument nodes and relations explicit.
      this.getSettings(request).transformArgumentRelations = false;
    }
  };
  /**
   * Transforms outgoing relations of arguments with an assigned pcs into outgoing relations of the pcs's main conclusion.
   * Transforms incoming undercut relations of arguments with an assigned pcs into undercut relations of the pcs's last inference.
   */
  transformArgumentRelations = (response: IArgdownResponse) => {
    const newRelations: IRelation[] = [];
    for (const relation of response.relations!) {
      let addRelation = true;
      if (!relation.from) {
        throw new ArgdownPluginError(
          this.name,
          "missing-relation-source",
          "Relation without source."
        );
      }
      if (!relation.to) {
        throw new ArgdownPluginError(
          this.name,
          "missing-relation-target",
          "Relation without target."
        );
      }
      const fromIsReconstructedArgument =
        relation.from.type === ArgdownTypes.ARGUMENT &&
        isReconstructed(relation.from);
      const toIsReconstructedArgument =
        relation.to.type === ArgdownTypes.ARGUMENT &&
        isReconstructed(relation.to);

      // For reconstructed arguments: change outgoing argument relations
      // to outgoing relations of the main conclusion, removing duplicates
      if (fromIsReconstructedArgument) {
        //change relation.from to point to the argument's conclusion
        const argument = <IArgument>relation.from;

        //remove from argument
        this.removeRelationFromSource(relation);

        const conclusionStatement = argument.pcs[argument.pcs.length - 1];
        const equivalenceClass =
          response.statements![conclusionStatement.title!];
        //change to relation of main conclusion
        relation.from = equivalenceClass;

        //check if this relation already exists
        let relationExists = false;
        for (const existingRelation of equivalenceClass.relations!) {
          if (
            relation.to == existingRelation.to &&
            relation.relationType === existingRelation.relationType
          ) {
            relationExists = true;
            existingRelation.occurrences.push(...relation.occurrences);
            break;
          }
        }
        if (!relationExists) {
          equivalenceClass.relations!.push(relation);
        } else {
          //remove relation from target
          this.removeRelationFromTarget(relation);
          addRelation = false;
        }
      }
      // For reconstructed arguments: change incoming undercut relations
      // to incoming relations of last inference, removing duplicates
      if (
        toIsReconstructedArgument &&
        relation.relationType === RelationType.UNDERCUT
      ) {
        const argument = <IArgument>relation.to;
        const inference = (<IConclusion>last(argument.pcs)!).inference!;
        relation.to = inference;
        // remove relation from argument
        this.removeRelationFromTarget(relation);

        let relationExists = false;
        for (const existingRelation of inference.relations!) {
          if (
            relation.from == existingRelation.from &&
            relation.relationType === existingRelation.relationType
          ) {
            relationExists = true;
            existingRelation.occurrences.push(...relation.occurrences);
            break;
          }
        }
        if (!relationExists) {
          inference.relations!.push(relation);
        } else {
          //remove relation from source
          this.removeRelationFromSource(relation);
          //remove relation from relations
          addRelation = false;
        }
      }
      if (addRelation) {
        newRelations.push(relation);
      }
    }
    response.relations = newRelations;
  };
  /**
   * Change dialectical types of statement-to-statement relations to semantic types.
   * Support relations become entails relations.
   * Attack relations become contrary relations.
   * Equivalent contrary relations are merged (e.g. [A] - [B] and [B] - [A]).
   */
  transformStatementRelations = (response: IArgdownResponse) => {
    const newRelations: IRelation[] = [];
    for (const relation of response.relations!) {
      let addRelation = true;
      const isS2SRelation =
        relation.from!.type === ArgdownTypes.EQUIVALENCE_CLASS &&
        relation.to!.type === ArgdownTypes.EQUIVALENCE_CLASS;
      if (isS2SRelation) {
        if (relation.relationType === RelationType.SUPPORT) {
          relation.relationType = RelationType.ENTAILS;
        } else if (relation.relationType === RelationType.ATTACK) {
          const relationExists = relation.from!.relations!.find((r) => {
            return (
              r.relationType === RelationType.CONTRARY &&
              ((r.from === relation.from && r.to === relation.to) ||
                (r.from === relation.to && r.to === relation.from))
            );
          });
          if (relationExists !== undefined) {
            this.removeRelationFromSource(relation);
            this.removeRelationFromTarget(relation);
            addRelation = false;
          } else {
            relation.relationType = RelationType.CONTRARY;
          }
        }
      }
      if (addRelation) {
        newRelations.push(relation);
      }
    }
    response.relations = newRelations;
  };
  removeRelationFromSource = (relation: IRelation) => {
    const indexSource = relation.from!.relations!.indexOf(relation);
    relation.from!.relations!.splice(indexSource, 1);
  };
  removeRelationFromTarget = (relation: IRelation) => {
    //remove relation from target
    const indexTarget = relation.to!.relations!.indexOf(relation);
    relation.to!.relations!.splice(indexTarget, 1);
  };
  /**
   * Removes redundant ec2a attack relations that can be inferred from
   * existing ec2ec attack/contrary/contradiction relations
   */
  removeRedundantEC2ARelations = (response: IArgdownResponse) => {
    const newRelations: IRelation[] = [];
    for (const relation of response.relations!) {
      if (
        relation.from!.type !== ArgdownTypes.EQUIVALENCE_CLASS ||
        relation.relationType !== RelationType.ATTACK ||
        relation.to!.type !== ArgdownTypes.ARGUMENT
      ) {
        newRelations.push(relation);
        continue;
      }
      const argument = relation.to!;
      if (!argument.pcs) {
        newRelations.push(relation);
        continue;
      }
      const ec = relation.from as IEquivalenceClass;
      const ec2ecRelation = ec.relations!.find(
        (otherRelation) =>
          other(otherRelation, ec).type === ArgdownTypes.EQUIVALENCE_CLASS &&
          ((otherRelation.relationType === RelationType.ATTACK &&
            otherRelation.from === ec) ||
            otherRelation.relationType === RelationType.CONTRADICTORY ||
            otherRelation.relationType === RelationType.CONTRARY) &&
          !!argument.pcs.find(
            (s) =>
              s.title === other(otherRelation, ec).title &&
              s.role === StatementRole.PREMISE
          )
      );
      if (ec2ecRelation) {
        // relation is redundant, we have to remove it
        this.removeRelationFromSource(relation);
        this.removeRelationFromTarget(relation);
        ec2ecRelation.occurrences.push(...relation.occurrences);
        continue;
      } else {
        newRelations.push(relation);
        continue;
      }
    }
    response.relations = newRelations;
  };
  assignSectionOfFirstMemberIfWithoutSection = (
    node: IArgument | IEquivalenceClass
  ) => {
    if (!node.section && node.members && node.members.length > 0) {
      node.section = node.members[0].section;
    }
  };
  getDiscussionPointKey = (dp: IArgument | IEquivalenceClass): string => {
    if (dp.type === ArgdownTypes.ARGUMENT) {
      return `<${dp.title}>`;
    }
    const dpType = dp.discussionPointType || DiscussionPointType.STATEMENT;
    if (dpType === DiscussionPointType.QUESTION) {
      return `[?${dp.title}]`;
    }
    if (dpType === DiscussionPointType.REFERENCE) {
      return `[@${dp.title}]`;
    }
    if (dpType === DiscussionPointType.EXCERPT) {
      return `[>${dp.title}]`;
    }
    return `[${dp.title}]`;
  };
  buildDiscussionPoints = (response: IArgdownResponse) => {
    const discussionPoints: { [key: string]: IDiscussionPoint } = {};
    const excerpts: { [key: string]: IExcerpt } = {};
    for (const statement of Object.values(response.statements!)) {
      if (statement.discussionPointType === DiscussionPointType.EXCERPT) {
        const excerpt = statement as IExcerpt;
        excerpt.entityKind = "text-artifact";
        excerpts[excerpt.title!] = excerpt;
      } else {
        statement.entityKind = "discussion-point";
        discussionPoints[this.getDiscussionPointKey(statement)] =
          statement as IDiscussionPoint;
      }
    }
    for (const argument of Object.values(response.arguments!)) {
      argument.entityKind = "discussion-point";
      discussionPoints[this.getDiscussionPointKey(argument)] = argument;
    }
    response.discussionPoints = discussionPoints;
    response.excerpts = excerpts;
  };
  finalizeArgdownPlusDiscussionPoints = (response: IArgdownResponse) => {
    for (const discussionPoint of Object.values(response.discussionPoints!)) {
      const definitions = (discussionPoint.members || []).filter(
        (member) =>
          !member.isReference &&
          member.role !== StatementRole.RELATION_STATEMENT
      );
      discussionPoint.definitionOccurrences = definitions;
      const canonical = definitions.find(
        (member) => member.text !== undefined && member.text.trim().length > 0
      );
      discussionPoint.canonicalMember = canonical;
      discussionPoint.canonicalText = canonical && canonical.text;
      if (!canonical || canonical.text === undefined) continue;
      for (const alternate of definitions) {
        if (
          alternate !== canonical &&
          alternate.text !== undefined &&
          alternate.text.trim().length > 0 &&
          alternate.text !== canonical.text
        ) {
          addDiagnostic(
            response,
            {
              code: "adp-competing-context-free-text",
              severity: "warning",
              source: "ModelPlugin",
              message: `Discussion point '${discussionPoint.title}' has competing context-free text; the first non-empty root definition remains canonical.`
            },
            alternate
          );
        }
      }
    }
    const excerptsByText = new Map<string, IExcerpt>();
    let mergedExcerptAliases = false;
    for (const excerpt of Object.values(response.excerpts || {})) {
      const definitions = (excerpt.members || []).filter(
        (member) => !member.isReference && member.text !== undefined
      );
      excerpt.definitionOccurrences = definitions;
      const canonical = definitions.find((member) => member.text !== undefined);
      excerpt.canonicalMember = canonical;
      excerpt.canonicalText = canonical && canonical.text;
      excerpt.normalizedText =
        canonical && canonical.text !== undefined
          ? canonical.text.replace(/\r\n?|\n/g, "\n").replace(/\n$/, "")
          : undefined;
      for (const alternate of definitions) {
        if (alternate === canonical || alternate.text === undefined) continue;
        const normalized = alternate.text
          .replace(/\r\n?|\n/g, "\n")
          .replace(/\n$/, "");
        if (normalized !== excerpt.normalizedText) {
          throw new ArgdownPluginError(
            this.name,
            "adp-excerpt-definition-conflict",
            `Excerpt '${excerpt.title}' is defined with different exact text.`
          );
        }
      }
      if (excerpt.normalizedText === undefined) continue;
      const sameText = excerptsByText.get(excerpt.normalizedText);
      if (sameText && sameText !== excerpt) {
        sameText.aliases = union(sameText.aliases || [], [excerpt.title!]);
        excerpt.aliases = union(excerpt.aliases || [], [sameText.title!]);
        for (const member of excerpt.members || []) {
          if (sameText.members.indexOf(member) === -1)
            sameText.members.push(member);
        }
        for (const relation of response.relations || []) {
          if (relation.from === excerpt) relation.from = sameText;
          if (relation.to === excerpt) relation.to = sameText;
        }
        response.excerpts![excerpt.title!] = sameText;
        mergedExcerptAliases = true;
        addDiagnostic(
          response,
          {
            code: "adp-duplicate-excerpt-alias",
            severity: "information",
            source: "ModelPlugin",
            message: `Excerpt identifiers '${sameText.title}' and '${excerpt.title}' name identical exact text.`
          },
          canonical
        );
      } else {
        excerptsByText.set(excerpt.normalizedText, excerpt);
      }
    }
    if (mergedExcerptAliases) {
      const deduplicated: IRelation[] = [];
      for (const relation of response.relations || []) {
        const duplicate = deduplicated.find(
          (existing) =>
            existing.relationType === relation.relationType &&
            ((existing.from === relation.from && existing.to === relation.to) ||
              (IRelation.isSymmetric(existing) &&
                existing.from === relation.to &&
                existing.to === relation.from))
        );
        if (duplicate) duplicate.occurrences.push(...relation.occurrences);
        else deduplicated.push(relation);
      }
      response.relations = deduplicated;
      const entities = new Set<IArgument | IEquivalenceClass>([
        ...Object.values(response.discussionPoints || {}),
        ...Object.values(response.excerpts || {})
      ]);
      for (const entity of entities) entity.relations = [];
      for (const relation of deduplicated) {
        if (relation.from && relation.from.type !== ArgdownTypes.INFERENCE) {
          relation.from.relations!.push(relation);
        }
        if (relation.to && relation.to.type !== ArgdownTypes.INFERENCE) {
          relation.to.relations!.push(relation);
        }
      }
    }
  };
  validateArgdownPlusExcerptSelections = (response: IArgdownResponse) => {
    const normalizeSelection = (text: string): string =>
      text
        .replace(/\r\n?|\n/g, "\n")
        .replace(/\s+/g, " ")
        .trim();
    for (const relation of response.relations || []) {
      for (const occurrence of relation.occurrences || []) {
        if (occurrence.contextualText === undefined) continue;
        const endpoint =
          occurrence.contextualizedEndpoint === "from"
            ? relation.from
            : relation.to;
        if (
          !endpoint ||
          endpoint.type !== ArgdownTypes.EQUIVALENCE_CLASS ||
          endpoint.discussionPointType !== DiscussionPointType.EXCERPT
        ) {
          continue;
        }
        if (relation.relationType !== RelationType.IS_CITED_BY) {
          throw new ArgdownPluginError(
            this.name,
            "adp-invalid-excerpt-relation",
            "Contextual Excerpt text is only valid on a citation relation."
          );
        }
        const excerpt = endpoint as IExcerpt;
        if (excerpt.normalizedText === undefined) {
          throw new ArgdownPluginError(
            this.name,
            "adp-excerpt-context-without-root",
            `Contextual selection for Excerpt '${excerpt.title}' requires a complete root-level definition.`
          );
        }
        const fullText = normalizeSelection(excerpt.normalizedText);
        const selection = normalizeSelection(occurrence.contextualText);
        if (selection && !fullText.includes(selection)) {
          addDiagnostic(
            response,
            {
              code: "adp-excerpt-selection-mismatch",
              severity: "warning",
              source: "ModelPlugin",
              message: `Contextual selection for Excerpt '${excerpt.title}' was not found in its complete text after whitespace normalization.`
            },
            occurrence
          );
        }
      }
    }
  };
  deriveCompatibilityViews = (
    response: IArgdownResponse,
    preferredStatementOrder: string[] = [],
    preferredArgumentOrder: string[] = []
  ) => {
    const statements: { [title: string]: IEquivalenceClass } = {};
    const argumentsMap: { [title: string]: IArgument } = {};
    const discussionPoints = Object.values(response.discussionPoints!);
    const excerpts = Object.values(response.excerpts || {});
    for (const title of preferredStatementOrder) {
      const discussionPoint = discussionPoints.find(
        (item) =>
          item.type === ArgdownTypes.EQUIVALENCE_CLASS && item.title === title
      ) as IEquivalenceClass | undefined;
      const excerpt = excerpts.find((item) => item.title === title);
      if (discussionPoint || excerpt) {
        statements[title] = discussionPoint || excerpt!;
      }
    }
    for (const title of preferredArgumentOrder) {
      const discussionPoint = discussionPoints.find(
        (item) => item.type === ArgdownTypes.ARGUMENT && item.title === title
      ) as IArgument | undefined;
      if (discussionPoint) argumentsMap[title] = discussionPoint;
    }
    for (const discussionPoint of discussionPoints) {
      if (discussionPoint.type === ArgdownTypes.ARGUMENT) {
        if (!argumentsMap[discussionPoint.title!]) {
          argumentsMap[discussionPoint.title!] = discussionPoint;
        }
      } else {
        if (!statements[discussionPoint.title!]) {
          statements[discussionPoint.title!] = discussionPoint;
        }
      }
    }
    for (const excerpt of excerpts) {
      if (!statements[excerpt.title!]) statements[excerpt.title!] = excerpt;
    }
    response.statements = statements;
    response.arguments = argumentsMap;
  };
  run: IRequestHandler = (request, response) => {
    checkResponseFields(this, response, [
      "ast",
      "statements",
      "arguments",
      "relations"
    ]);

    const preferredStatementOrder = Object.keys(response.statements!);
    const preferredArgumentOrder = Object.keys(response.arguments!);
    // If an equivalence class has no definition as a member, we use the first reference's section
    for (const ec of Object.values(response.statements!)) {
      this.assignSectionOfFirstMemberIfWithoutSection(ec);
    }
    // If an argument has neither a pcs nor a description, we use the first reference's section
    for (const argument of Object.values(response.arguments!)) {
      this.assignSectionOfFirstMemberIfWithoutSection(argument);
    }
    const settings = this.getSettings(request);
    if (settings.transformArgumentRelations) {
      this.transformArgumentRelations(response);
    }
    if (settings.mode === InterpretationModes.STRICT) {
      this.transformStatementRelations(response);
    }
    this.removeRedundantEC2ARelations(response);
    this.buildDiscussionPoints(response);
    if (request.parser && request.parser.syntax === "argdown+") {
      this.finalizeArgdownPlusDiscussionPoints(response);
      this.validateArgdownPlusExcerptSelections(response);
    }
    this.deriveCompatibilityViews(
      response,
      preferredStatementOrder,
      preferredArgumentOrder
    );
    return response;
  };
  constructor(config?: IModelPluginSettings) {
    this.defaults = defaultsDeep({}, config, defaultSettings);
    this.name = "ModelPlugin";
    const statementReferencePattern = /^\[(.+)\]$/;
    const statementDefinitionPattern = /^\[(.+)\]:$/;
    const statementMentionPattern = /^@\[(.+)\](\s?)$/;
    const argumentReferencePattern = /<(.+)>/;
    const argumentDefinitionPattern = /<(.+)>:/;
    const argumentMentionPattern = /@<(.+)>(\s?)/;
    // const statementReferenceByNumberPattern = /\<(.+)\>\((.+)\)/;
    // const statementDefinitionByNumberPattern = /\<(.+)\>\((.+)\)\:/;
    // const statementMentionByNumberPattern = /\@\<(.+)\>\((.+)\)/;
    const linkPattern = /\[(.+)\]\((.+)\)/;
    const tagPattern =
      /#(?:\(([^)]+)\)|([a-zA-z0-9-\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+))/;

    let uniqueTitleCounter = 0;
    function getUniqueTitle() {
      uniqueTitleCounter++;
      return "Untitled " + uniqueTitleCounter;
    }

    let currentStatement: IStatement | null = null;
    let currentRelationParent: IArgument | IStatement | IInference | null =
      null;
    let currentArgument: IArgument | null = null;
    let currentPCS: IArgument | null = null;
    let currentInference: IInference | null = null;
    let rangesStack: IRange[] = [];
    let relationParentsStack: RelationMember[] = [];
    let currentRelation: IRelation | null = null;
    let currentHeading: IRuleNode | null = null;
    let currentSection: ISection | null = null;
    let sectionCounter = 0;
    let tagCounter = 0;
    let inBlock = false;
    let discussionPointTypes: { [title: string]: DiscussionPointType } = {};
    const isArgdownPlusMode = (request: IArgdownRequest) =>
      request.parser &&
      (request.parser.syntax === "argdown+" ||
        request.parser.syntax === "micro-argdown+");
    const parseStatementIdentifier = (
      rawId: string
    ): { title: string; discussionPointType: DiscussionPointType } => {
      if (!rawId || rawId.length === 0) {
        return {
          title: rawId,
          discussionPointType: DiscussionPointType.STATEMENT
        };
      }
      if (rawId[0] === "!") {
        return {
          title: rawId.substring(1),
          discussionPointType: DiscussionPointType.STATEMENT
        };
      }
      if (rawId[0] === "?") {
        return {
          title: rawId.substring(1),
          discussionPointType: DiscussionPointType.QUESTION
        };
      }
      if (rawId[0] === "@") {
        return {
          title: rawId.substring(1),
          discussionPointType: DiscussionPointType.REFERENCE
        };
      }
      if (rawId[0] === ">") {
        return {
          title: rawId.substring(1),
          discussionPointType: DiscussionPointType.EXCERPT
        };
      }
      return {
        title: rawId,
        discussionPointType: DiscussionPointType.STATEMENT
      };
    };
    const normalizeBlockContent = (rawText: string): string => {
      const withoutLeadingNewline = rawText.replace(
        /^[ \t]*(?:\r\n|\n|\r)/,
        ""
      );
      const lines = withoutLeadingNewline.split(/\r\n|\n|\r/);
      if (lines.length > 0 && lines[lines.length - 1] === "") {
        lines.pop();
      }
      let minIndent: number | null = null;
      for (const line of lines) {
        if (line.trim().length === 0) {
          continue;
        }
        const indent = line.match(/^[ \t]*/);
        const indentLength = indent ? indent[0].length : 0;
        if (minIndent === null || indentLength < minIndent) {
          minIndent = indentLength;
        }
      }
      if (minIndent === null || minIndent <= 0) {
        return lines.join("\n");
      }
      const dedented = lines.map((line) => {
        if (line.trim().length === 0) {
          return "";
        }
        return line.substring(minIndent);
      });
      return dedented.join("\n");
    };
    const getStatementContentNode = (node: IRuleNode): IRuleNode | null => {
      if (!node.children) {
        return null;
      }
      for (const child of node.children) {
        if (isRuleNode(child) && child.name === RuleNames.STATEMENT_CONTENT) {
          return child;
        }
        if (
          isRuleNode(child) &&
          child.name === RuleNames.STATEMENT_DEFINITION &&
          child.children
        ) {
          const statementContentChild = child.children.find(
            (nested) =>
              isRuleNode(nested) && nested.name === RuleNames.STATEMENT_CONTENT
          );
          if (statementContentChild && isRuleNode(statementContentChild)) {
            return statementContentChild;
          }
        }
      }
      return null;
    };
    const hasMultilineStatementContent = (
      statementContentNode: IRuleNode | null
    ): boolean => {
      if (!statementContentNode || !statementContentNode.children) {
        return false;
      }
      const children = statementContentNode.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isTokenNode(child) && tokenMatcher(child, argdownLexer.Newline)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (
              !(isTokenNode(next) && tokenMatcher(next, argdownLexer.Newline))
            ) {
              return true;
            }
          }
        }
      }
      return false;
    };
    const setOrValidateDiscussionPointType = (
      request: IArgdownRequest,
      title: string,
      discussionPointType: DiscussionPointType
    ) => {
      const existing = discussionPointTypes[title];
      if (
        existing &&
        existing !== discussionPointType &&
        isArgdownPlusMode(request)
      ) {
        throw new ArgdownPluginError(
          this.name,
          "discussion-point-type-conflict",
          `Type conflict for discussion point '${title}': '${existing}' vs '${discussionPointType}'.`
        );
      }
      if (!existing) {
        discussionPointTypes[title] = discussionPointType;
      }
    };
    const getDiscussionPointTypeOfRelationMember = (
      member: RelationMember
    ): DiscussionPointType | null => {
      if (member.type === ArgdownTypes.ARGUMENT) {
        return DiscussionPointType.ARGUMENT;
      }
      if (member.type === ArgdownTypes.EQUIVALENCE_CLASS) {
        return (
          member.discussionPointType ||
          discussionPointTypes[member.title!] ||
          null
        );
      }
      return null;
    };
    const isDiscussionPointType = (
      dpType: DiscussionPointType | null
    ): boolean =>
      dpType === DiscussionPointType.ARGUMENT ||
      dpType === DiscussionPointType.STATEMENT ||
      dpType === DiscussionPointType.QUESTION ||
      dpType === DiscussionPointType.REFERENCE;
    const validateArgdownPlusRelationType = (
      relation: IRelation,
      request: IArgdownRequest
    ) => {
      if (!isArgdownPlusMode(request)) {
        return;
      }
      if (!relation.from || !relation.to) {
        return;
      }
      const fromType = getDiscussionPointTypeOfRelationMember(relation.from);
      const toType = getDiscussionPointTypeOfRelationMember(relation.to);
      const isStatementToStatement =
        fromType === DiscussionPointType.STATEMENT &&
        toType === DiscussionPointType.STATEMENT;
      const fail = (
        msg: string,
        code: string = "invalid-adp-relation-type"
      ) => {
        throw new ArgdownPluginError(this.name, code, msg);
      };
      if (
        fromType === DiscussionPointType.EXCERPT ||
        toType === DiscussionPointType.EXCERPT
      ) {
        if (
          relation.relationType === RelationType.EQUAL ||
          relation.relationType === RelationType.POTENTIALLY_EQUAL
        ) {
          fail(
            "Equality relations (==,~=) do not apply to exact Excerpt artifacts.",
            "adp-excerpt-equality"
          );
        }
        if (relation.relationType !== RelationType.IS_CITED_BY) {
          fail(
            "Excerpt artifacts may only participate in citation relations.",
            "adp-invalid-excerpt-relation"
          );
        }
      }
      switch (relation.relationType) {
        case RelationType.IMPLIES:
          if (!isStatementToStatement) {
            fail("Implies (=>) requires Statement -> Statement.");
          }
          break;
        case RelationType.JUSTIFIES:
          if (
            fromType !== DiscussionPointType.ARGUMENT ||
            toType !== DiscussionPointType.STATEMENT
          ) {
            fail("Justifies (+>) requires Argument -> Statement.");
          }
          break;
        case RelationType.IS_PRESUPPOSED_BY:
          if (
            fromType !== DiscussionPointType.STATEMENT ||
            !isDiscussionPointType(toType)
          ) {
            fail(
              "isPresupposedBy (^>) requires Statement -> Discussion Point."
            );
          }
          break;
        case RelationType.CONTRADICTORY:
          if (!isStatementToStatement) {
            fail("Contradicts (><) requires Statement -> Statement.");
          }
          break;
        case RelationType.SPECIFIES:
          if (
            !(
              (fromType === DiscussionPointType.STATEMENT &&
                toType === DiscussionPointType.STATEMENT) ||
              (fromType === DiscussionPointType.QUESTION &&
                toType === DiscussionPointType.QUESTION)
            )
          ) {
            fail(
              "Specifies (:>) requires Question->Question or Statement->Statement."
            );
          }
          break;
        case RelationType.IS_EXAMPLE_FOR:
          if (!isStatementToStatement) {
            fail("isExampleFor (%>) requires Statement -> Statement.");
          }
          break;
        case RelationType.QUESTIONS:
          if (
            fromType !== DiscussionPointType.QUESTION ||
            !isDiscussionPointType(toType)
          ) {
            fail("Questions (?>) requires Question -> Discussion Point.");
          }
          break;
        case RelationType.ANSWERS:
          if (
            fromType !== DiscussionPointType.STATEMENT ||
            toType !== DiscussionPointType.QUESTION
          ) {
            fail("Answers (!>) requires Statement -> Question.");
          }
          break;
        case RelationType.IS_CITED_BY: {
          const validCitation =
            (fromType === DiscussionPointType.REFERENCE &&
              (isDiscussionPointType(toType) ||
                toType === DiscussionPointType.EXCERPT)) ||
            (fromType === DiscussionPointType.EXCERPT &&
              isDiscussionPointType(toType));
          if (!validCitation) {
            fail(
              "isCitedBy (@>) permits Reference -> DiscussionPoint/Excerpt or Excerpt -> DiscussionPoint.",
              "adp-invalid-excerpt-relation"
            );
          }
          break;
        }
        case RelationType.EQUAL:
        case RelationType.POTENTIALLY_EQUAL:
          if (
            fromType === DiscussionPointType.EXCERPT ||
            toType === DiscussionPointType.EXCERPT
          ) {
            fail(
              "Equality relations (==,~=) do not apply to exact Excerpt artifacts.",
              "adp-excerpt-equality"
            );
          }
          if (
            !isDiscussionPointType(fromType) ||
            !isDiscussionPointType(toType) ||
            fromType !== toType
          ) {
            fail(
              "Equality relations (==,~=) require matching Discussion Point types."
            );
          }
          break;
      }
    };
    const getRelationMember = (
      request: IArgdownRequest,
      response: IArgdownResponse,
      relationParent: IStatement | IInference | IArgument
    ): IArgument | IEquivalenceClass | IInference => {
      const target = relationParent;
      if (relationParent.type === ArgdownTypes.STATEMENT) {
        if (!relationParent.title) relationParent.title = getUniqueTitle();
        if (relationParent.role === StatementRole.ARGUMENT_DESCRIPTION) {
          return getArgument(
            request,
            response.arguments!,
            relationParent.title
          );
        } else {
          return getEquivalenceClass(
            request,
            response.statements!,
            relationParent.title,
            relationParent.discussionPointType
          );
        }
      } else {
        return <IArgument | IInference>target;
      }
    };
    const getArgument = (
      request: IArgdownRequest,
      argumentsDict: { [title: string]: IArgument },
      title?: string
    ): IArgument => {
      if (title) {
        currentArgument = argumentsDict[title];
      }
      if (!title || !currentArgument) {
        currentArgument = {
          type: ArgdownTypes.ARGUMENT,
          relations: [],
          members: [],
          pcs: []
        };
        if (!title) {
          currentArgument.title = getUniqueTitle();
        } else {
          currentArgument.title = title;
        }
        currentArgument.discussionPointType = DiscussionPointType.ARGUMENT;
        setOrValidateDiscussionPointType(
          request,
          currentArgument.title,
          DiscussionPointType.ARGUMENT
        );
        argumentsDict[currentArgument.title] = currentArgument;
      } else if (currentArgument.title) {
        if (!currentArgument.discussionPointType) {
          currentArgument.discussionPointType = DiscussionPointType.ARGUMENT;
        }
        setOrValidateDiscussionPointType(
          request,
          currentArgument.title,
          currentArgument.discussionPointType
        );
      }
      currentRelationParent = currentArgument;
      return currentArgument;
    };
    const addTags = (newTags: string[], object: { tags?: string[] }): void => {
      if (!object.tags) {
        object.tags = [];
      }
      object.tags = union(object.tags, newTags);
    };
    const addRelationToModel = (
      request: IArgdownRequest,
      response: IArgdownResponse,
      relationType: RelationType,
      from: RelationMember,
      to: RelationMember,
      occurrence: IRuleNode
    ): IRelation => {
      const existing = from.relations!.find((existingRelation) => {
        if (existingRelation.relationType !== relationType) {
          return false;
        }
        if (existingRelation.from === from && existingRelation.to === to) {
          return true;
        }
        return (
          IRelation.isSymmetric(existingRelation) &&
          existingRelation.from === to &&
          existingRelation.to === from
        );
      });
      if (existing) {
        existing.occurrences.push(occurrence);
        return existing;
      }
      const relation: IRelation = {
        type: ArgdownTypes.RELATION,
        relationType,
        from,
        to,
        occurrences: [occurrence]
      };
      validateArgdownPlusRelationType(relation, request);
      response.relations!.push(relation);
      from.relations!.push(relation);
      to.relations!.push(relation);
      return relation;
    };
    const onRelationExit: IRuleNodeHandler = (request, response, node) => {
      const relation = node.relation;
      if (!node.children || node.children.length < 2) {
        throw new ArgdownPluginError(
          this.name,
          "missing-ast-node-children",
          "Relation without children."
        );
      }
      const contentNode = node.children[1] as IRuleNode;
      const content = contentNode.argument || contentNode.statement;
      if (!content) {
        throw new ArgdownPluginError(
          this.name,
          "missing-ast-node-relation-member",
          "Relation member not found."
        );
      }
      const target = getRelationMember(request, response, content);
      if (relation) {
        if (relation.from) {
          relation.to = target;
          node.contextualizedEndpoint = "to";
        } else {
          relation.from = target;
          node.contextualizedEndpoint = "from";
        }
        // ADP semantic override for shared legacy '+' symbols:
        // only argument-source +> / <+ are interpreted as justifies.
        if (isArgdownPlusMode(request)) {
          const fromType = getDiscussionPointTypeOfRelationMember(
            relation.from
          );
          const toType = getDiscussionPointTypeOfRelationMember(relation.to!);
          const relationSymbol =
            isTokenNode(node.children[0]) && node.children[0].image.trim();
          if (
            relation.relationType === RelationType.ATTACK &&
            fromType === DiscussionPointType.STATEMENT &&
            toType === DiscussionPointType.STATEMENT &&
            (relationSymbol === "->" || relationSymbol === "<-")
          ) {
            addDiagnostic(
              response,
              {
                code: "adp-directed-statement-attack",
                severity: "warning",
                source: "ModelPlugin",
                message:
                  "Directed attack syntax between Statements is interpreted as symmetric contrariness in Argdown+. Use '-' for contrariness or '><' for contradiction."
              },
              node
            );
          } else if (
            relation.relationType === RelationType.ATTACK &&
            (fromType === DiscussionPointType.ARGUMENT ||
              toType === DiscussionPointType.ARGUMENT)
          ) {
            addDiagnostic(
              response,
              {
                code: "adp-generic-argument-attack",
                severity: "warning",
                source: "ModelPlugin",
                message:
                  "A generic attack involving an Argument is underspecified; target a premise, conclusion, or inference when possible."
              },
              node
            );
          }
          const isOutgoingReversePlus =
            node.name === RuleNames.OUTGOING_SUPPORT &&
            isTokenNode(node.children[0]) &&
            node.children[0].image.trim() === "<+";
          if (
            fromType === DiscussionPointType.ARGUMENT &&
            (node.name === RuleNames.INCOMING_SUPPORT || isOutgoingReversePlus)
          ) {
            relation.relationType = RelationType.JUSTIFIES;
          } else if (
            relation.relationType === RelationType.SUPPORT &&
            fromType === DiscussionPointType.STATEMENT &&
            toType === DiscussionPointType.STATEMENT
          ) {
            relation.relationType = RelationType.IMPLIES;
            addDiagnostic(
              response,
              {
                code: "adp-legacy-statement-support",
                severity: "information",
                source: "ModelPlugin",
                message:
                  "Legacy Statement support syntax is normalized to implication in Argdown+."
              },
              node
            );
          }
        }
        // Transfer relation-level contextualized text from child statement in ADP mode.
        if (
          isArgdownPlusMode(request) &&
          isRuleNode(contentNode) &&
          contentNode.contextualText !== undefined
        ) {
          node.contextualText = contentNode.contextualText;
          node.contextualRanges = contentNode.contextualRanges;
          if (contentNode.contextualData !== undefined) {
            node.contextualData = contentNode.contextualData;
          }
        }
        validateArgdownPlusRelationType(relation, request);
        let relationExists = false;
        const relationSource = relation.from;
        for (const existingRelation of relationSource.relations!) {
          if (
            relation.to === existingRelation.to &&
            relation.relationType === existingRelation.relationType
          ) {
            relationExists = true;
            existingRelation.occurrences.push(...relation.occurrences);
            break;
          } else if (
            IRelation.isSymmetric(relation) &&
            relation.relationType === existingRelation.relationType &&
            relation.from === existingRelation.to &&
            relation.to === existingRelation.from
          ) {
            relationExists = true;
            existingRelation.occurrences.push(...relation.occurrences);
            break;
          }
        }
        if (!relationExists) {
          if (!relation.from || !relation.to) {
            throw new ArgdownPluginError(
              this.name,
              "missing-relation-member",
              "Missing relation source or target."
            );
          }
          response.relations!.push(relation);
          relation.from.relations!.push(relation);
          relation.to.relations!.push(relation);
        }
      }
    };

    this.tokenListeners = {
      [TokenNames.STATEMENT_DEFINITION]: (
        request,
        _response,
        token,
        parentNode
      ) => {
        const match = statementDefinitionPattern.exec(token.image);
        if (match != null && currentStatement) {
          const parsed = isArgdownPlusMode(request)
            ? parseStatementIdentifier(match[1])
            : {
                title: match[1],
                discussionPointType: DiscussionPointType.STATEMENT
              };
          currentStatement.title = parsed.title;
          currentStatement.discussionPointType = parsed.discussionPointType;
          setOrValidateDiscussionPointType(
            request,
            currentStatement.title,
            parsed.discussionPointType
          );
          token.title = currentStatement.title;
          parentNode!.statement = currentStatement;
        }
      },
      [TokenNames.STATEMENT_REFERENCE]: (
        request,
        _response,
        token,
        parentNode
      ) => {
        const match = statementReferencePattern.exec(token.image);
        if (match != null && currentStatement) {
          const parsed = isArgdownPlusMode(request)
            ? parseStatementIdentifier(match[1])
            : {
                title: match[1],
                discussionPointType: DiscussionPointType.STATEMENT
              };
          currentStatement.title = parsed.title;
          currentStatement.discussionPointType = parsed.discussionPointType;
          setOrValidateDiscussionPointType(
            request,
            currentStatement.title,
            parsed.discussionPointType
          );
          currentStatement.isReference = !inBlock;
          token.title = currentStatement.title;
          parentNode!.statement = currentStatement;
        }
      },
      [TokenNames.BLOCK_CONTENT]: (_request, _response, token) => {
        if (!currentStatement) {
          return;
        }
        token.text = normalizeBlockContent(token.image);
        currentStatement.text = token.text;
        currentStatement.ranges = [];
      },
      [TokenNames.STATEMENT_MENTION]: (request, _response, token) => {
        const match = statementMentionPattern.exec(token.image);
        if (match) {
          const parsed = isArgdownPlusMode(request)
            ? parseStatementIdentifier(match[1])
            : {
                title: match[1],
                discussionPointType: DiscussionPointType.STATEMENT
              };
          token.title = parsed.title;
          setOrValidateDiscussionPointType(
            request,
            parsed.title,
            parsed.discussionPointType
          );
          if (token.image[token.image.length - 1] == " ") {
            token.trailingWhitespace = " ";
          } else {
            token.trailingWhitespace = "";
          }
          const target = currentHeading || currentStatement;
          if (target) {
            const previousText = target.text || "";
            const newText = previousText + token.image;
            target.text = newText;
            if (!target.ranges) {
              target.ranges = [];
            }
            const range: IRange = {
              type: RangeType.STATEMENT_MENTION,
              title: token.title,
              start: previousText.length,
              stop: newText.length - 1
            };
            target.ranges.push(range);
          }
        }
      },
      [TokenNames.ARGUMENT_REFERENCE]: (request, _response, token) => {
        const match = argumentReferencePattern.exec(token.image);
        if (match != null && currentStatement) {
          const title = match[1];
          currentStatement.title = title;
          currentStatement.discussionPointType = DiscussionPointType.ARGUMENT;
          setOrValidateDiscussionPointType(
            request,
            title,
            DiscussionPointType.ARGUMENT
          );
          currentStatement.isReference = !inBlock;
          token.title = title;
        }
      },
      [TokenNames.ARGUMENT_DEFINITION]: (request, _response, token) => {
        const match = argumentDefinitionPattern.exec(token.image);
        if (match != null && currentStatement) {
          const title = match[1];
          currentStatement.title = title;
          currentStatement.discussionPointType = DiscussionPointType.ARGUMENT;
          setOrValidateDiscussionPointType(
            request,
            title,
            DiscussionPointType.ARGUMENT
          );
          token.title = title;
        }
      },
      [TokenNames.ARGUMENT_MENTION]: (request, _response, token) => {
        const target = currentHeading ? currentHeading : currentStatement;
        const match = argumentMentionPattern.exec(token.image);
        if (match) {
          token.title = match[1];
          setOrValidateDiscussionPointType(
            request,
            token.title,
            DiscussionPointType.ARGUMENT
          );
          if (token.image[token.image.length - 1] == " ") {
            token.trailingWhitespace = " ";
          } else {
            token.trailingWhitespace = "";
          }
          if (target) {
            const previousText = target.text || "";
            const newText = previousText + token.image;
            target.text = newText;
            if (!target.ranges) {
              target.ranges = [];
            }
            const range: IRange = {
              type: RangeType.ARGUMENT_MENTION,
              title: token.title,
              start: previousText.length,
              stop: newText.length - 1
            };
            target.ranges.push(range);
          }
        }
      },
      [TokenNames.LINK]: (_request, _response, token) => {
        const target = currentHeading ? currentHeading : currentStatement;
        if (!target) {
          return;
        }
        const match = linkPattern.exec(token.image);
        if (!match || match.length < 3) {
          throw new ArgdownPluginError(
            this.name,
            "invalid-link",
            "Could not match link."
          );
        }
        token.url = match[2];
        token.text = match[1];
        const oldText = target.text || "";
        const newText = oldText + token.text;
        target.text = newText;
        const linkRange = <IRange>{
          type: "link",
          start: oldText.length,
          stop: newText.length - 1
        };
        linkRange.url = token.url;
        if (token.image[token.image.length - 1] == " ") {
          target.text += " ";
          token.trailingWhitespace = " ";
        } else {
          token.trailingWhitespace = "";
        }
        if (!target.ranges) {
          target.ranges = [];
        }
        target.ranges.push(linkRange);
      },
      [TokenNames.TAG]: (request, response, token) => {
        const target = currentHeading || currentStatement;
        if (!target) {
          return;
        }
        const match = tagPattern.exec(token.image);
        if (!match || match.length < 2) {
          throw new ArgdownPluginError(
            this.name,
            "invalid-tag",
            "Could not parse tag."
          );
        }
        const tag = match[1] || match[2];
        const settings = this.getSettings(request);
        token.tag = tag;
        if (!settings.removeTagsFromText) {
          const oldText = target.text || "";
          const newText = oldText + token.image;
          const tagRange: IRange = {
            type: RangeType.TAG,
            start: oldText.length,
            stop: newText.length - 1
          };
          token.text = token.image;
          target.text = newText;
          tagRange.tag = token.tag;
          if (!target.ranges) {
            target.ranges = [];
          }
          target.ranges.push(tagRange);
        }
        target.tags = target.tags || [];
        const tags = target.tags;
        if (target.tags.indexOf(tag) === -1) {
          tags.push(tag);
        }
        let tagData = response.tags![tag];
        if (!tagData) {
          tagData = {
            tag: tag,
            cssClass: stringToClassName("tag-" + tag),
            occurrenceIndex: tagCounter
          };
          response.tags![tag] = tagData;
          tagCounter++;
        }
      },
      [TokenNames.NEWLINE]: (
        _request,
        _response,
        _token,
        parentNode,
        childIndex
      ) => {
        const target = currentHeading ? currentHeading : currentStatement;
        if (!target) {
          return;
        }
        const oldText = target.text || "";
        // Add empty space if not already preceded by one and if this is not the end of the string.
        if (
          childIndex !== parentNode!.children!.length - 1 &&
          oldText.charAt(oldText.length - 1) !== " "
        ) {
          target.text = oldText + " ";
        }
      }
    };
    this.ruleListeners = {
      [RuleNames.ARGDOWN + "Entry"]: (request, response) => {
        if (request.parser && request.parser.syntax === "micro-argdown+") {
          currentStatement = null;
          currentHeading = null;
          currentSection = null;
          currentRelationParent = null;
          currentPCS = null;
          currentInference = null;
          currentArgument = null;
          rangesStack = [];
          relationParentsStack = [];
          currentRelation = null;
          inBlock = false;
          return;
        }
        response.statements = {};
        response.arguments = {};
        response.sections = [];
        response.relations = [];
        response.discussionPoints = {};
        response.excerpts = {};
        response.tags = {};
        uniqueTitleCounter = 0;
        currentHeading = null;
        currentSection = null;
        currentRelationParent = null;
        currentPCS = null;
        currentInference = null;
        currentArgument = null;
        rangesStack = [];
        relationParentsStack = [];
        currentRelation = null;
        sectionCounter = 0;
        tagCounter = 0;
        inBlock = false;
        discussionPointTypes = {};
      },
      [RuleNames.ARGDOWN + "Exit"]: (_req, _resp, token) => {
        const lastChild =
          token.children && token.children.length > 0
            ? token.children[token.children.length - 1]
            : null;
        while (currentSection && lastChild && lastChild.endLine) {
          currentSection.endLine = lastChild.endLine;
          currentSection.endOffset = lastChild.endOffset;
          currentSection.endColumn = lastChild.endColumn;
          currentSection = currentSection.parent || null;
        }
      },
      [RuleNames.HEADING + "Entry"]: (_request, _response, node) => {
        currentHeading = node;
        currentHeading.text = "";
        currentHeading.ranges = [];
      },
      [RuleNames.HEADING + "Exit"]: (request, response, node) => {
        if (!currentHeading) {
          throw new ArgdownPluginError(
            this.name,
            "missing-heading",
            "Missing heading."
          );
        }
        if (node.children) {
          const headingStart = node.children[0] as ITokenNode;
          currentHeading.level = headingStart.image.length - 1; //number of # - whitespace
          sectionCounter++;
          const sectionId = "s" + sectionCounter;
          const title = currentHeading.text ? currentHeading.text.trim() : "";
          const newSection: ISection = {
            type: ArgdownTypes.SECTION,
            id: sectionId,
            level: currentHeading.level,
            title: title,
            children: []
          };
          if (
            !response.maxSectionLevel ||
            currentHeading.level > response.maxSectionLevel
          ) {
            response.maxSectionLevel = currentHeading.level;
          }
          newSection.tags = currentHeading.tags;
          newSection.ranges = currentHeading.ranges;
          newSection.startLine = node.startLine;
          newSection.startColumn = node.startColumn;
          newSection.heading = currentHeading;
          newSection.data = currentHeading.data;
          const groupSettings = request.group;
          if (newSection.data) {
            if (
              newSection.data.isGroup !== undefined &&
              (!groupSettings || !groupSettings.ignoreIsGroup)
            ) {
              newSection.isGroup = newSection.data.isGroup;
            }
            if (
              newSection.data.isClosed !== undefined &&
              (!groupSettings || !groupSettings.ignoreIsClosed)
            ) {
              newSection.isClosed = newSection.data.isClosed;
            }
          }
          if (groupSettings && isObject(groupSettings.sections)) {
            const groupConfig = groupSettings.sections[newSection.title!];
            if (groupConfig) {
              newSection.isGroup = groupConfig.isGroup;
              newSection.isClosed = groupConfig.isClosed;
            } else {
              newSection.isGroup =
                newSection.isGroup === undefined ? false : newSection.isGroup;
            }
          }

          if (!currentSection) {
            response.sections!.push(newSection);
          } else {
            let previous: ISection | null = currentSection;
            while (previous && previous.level >= newSection.level) {
              previous.endOffset = newSection.startOffset! - 1;
              previous.endLine = newSection.startLine! - 1;
              previous.endColumn = 0;
              previous = previous.parent || null;
            }
            if (previous && previous.level < newSection.level) {
              previous.children.push(newSection);
              newSection.parent = previous;
            } else {
              response.sections!.push(newSection);
            }
          }
          currentSection = newSection;
          currentHeading.section = newSection;
          currentHeading = null;
        }
      },
      [RuleNames.BLOCK + "Entry"]: (request, _response, node) => {
        inBlock = true;
        if (isArgdownPlusMode(request) && currentStatement) {
          const statementIdentifier =
            node.children &&
            node.children.find(
              (child) =>
                isTokenNode(child) &&
                tokenMatcher(child, argdownLexer.StatementReference)
            );
          const argumentIdentifier =
            node.children &&
            node.children.find(
              (child) =>
                isTokenNode(child) &&
                tokenMatcher(child, argdownLexer.ArgumentReference)
            );
          if (argumentIdentifier) {
            currentStatement.discussionPointType = DiscussionPointType.ARGUMENT;
            currentStatement.role = StatementRole.ARGUMENT_DESCRIPTION;
          } else if (!statementIdentifier) {
            currentStatement.discussionPointType = DiscussionPointType.EXCERPT;
          }
          currentStatement.isReference = false;
        }
      },
      [RuleNames.BLOCK + "Exit"]: () => {
        inBlock = false;
      },
      [RuleNames.STATEMENT + "Entry"]: (
        _request,
        _response,
        node,
        parentNode
      ) => {
        currentStatement = {
          type: ArgdownTypes.STATEMENT,
          discussionPointType: DiscussionPointType.STATEMENT
        };
        if (parentNode!.name === RuleNames.ARGDOWN) {
          currentStatement.role = StatementRole.TOP_LEVEL_STATEMENT;
          currentStatement.isTopLevel = true;
        } else if (currentRelation) {
          currentStatement.role = StatementRole.RELATION_STATEMENT;
        }
        currentRelationParent = currentStatement;
        node.statement = currentStatement;
      },
      [RuleNames.STATEMENT + "Exit"]: (
        _request,
        response,
        node,
        parentNode
      ) => {
        const statement = node.statement;
        if (!statement) {
          return;
        }
        statement.startLine = node.startLine;
        statement.startColumn = node.startColumn;
        statement.endLine = node.endLine;
        statement.endColumn = node.endColumn;
        statement.data = node.data;
        statement.isAnonymous = !statement.title || statement.title == "";
        if (statement.isAnonymous) {
          statement.title = getUniqueTitle();
        }
        const statementTitle = statement.title!;
        const isRelationStatement =
          statement.role === StatementRole.RELATION_STATEMENT;
        const isAdpRelationStatement =
          isArgdownPlusMode(_request) && isRelationStatement;
        const hasBlockDefinition =
          !!node.children &&
          node.children.find(
            (child) => isRuleNode(child) && child.name === RuleNames.BLOCK
          ) !== undefined;
        const statementContentNode = getStatementContentNode(node);
        const hasInlineMultilineText =
          hasMultilineStatementContent(statementContentNode);
        if (isAdpRelationStatement && statement.isAnonymous) {
          if (hasBlockDefinition) {
            // Anonymous block contents are opaque exact Excerpt text. Prefixes
            // inside the block are content, not type markers.
            statement.discussionPointType = DiscussionPointType.EXCERPT;
          } else {
            // 1) Prefix-based inference for inline anonymous relation members.
            if (statement.text && /^\?\s+/.test(statement.text)) {
              statement.discussionPointType = DiscussionPointType.QUESTION;
              statement.text = statement.text.replace(/^\?\s+/, "");
            } else if (statement.text && /^@\s+/.test(statement.text)) {
              statement.discussionPointType = DiscussionPointType.REFERENCE;
              statement.text = statement.text.replace(/^@\s+/, "");
            }
            // 2) Relation-context inference fallback.
            const firstChild =
              parentNode &&
              parentNode.children &&
              parentNode.children.length > 0
                ? parentNode.children[0]
                : null;
            const relationTokenImage =
              firstChild && isTokenNode(firstChild)
                ? firstChild.image.trim()
                : undefined;
            if (
              statement.discussionPointType === DiscussionPointType.STATEMENT
            ) {
              if (
                parentNode &&
                parentNode.name === RuleNames.OUTGOING_SUPPORT &&
                relationTokenImage === "<+"
              ) {
                statement.discussionPointType = DiscussionPointType.ARGUMENT;
                statement.role = StatementRole.ARGUMENT_DESCRIPTION;
              } else if (parentNode && parentNode.name === RuleNames.ANSWERS) {
                statement.discussionPointType = DiscussionPointType.QUESTION;
              }
            }
          }
        }
        if (
          isArgdownPlusMode(_request) &&
          hasInlineMultilineText &&
          !hasBlockDefinition
        ) {
          throw new ArgdownPluginError(
            this.name,
            "missing-block-operator-for-multiline-text",
            `Multiline text for discussion point '${statementTitle}' requires the block operator (>>).`
          );
        }
        if (
          isArgdownPlusMode(_request) &&
          statement.discussionPointType === DiscussionPointType.EXCERPT &&
          !isAdpRelationStatement &&
          !statement.isReference &&
          !hasBlockDefinition
        ) {
          throw new ArgdownPluginError(
            this.name,
            "missing-excerpt-block-operator",
            `Excerpt discussion point '${statementTitle}' requires the block operator (>>).`
          );
        }
        setOrValidateDiscussionPointType(
          _request,
          statementTitle,
          statement.discussionPointType || DiscussionPointType.STATEMENT
        );
        const isAnonymousExcerptDefinition =
          isAdpRelationStatement &&
          statement.isAnonymous &&
          statement.discussionPointType === DiscussionPointType.EXCERPT &&
          hasBlockDefinition;
        if (isAdpRelationStatement && !isAnonymousExcerptDefinition) {
          // In ADP mode relation-level text/data belongs to the edge occurrence.
          node.contextualText = statement.text
            ? statement.text.trimEnd() || undefined
            : undefined;
          node.contextualRanges = statement.ranges;
          node.contextualData = statement.data;
          statement.text = undefined;
          statement.ranges = undefined;
          statement.data = undefined;
          statement.isReference = true;
        }
        if (currentSection) {
          statement.section = currentSection;
        }
        if (
          statement.discussionPointType === DiscussionPointType.ARGUMENT &&
          statement.role === StatementRole.ARGUMENT_DESCRIPTION
        ) {
          const argument = getArgument(
            _request,
            response.arguments!,
            statementTitle
          );
          argument.hasExplicitIdentifier =
            !!argument.hasExplicitIdentifier || !statement.isAnonymous;
          node.argument = argument;
          if (statement.tags && !isAdpRelationStatement) {
            addTags(statement.tags, argument);
          }
          if (statement.data && !isAdpRelationStatement) {
            argument.data = merge(argument.data, statement.data);
          }
          argument.members.push(statement as IArgumentDescription);
          const isInGroup =
            statement.data && statement.data.isInGroup !== undefined
              ? statement.data.isInGroup
              : undefined;
          const argumentTakesSection =
            isInGroup === true ||
            (!statement.isReference &&
              isInGroup === undefined &&
              argument.section === undefined);
          if (argumentTakesSection) {
            argument.section = statement.section;
          }
          response.discussionPoints![this.getDiscussionPointKey(argument)] =
            argument;
          currentStatement = null;
          return;
        }
        const equivalenceClass = getEquivalenceClass(
          _request,
          response.statements!,
          statementTitle,
          statement.discussionPointType
        );
        node.equivalenceClass = equivalenceClass;
        equivalenceClass.hasExplicitIdentifier =
          !!equivalenceClass.hasExplicitIdentifier || !statement.isAnonymous;
        if (statement.tags && !isAdpRelationStatement) {
          addTags(statement.tags, equivalenceClass);
        }
        if (statement.data && !isAdpRelationStatement) {
          equivalenceClass.data = merge(equivalenceClass.data, statement.data);
        }
        if (statement.discussionPointType) {
          equivalenceClass.discussionPointType = statement.discussionPointType;
        }
        equivalenceClass.members.push(statement);
        if (
          equivalenceClass.discussionPointType === DiscussionPointType.EXCERPT
        ) {
          const excerpt = equivalenceClass as IExcerpt;
          excerpt.entityKind = "text-artifact";
          response.excerpts![excerpt.title!] = excerpt;
        } else {
          equivalenceClass.entityKind = "discussion-point";
          response.discussionPoints![
            this.getDiscussionPointKey(equivalenceClass)
          ] = equivalenceClass as IDiscussionPoint;
        }
        const isInGroup =
          statement.data && statement.data.isInGroup !== undefined
            ? statement.data.isInGroup
            : undefined;
        const ecTakesSection =
          isInGroup === true ||
          (!statement.isReference &&
            isInGroup === undefined &&
            equivalenceClass.section === undefined);
        if (ecTakesSection) {
          equivalenceClass.section = statement.section;
        }
        if (statement.role === StatementRole.TOP_LEVEL_STATEMENT) {
          equivalenceClass.isUsedAsTopLevelStatement = true; //members are used outside of argument reconstructions (not as premise or conclusion)
        } else if (statement.role === StatementRole.RELATION_STATEMENT) {
          equivalenceClass.isUsedAsRelationStatement = true;
        }
        currentStatement = null;
      },
      [RuleNames.ARGUMENT + "Entry"]: (
        _request,
        _response,
        node,
        parentNode
      ) => {
        const desc: IArgumentDescription = {
          type: ArgdownTypes.STATEMENT,
          role: StatementRole.ARGUMENT_DESCRIPTION,
          text: "",
          discussionPointType: DiscussionPointType.ARGUMENT
        };
        currentStatement = desc;
        desc.startLine = node.startLine;
        desc.endLine = node.endLine;
        desc.startColumn = node.startColumn;
        desc.endColumn = node.endColumn;
        desc.isTopLevel = !parentNode || parentNode.name === RuleNames.ARGDOWN;
        if (currentSection) {
          currentStatement.section = currentSection;
        }
        currentRelationParent = currentStatement;
        node.statement = desc;
      },
      [RuleNames.ARGUMENT + "Exit"]: (_request, response, node, parentNode) => {
        const desc = node.statement;
        if (!desc) {
          throw new ArgdownPluginError(
            this.name,
            "missing-argument-description",
            "Missing argument description."
          );
        }
        desc.startLine = node.startLine;
        desc.startColumn = node.startColumn;
        desc.endLine = node.endLine;
        desc.endColumn = node.endColumn;
        desc.data = node.data;
        if (!desc.title || desc.title == "") {
          desc.title = getUniqueTitle();
        }
        const isAdpRelationArgument =
          isArgdownPlusMode(_request) && !!(parentNode && parentNode.relation);
        if (isAdpRelationArgument) {
          node.contextualText = desc.text
            ? desc.text.trimEnd() || undefined
            : undefined;
          node.contextualRanges = desc.ranges;
          node.contextualData = desc.data;
          desc.text = undefined;
          desc.ranges = undefined;
          desc.data = undefined;
          desc.isReference = true;
        }
        const argument = getArgument(_request, response.arguments!, desc.title);
        argument.hasExplicitIdentifier = true;
        node.argument = argument;
        if (desc.tags && !isAdpRelationArgument) {
          addTags(desc.tags, argument);
        }
        if (desc.data && !isAdpRelationArgument) {
          argument.data = merge(argument.data, desc.data);
        }
        if (currentSection) {
          desc.section = currentSection;
        }
        argument.members.push(<IArgumentDescription>desc);
        const isInGroup =
          desc.data && desc.data.isInGroup !== undefined
            ? desc.data.isInGroup
            : undefined;
        const argumentTakesSection =
          isInGroup === true ||
          (!desc.isReference &&
            isInGroup === undefined &&
            argument.section === undefined);
        if (argumentTakesSection) {
          argument.section = desc.section;
        }
        response.arguments![argument.title!] = argument;
        response.discussionPoints![this.getDiscussionPointKey(argument)] =
          argument;
        currentStatement = null;
        currentArgument = null;
      },
      [RuleNames.PCS + "Entry"]: (
        _request,
        response,
        node,
        parentNode,
        childIndex
      ) => {
        let argument = null;
        let argumentDescription: IStatement | undefined;
        if (
          childIndex !== null &&
          childIndex > 0 &&
          parentNode &&
          parentNode.children
        ) {
          let precedingSibling = parentNode.children[childIndex - 1];
          if (
            isRuleNode(precedingSibling) &&
            precedingSibling.name === RuleNames.ARGUMENT
          ) {
            argumentDescription = precedingSibling.statement;
            argument = precedingSibling.argument;
          } else if (
            isTokenNode(precedingSibling) &&
            tokenMatcher(precedingSibling, argdownLexer.Emptyline)
          ) {
            precedingSibling = parentNode.children[childIndex - 2];
            if (
              isRuleNode(precedingSibling) &&
              precedingSibling.name === RuleNames.ARGUMENT
            ) {
              argumentDescription = precedingSibling.statement;
              argument = precedingSibling.argument;
            }
          }
        }
        if (!argument) {
          argument = getArgument(_request, response.arguments!);
        }
        if (currentSection) {
          argument.section = currentSection;
        }
        //if there is a previous reconstruction, throw an error as this might lead to chaos and confusion
        if (argument.pcs.length > 0) {
          throw new ArgdownPluginError(
            this.name,
            "multiple-pcs-assignments",
            `Multiple premise-conclusion-structures assigned to argument <${argument.title}>. You can only assign one pcs per argument.`
          );
        }
        argument.pcs = [];
        // Save pcs in description as well, since there can be more than one pcs
        if (argumentDescription) {
          (<IArgumentDescription>argumentDescription).pcs = argument.pcs;
        }
        node.argument = argument;
        currentPCS = argument;
      },
      [RuleNames.PCS + "Exit"]: (_request, response, node) => {
        const argument = node.argument;
        if (!argument) {
          throw new ArgdownPluginError(
            this.name,
            "missing-argument",
            "Missing argument."
          );
        }
        if (argument.pcs.length == 0) {
          throw new ArgdownPluginError(
            this.name,
            "missing-argument-statements",
            "Missing argument statements."
          );
        }
        const lastStatement = argument.pcs[argument.pcs.length - 1];
        if (lastStatement.role === StatementRole.INTERMEDIARY_CONCLUSION) {
          lastStatement.role = StatementRole.MAIN_CONCLUSION;
          const ec = response.statements![lastStatement.title!];
          ec.isUsedAsMainConclusion = true;
          if (
            !ec.members.find(
              (s) => s.role === StatementRole.INTERMEDIARY_CONCLUSION
            )
          ) {
            ec.isUsedAsIntermediaryConclusion = false;
          }
          if (isArgdownPlusMode(_request)) {
            addRelationToModel(
              _request,
              response,
              RelationType.JUSTIFIES,
              argument,
              ec,
              node
            );
          }
        } else {
          throw new ArgdownPluginError(
            this.name,
            "missing-main-conclusion",
            "Missing main conclusions."
          );
        }
        argument.startLine = node.startLine;
        argument.startColumn = node.startColumn;
        argument.endLine = node.endLine;
        argument.endColumn = node.endColumn;
        currentStatement = null;
        currentArgument = null;
        currentPCS = null;
      },
      [RuleNames.PCS_STATEMENT + "Exit"]: (
        _request,
        response,
        node,
        parentNode,
        childIndex
      ) => {
        if (!currentPCS) {
          throw new ArgdownPluginError(
            this.name,
            "missing-argument-reconstruction",
            "Missing argument reconstruction."
          );
        }
        if (node.children && node.children.length > 1) {
          //first node is ArgumentStatementStart
          const statementNode = node.children[1] as IRuleNode;
          const statement: IPCSStatement = <IPCSStatement>(
            statementNode.statement
          );
          if (!statement) {
            throw new ArgdownPluginError(
              this.name,
              "missing-statement",
              "Missing statement."
            );
          }
          const ec = getEquivalenceClass(
            _request,
            response.statements!,
            statement.title!,
            statement.discussionPointType
          );
          statement.role = StatementRole.PREMISE;
          statement.argumentTitle = currentPCS.title;
          if (
            childIndex !== null &&
            childIndex > 0 &&
            parentNode &&
            parentNode.children
          ) {
            const precedingSibling = parentNode.children[
              childIndex - 1
            ] as IRuleNode;
            if (precedingSibling.name === RuleNames.INFERENCE) {
              // We first assume that this is a intermediary conclusion
              // If we exit the argument we will change the role of the last statement in the pcs
              statement.role = StatementRole.INTERMEDIARY_CONCLUSION;
              const conclusion = <IConclusion>statement;
              ec.isUsedAsIntermediaryConclusion = true;
              conclusion.inference = precedingSibling.inference;
              conclusion.inference!.conclusionIndex = currentPCS.pcs.length;
              conclusion.inference!.argumentTitle = currentPCS.title;
            }
          }
          if (statement.role == StatementRole.PREMISE) {
            ec.isUsedAsPremise = true;
            if (isArgdownPlusMode(_request)) {
              addRelationToModel(
                _request,
                response,
                RelationType.IS_PRESUPPOSED_BY,
                ec,
                currentPCS,
                node
              );
            }
          }
          currentPCS.pcs.push(statement);
          node.statement = statement;
          node.statementNr = currentPCS.pcs.length;
        }
      },
      [RuleNames.INFERENCE + "Entry"]: (_request, _response, node) => {
        currentInference = {
          type: ArgdownTypes.INFERENCE,
          relations: []
        };
        currentInference.relations = [];
        currentInference.inferenceRules = [];
        currentInference.startLine = node.startLine;
        currentInference.startColumn = node.startColumn;
        currentInference.endLine = node.endLine;
        currentInference.endColumn = node.endColumn;
        node.inference = currentInference!;
        currentRelationParent = currentInference;
        relationParentsStack.push(currentInference);
      },
      [RuleNames.INFERENCE + "Exit"]: (_request, _response, node) => {
        if (!currentInference) {
          return;
        }
        currentInference.data = node.data;
      },
      [RuleNames.INFERENCE_RULES + "Exit"]: (_request, _response, node) => {
        if (!currentInference) {
          return;
        }
        if (node.children) {
          for (const child of node.children) {
            if (isRuleNode(child) && child.name == RuleNames.FREESTYLE_TEXT) {
              if (!currentInference.inferenceRules) {
                currentInference.inferenceRules = [];
              }
              const text = child.text ? child.text.trim() : "";
              currentInference.inferenceRules.push(text);
            }
          }
        }
      },
      [RuleNames.INCOMING_SUPPORT + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.SUPPORT,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.INCOMING_SUPPORT + "Exit"]: onRelationExit,
      [RuleNames.INCOMING_ATTACK + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.ATTACK,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.INCOMING_ATTACK + "Exit"]: onRelationExit,
      [RuleNames.OUTGOING_SUPPORT + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.SUPPORT,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.OUTGOING_SUPPORT + "Exit"]: onRelationExit,
      [RuleNames.OUTGOING_ATTACK + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.ATTACK,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.OUTGOING_ATTACK + "Exit"]: onRelationExit,
      [RuleNames.CONTRADICTION + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.CONTRADICTORY,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.CONTRADICTION + "Exit"]: onRelationExit,
      [RuleNames.IMPLIES + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IMPLIES,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.IMPLIES + "Exit"]: onRelationExit,
      [RuleNames.REVERSE_IMPLIES + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IMPLIES,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.REVERSE_IMPLIES + "Exit"]: onRelationExit,
      [RuleNames.PRESUPPOSED_BY + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IS_PRESUPPOSED_BY,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.PRESUPPOSED_BY + "Exit"]: onRelationExit,
      [RuleNames.REVERSE_PRESUPPOSED_BY + "Entry"]: (
        _request,
        _response,
        node
      ) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IS_PRESUPPOSED_BY,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.REVERSE_PRESUPPOSED_BY + "Exit"]: onRelationExit,
      [RuleNames.SPECIFIES + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.SPECIFIES,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.SPECIFIES + "Exit"]: onRelationExit,
      [RuleNames.REVERSE_SPECIFIES + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.SPECIFIES,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.REVERSE_SPECIFIES + "Exit"]: onRelationExit,
      [RuleNames.EXAMPLE_FOR + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IS_EXAMPLE_FOR,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.EXAMPLE_FOR + "Exit"]: onRelationExit,
      [RuleNames.REVERSE_EXAMPLE_FOR + "Entry"]: (
        _request,
        _response,
        node
      ) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IS_EXAMPLE_FOR,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.REVERSE_EXAMPLE_FOR + "Exit"]: onRelationExit,
      [RuleNames.QUESTIONS + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.QUESTIONS,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.QUESTIONS + "Exit"]: onRelationExit,
      [RuleNames.REVERSE_QUESTIONS + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.QUESTIONS,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.REVERSE_QUESTIONS + "Exit"]: onRelationExit,
      [RuleNames.ANSWERS + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.ANSWERS,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.ANSWERS + "Exit"]: onRelationExit,
      [RuleNames.REVERSE_ANSWERS + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.ANSWERS,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.REVERSE_ANSWERS + "Exit"]: onRelationExit,
      [RuleNames.CITED_BY + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IS_CITED_BY,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.CITED_BY + "Exit"]: onRelationExit,
      [RuleNames.REVERSE_CITED_BY + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.IS_CITED_BY,
          occurrences: [node]
        };
        currentRelation.to = target;
        node.relation = currentRelation;
      },
      [RuleNames.REVERSE_CITED_BY + "Exit"]: onRelationExit,
      [RuleNames.EQUAL + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.EQUAL,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.EQUAL + "Exit"]: onRelationExit,
      [RuleNames.POTENTIALLY_EQUAL + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.POTENTIALLY_EQUAL,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.POTENTIALLY_EQUAL + "Exit"]: onRelationExit,
      [RuleNames.OUTGOING_UNDERCUT + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.UNDERCUT,
          occurrences: [node]
        };
        if (target && target.type === ArgdownTypes.EQUIVALENCE_CLASS) {
          //const inference = (<Statement>currentRelationParent).inference!; // this is not working as statement has no inference yet
          if (currentInference) {
            currentRelation.to = currentInference;
          } else {
            currentRelation.to = target;
            //throw new ArgdownPluginError(this.name, "Missing inference.");
          }
        } else {
          currentRelation.to = target;
        }
        node.relation = currentRelation;
      },
      [RuleNames.OUTGOING_UNDERCUT + "Exit"]: onRelationExit,
      [RuleNames.INCOMING_UNDERCUT + "Entry"]: (_request, _response, node) => {
        const target = last(relationParentsStack);
        currentRelation = {
          type: ArgdownTypes.RELATION,
          relationType: RelationType.UNDERCUT,
          occurrences: [node]
        };
        currentRelation.from = target;
        node.relation = currentRelation;
      },
      [RuleNames.INCOMING_UNDERCUT + "Exit"]: onRelationExit,
      [RuleNames.RELATIONS + "Entry"]: (_request, response) => {
        if (!currentRelationParent) {
          throw new ArgdownPluginError(
            this.name,
            "missing-ast-node-relation-parent",
            "Parent of relation missing."
          );
        }
        relationParentsStack.push(
          getRelationMember(_request, response, currentRelationParent)
        );
      },
      [RuleNames.RELATIONS + "Exit"]: () => {
        currentRelation = null;
        relationParentsStack.pop();
      },
      [RuleNames.FREESTYLE_TEXT + "Entry"]: (request, _response, node) => {
        const target = currentHeading ? currentHeading : currentStatement;
        node.text = "";
        const settings = this.getSettings(request);

        if (node.children) {
          for (const child of node.children) {
            if (isTokenNode(child) && child.image !== undefined) {
              if (tokenMatcher(child, argdownLexer.EscapedChar)) {
                node.text += child.image.substring(1, child.image.length);
              } else if (tokenMatcher(child, argdownLexer.SpecialChar)) {
                const specialCharTrimmed = child.image.trim();
                const specialCharInfo =
                  settings.shortcodes![specialCharTrimmed];
                if (specialCharInfo) {
                  const startPos = node.text ? node.text.length : 0;
                  node.text += specialCharInfo.unicode;
                  if (child.image[child.image.length - 1] == " ") {
                    node.text += " ";
                  }
                  const specialCharRange = {
                    type: RangeType.SPECIAL_CHAR,
                    start: startPos,
                    stop: startPos + specialCharInfo.unicode.length
                  };
                  rangesStack.push(specialCharRange);
                } else {
                  node.text += child.image;
                }
              } else {
                node.text += child.image;
              }
            }
          }
        }
        if (target) {
          target.text = target.text || "";
          target.text += node.text;
        }
      },
      [RuleNames.ITALIC + "Entry"]: () => {
        const target = currentHeading ? currentHeading : currentStatement;
        if (!target) {
          return;
        }
        const startPos = target.text ? target.text.length : 0;
        const italicRange = {
          type: RangeType.ITALIC,
          start: startPos,
          stop: startPos
        };
        rangesStack.push(italicRange);
        if (!target.ranges) {
          target.ranges = [];
        }
        target.ranges.push(italicRange);
      },
      [RuleNames.ITALIC + "Exit"]: (_request, _response, node) => {
        const target = currentHeading ? currentHeading : currentStatement;
        if (!target) {
          return;
        }
        const italicEnd = last(node.children) as ITokenNode;
        const range = last(rangesStack);
        if (range) {
          range.stop = target.text ? target.text.length - 1 : 0;
          rangesStack.pop();
        }
        if (italicEnd.image[italicEnd.image.length - 1] == " ") {
          target.text += " ";
          node.trailingWhitespace = " ";
        } else {
          node.trailingWhitespace = "";
        }
      },
      [RuleNames.BOLD + "Entry"]: () => {
        const target = currentHeading ? currentHeading : currentStatement;
        if (!target) {
          return;
        }
        const text = target.text || "";
        const boldRange: IRange = {
          type: RangeType.BOLD,
          start: text.length,
          stop: text.length
        };
        rangesStack.push(boldRange);
        if (!target.ranges) {
          target.ranges = [];
        }
        target.ranges.push(boldRange);
      },
      [RuleNames.BOLD + "Exit"]: (_request, _response, node) => {
        const target = currentHeading ? currentHeading : currentStatement;
        if (!target) {
          return;
        }
        const ruleNode = node;
        const boldEnd = last(ruleNode.children) as ITokenNode;
        const range = last(rangesStack);
        if (range) {
          range.stop = target.text ? target.text.length - 1 : 0;
          rangesStack.pop();
        }
        if (boldEnd && boldEnd.image[boldEnd.image.length - 1] == " ") {
          target.text += " ";
          ruleNode.trailingWhitespace = " ";
        } else {
          ruleNode.trailingWhitespace = "";
        }
      }
    };
  }
}
const getEquivalenceClass = (
  request: IArgdownRequest,
  statements: { [title: string]: IEquivalenceClass },
  title: string,
  discussionPointType?: DiscussionPointType
): IEquivalenceClass => {
  let ec = null;
  ec = statements[title];
  if (!ec) {
    ec = IEquivalenceClass.create(title);
    ec.discussionPointType =
      discussionPointType || DiscussionPointType.STATEMENT;
    statements[title] = ec;
  } else if (
    request.parser &&
    request.parser.syntax === "argdown+" &&
    discussionPointType &&
    ec.discussionPointType &&
    ec.discussionPointType !== discussionPointType
  ) {
    throw new ArgdownPluginError(
      "ModelPlugin",
      "discussion-point-type-conflict",
      `Type conflict for discussion point '${title}': '${ec.discussionPointType}' vs '${discussionPointType}'.`
    );
  } else if (!ec.discussionPointType && discussionPointType) {
    ec.discussionPointType = discussionPointType;
  }
  return ec;
};
