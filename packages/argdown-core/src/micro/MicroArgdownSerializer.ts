import { IArgdownDiagnostic } from "../diagnostics.js";
import {
  ArgdownTypes,
  DiscussionPointType,
  IArgument,
  IDiscussionPoint,
  IExcerpt,
  IEquivalenceClass,
  IGraphEntity,
  IRelation,
  RelationType
} from "../model/model.js";
import {
  IMicroArgdownDocument,
  IMicroOccurrence
} from "./MicroArgdownParser.js";

export interface IConversionResult {
  output?: string;
  diagnostics: IArgdownDiagnostic[];
}

export interface IArgdownPlusToMicroOptions {
  preserveFrontMatter?: boolean;
}

const typePrefix = (type: DiscussionPointType): string => {
  if (type === DiscussionPointType.QUESTION) return "Q";
  if (type === DiscussionPointType.ARGUMENT) return "A";
  if (type === DiscussionPointType.REFERENCE) return "R";
  if (type === DiscussionPointType.EXCERPT) return "E";
  return "S";
};

const createIdentifiers = (
  entities: IGraphEntity[]
): Map<IGraphEntity, string> => {
  const result = new Map<IGraphEntity, string>();
  const used = new Set<string>();
  for (const dp of entities) {
    if (dp.hasExplicitIdentifier !== false && dp.title) {
      result.set(dp, dp.title);
      used.add(dp.title);
    }
  }
  const counters: { [prefix: string]: number } = {};
  for (const dp of entities) {
    if (result.has(dp)) continue;
    const prefix = typePrefix(
      dp.discussionPointType || DiscussionPointType.STATEMENT
    );
    let counter = counters[prefix] || 1;
    while (used.has(`${prefix}${counter}`)) counter++;
    const id = `${prefix}${counter}`;
    counters[prefix] = counter + 1;
    used.add(id);
    result.set(dp, id);
  }
  return result;
};

const wrap = (dp: IGraphEntity, id: string): string => {
  const type = dp.discussionPointType || DiscussionPointType.STATEMENT;
  if (type === DiscussionPointType.ARGUMENT) return `<${id}>`;
  if (type === DiscussionPointType.QUESTION) return `[?${id}]`;
  if (type === DiscussionPointType.REFERENCE) return `[@${id}]`;
  if (type === DiscussionPointType.EXCERPT) return `[>${id}]`;
  return `[${id}]`;
};

const symbolFor = (
  relation: IRelation,
  parent: IGraphEntity,
  child: IGraphEntity
): string => {
  const forward = relation.from === parent && relation.to === child;
  switch (relation.relationType) {
    case RelationType.IMPLIES:
    case RelationType.ENTAILS:
      return forward ? "=>" : "<=";
    case RelationType.JUSTIFIES:
      return forward ? "+>" : "<+";
    case RelationType.IS_PRESUPPOSED_BY:
      return forward ? "^>" : "<^";
    case RelationType.CONTRADICTORY:
      return "><";
    case RelationType.CONTRARY:
      return "-";
    case RelationType.SPECIFIES:
      return forward ? ":>" : "<:";
    case RelationType.IS_EXAMPLE_FOR:
      return forward ? "%>" : "<%";
    case RelationType.ANSWERS:
      return forward ? "!>" : "<!";
    case RelationType.QUESTIONS:
      return forward ? "?>" : "<?";
    case RelationType.IS_CITED_BY:
      return forward ? "@>" : "<@";
    case RelationType.EQUAL:
      return "==";
    case RelationType.POTENTIALLY_EQUAL:
      return "~=";
    case RelationType.SUPPORT:
      return forward ? "+>" : "<+";
    default:
      return forward ? "->" : "<-";
  }
};

const definitionText = (dp: IGraphEntity): string =>
  dp.canonicalText ||
  (dp.type === ArgdownTypes.ARGUMENT
    ? IArgument.getCanonicalMemberText(dp)
    : IEquivalenceClass.getCanonicalMemberText(dp)) ||
  "";

const excerptIds = (excerpt: IGraphEntity, canonicalId: string): string[] =>
  excerpt.discussionPointType === DiscussionPointType.EXCERPT
    ? [canonicalId, ...((excerpt as IExcerpt).aliases || [])].filter(
        (id, index, ids) => !!id && ids.indexOf(id) === index
      )
    : [canonicalId];

const appendMicroDefinition = (
  output: string[],
  dp: IGraphEntity,
  id: string
) => {
  const wrapped = wrap(dp, id);
  const value = definitionText(dp);
  if (
    dp.discussionPointType === DiscussionPointType.EXCERPT &&
    /\r?\n/.test(value)
  ) {
    output.push(`${wrapped} >>`);
    for (const line of value.split(/\r?\n/)) output.push(`    ${line}`);
  } else {
    output.push(`${wrapped}: ${value}`.trimEnd());
  }
};

const serializeTree = (
  occurrence: IMicroOccurrence,
  ids: Map<IGraphEntity, string>,
  indent: number,
  output: string[],
  targetSyntax: "micro" | "argdown+" = "micro"
) => {
  if (indent === 0)
    output.push(
      wrap(occurrence.discussionPoint, ids.get(occurrence.discussionPoint)!)
    );
  for (const child of occurrence.children) {
    if (!child.relation) continue;
    const symbol = symbolFor(
      child.relation,
      occurrence.discussionPoint,
      child.discussionPoint
    );
    const prefix = `${" ".repeat(indent + 4)}${symbol} ${wrap(
      child.discussionPoint,
      ids.get(child.discussionPoint)!
    )}`;
    const useBlock =
      child.contextualText !== undefined &&
      (targetSyntax === "argdown+"
        ? child.discussionPoint.discussionPointType ===
            DiscussionPointType.EXCERPT || /\r?\n/.test(child.contextualText)
        : child.discussionPoint.discussionPointType ===
            DiscussionPointType.EXCERPT && /\r?\n/.test(child.contextualText));
    if (useBlock) {
      output.push(`${prefix} >>`);
      for (const line of child.contextualText!.split(/\r?\n/)) {
        output.push(`${" ".repeat(indent + 8)}${line}`);
      }
    } else {
      const context =
        child.contextualText !== undefined ? `: ${child.contextualText}` : "";
      output.push(`${prefix}${context}`);
    }
    serializeTree(child, ids, indent + 4, output, targetSyntax);
  }
};

export const serializeMicroArgdown = (
  document: IMicroArgdownDocument
): string => {
  const entities = Array.from(
    new Set<IGraphEntity>([
      ...Object.values(document.discussionPoints),
      ...Object.values(document.excerpts)
    ])
  );
  const ids = createIdentifiers(entities);
  const output = ["CONTEXT-FREE DEFINITIONS:"];
  for (const dp of entities) {
    for (const id of excerptIds(dp, ids.get(dp)!)) {
      appendMicroDefinition(output, dp, id);
    }
  }
  output.push("", "DISCOURSE TREE:");
  for (const root of document.roots) serializeTree(root, ids, 0, output);
  return output.join("\n").trimEnd() + "\n";
};

export const convertMicroToArgdownPlus = (
  document: IMicroArgdownDocument
): IConversionResult => {
  const entities = Array.from(
    new Set<IGraphEntity>([
      ...Object.values(document.discussionPoints),
      ...Object.values(document.excerpts)
    ])
  );
  const ids = createIdentifiers(entities);
  const output = ["===", "parser:", "  syntax: argdown+", "===", ""];
  for (const dp of entities) {
    for (const id of excerptIds(dp, ids.get(dp)!)) {
      const wrapped = wrap(dp, id);
      const value = definitionText(dp);
      if (dp.discussionPointType === DiscussionPointType.EXCERPT) {
        output.push(`${wrapped} >>`);
        for (const line of value.split(/\r?\n/)) output.push(`    ${line}`);
      } else {
        output.push(`${wrapped}: ${value}`.trimEnd());
      }
      output.push("");
    }
  }
  output.push("# Discourse tree", "");
  for (const root of document.roots) {
    const tree: string[] = [];
    serializeTree(root, ids, 0, tree, "argdown+");
    output.push(...tree, "");
  }
  return { output: output.join("\n").trimEnd() + "\n", diagnostics: [] };
};

export const convertArgdownPlusToMicro = (
  response: {
    discussionPoints?: { [key: string]: IDiscussionPoint };
    excerpts?: { [key: string]: IExcerpt };
    statements?: { [key: string]: IEquivalenceClass };
    arguments?: { [key: string]: IArgument };
    relations?: IRelation[];
    sections?: unknown[];
    frontMatter?: unknown;
  },
  options: IArgdownPlusToMicroOptions = {}
): IConversionResult => {
  const diagnostics: IArgdownDiagnostic[] = [];
  const dps = response.discussionPoints || {};
  const excerpts =
    response.excerpts ||
    Object.keys(response.statements || {})
      .filter(
        (title) =>
          response.statements![title].discussionPointType ===
          DiscussionPointType.EXCERPT
      )
      .reduce<{ [key: string]: IExcerpt }>((result, title) => {
        result[title] = response.statements![title] as IExcerpt;
        return result;
      }, {});
  const entities = Array.from(
    new Set<IGraphEntity>([...Object.values(dps), ...Object.values(excerpts)])
  );
  const reportUnsupported = (message: string) =>
    diagnostics.push({
      code: "micro-unsupported-adp-feature",
      severity: "error",
      source: "MicroArgdownSerializer",
      message
    });
  if (response.sections && response.sections.length > 0) {
    reportUnsupported(
      "Headings and section structure are outside the lossless Micro-Argdown+ profile."
    );
  }
  if (options.preserveFrontMatter && response.frontMatter !== undefined) {
    reportUnsupported(
      "Frontmatter preservation is outside the lossless Micro-Argdown+ profile."
    );
  }
  const explicitIdentifiers = new Map<string, IGraphEntity>();
  for (const dp of entities) {
    if (dp.hasExplicitIdentifier !== false && dp.title) {
      const existing = explicitIdentifiers.get(dp.title);
      if (existing && existing !== dp) {
        reportUnsupported(
          `Identifier '${dp.title}' belongs to multiple discussion points, but Micro-Argdown+ requires one global typed identifier namespace.`
        );
      } else {
        explicitIdentifiers.set(dp.title, dp);
      }
    }
    if (
      dp.data !== undefined ||
      (dp.tags && dp.tags.length > 0) ||
      dp.color !== undefined ||
      dp.fontColor !== undefined ||
      dp.members.some(
        (member) =>
          member.data !== undefined || (member.tags && member.tags.length > 0)
      )
    ) {
      reportUnsupported(
        `Entity '${dp.title}' contains metadata or presentation data that Micro-Argdown+ cannot represent losslessly.`
      );
    }
    if (
      dp.discussionPointType !== DiscussionPointType.EXCERPT &&
      /\r?\n/.test(definitionText(dp))
    ) {
      reportUnsupported(
        `Discussion point '${dp.title}' has multiline non-Excerpt text that the Micro-Argdown+ surface form cannot represent losslessly.`
      );
    }
  }
  for (const argument of Object.values(response.arguments || {})) {
    if (argument.pcs && argument.pcs.length) {
      reportUnsupported(
        `Argument '${argument.title}' has PCS structure that cannot be represented losslessly in Micro-Argdown+.`
      );
    }
  }
  for (const relation of response.relations || []) {
    if (
      relation.relationType === RelationType.ATTACK ||
      relation.relationType === RelationType.UNDERCUT
    ) {
      reportUnsupported(
        `Relation '${relation.relationType}' is outside the lossless Micro-Argdown+ profile.`
      );
    }
    if (
      relation.from &&
      relation.to &&
      relation.from.type !== ArgdownTypes.INFERENCE &&
      relation.to.type !== ArgdownTypes.INFERENCE
    ) {
      const from = relation.from;
      const to = relation.to;
      if (
        from.discussionPointType === DiscussionPointType.EXCERPT ||
        to.discussionPointType === DiscussionPointType.EXCERPT
      ) {
        const validCitation =
          relation.relationType === RelationType.IS_CITED_BY &&
          ((from.discussionPointType === DiscussionPointType.REFERENCE &&
            to.discussionPointType !== DiscussionPointType.EXCERPT) ||
            (from.discussionPointType === DiscussionPointType.REFERENCE &&
              to.discussionPointType === DiscussionPointType.EXCERPT) ||
            (from.discussionPointType === DiscussionPointType.EXCERPT &&
              to.discussionPointType !== DiscussionPointType.EXCERPT));
        if (!validCitation) {
          reportUnsupported(
            `Excerpt relation '${relation.relationType}' is outside the Micro-Argdown+ citation-only artifact model.`
          );
        }
      }
    }
    if (
      relation.occurrences.some(
        (occurrence) => occurrence.contextualData !== undefined
      )
    ) {
      reportUnsupported(
        `Relation '${relation.relationType}' contains contextual metadata that Micro-Argdown+ cannot represent losslessly.`
      );
    }
    for (const occurrence of relation.occurrences) {
      if (
        occurrence.contextualText !== undefined &&
        /\r?\n/.test(occurrence.contextualText)
      ) {
        const endpoint =
          occurrence.contextualizedEndpoint === "from"
            ? relation.from
            : relation.to;
        if (
          !endpoint ||
          endpoint.type === ArgdownTypes.INFERENCE ||
          endpoint.discussionPointType !== DiscussionPointType.EXCERPT ||
          relation.relationType !== RelationType.IS_CITED_BY
        ) {
          reportUnsupported(
            `Relation '${relation.relationType}' contains multiline non-Excerpt contextual text that Micro-Argdown+ cannot represent losslessly.`
          );
        }
      }
    }
  }
  if (diagnostics.length) return { diagnostics };

  const roots: IMicroOccurrence[] = [];
  const represented = new Set<IGraphEntity>();
  for (const relation of response.relations || []) {
    if (
      !relation.from ||
      !relation.to ||
      relation.from.type === ArgdownTypes.INFERENCE ||
      relation.to.type === ArgdownTypes.INFERENCE
    ) {
      reportUnsupported(
        "Inference relation endpoints are outside the lossless Micro-Argdown+ profile."
      );
      continue;
    }
    const from = relation.from;
    const to = relation.to;
    represented.add(from);
    represented.add(to);
    const occurrences = relation.occurrences.length
      ? relation.occurrences
      : [undefined];
    for (const relationOccurrence of occurrences) {
      const contextualizesFrom =
        relationOccurrence &&
        relationOccurrence.contextualizedEndpoint === "from";
      const root = contextualizesFrom ? to : from;
      const child = contextualizesFrom ? from : to;
      roots.push({
        discussionPoint: root,
        children: [
          {
            discussionPoint: child,
            relation,
            contextualText:
              relationOccurrence && relationOccurrence.contextualText,
            children: [],
            line: (relationOccurrence && relationOccurrence.startLine) || 1
          }
        ],
        line: (relationOccurrence && relationOccurrence.startLine) || 1
      });
    }
  }
  if (diagnostics.length) return { diagnostics };
  for (const dp of entities) {
    if (!represented.has(dp))
      roots.push({ discussionPoint: dp, children: [], line: 1 });
  }
  const document: IMicroArgdownDocument = {
    discussionPoints: dps,
    excerpts,
    statements: response.statements || {},
    arguments: response.arguments || {},
    relations: response.relations || [],
    roots,
    diagnostics: [],
    sourceOccurrences: []
  };
  return { output: serializeMicroArgdown(document), diagnostics };
};
