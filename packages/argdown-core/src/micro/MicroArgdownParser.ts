import {
  ArgdownTypes,
  DiscussionPointType,
  IArgument,
  IDiscussionPoint,
  IExcerpt,
  IEquivalenceClass,
  IGraphEntity,
  IRelation,
  IRelationOccurrence,
  IStatement,
  RelationType,
  StatementRole
} from "../model/model.js";
import { IArgdownDiagnostic } from "../diagnostics.js";
import { RuleNames } from "../RuleNames.js";

export interface IMicroOccurrence {
  /** Kept for API compatibility; may be a Discussion Point or Excerpt artifact. */
  discussionPoint: IGraphEntity;
  contextualText?: string;
  relation?: IRelation;
  children: IMicroOccurrence[];
  line: number;
}

export interface IMicroArgdownDocument {
  discussionPoints: { [key: string]: IDiscussionPoint };
  excerpts: { [title: string]: IExcerpt };
  statements: { [title: string]: IEquivalenceClass };
  arguments: { [title: string]: IArgument };
  relations: IRelation[];
  roots: IMicroOccurrence[];
  diagnostics: IArgdownDiagnostic[];
  sourceOccurrences: IMicroSourceOccurrence[];
}

export interface IMicroSourceOccurrence {
  identity: string;
  title: string;
  discussionPointType: DiscussionPointType;
  kind: "definition" | "reference" | "implicit";
  image: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

declare module "../index.js" {
  interface IArgdownResponse {
    microDocument?: IMicroArgdownDocument;
  }
}

type DraftType = DiscussionPointType | undefined;
interface DraftNode {
  identity: string;
  title: string;
  type: DraftType;
  explicitType?: DiscussionPointType;
  isImplicitText: boolean;
  isExplicitIdentifier: boolean;
  definitions: IStatement[];
  dp?: IGraphEntity;
}
interface DraftRelation {
  symbol: string;
  parent: DraftOccurrence;
  child: DraftOccurrence;
  line: number;
  indent: number;
}
interface DraftOccurrence {
  node: DraftNode;
  contextualText?: string;
  hasBlock?: boolean;
  children: DraftOccurrence[];
  relation?: DraftRelation;
  line: number;
}
interface DraftSourceOccurrence {
  node: DraftNode;
  kind: "definition" | "reference" | "implicit";
  image: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

interface MicroBlock {
  content: string;
  endLineIndex: number;
  bodyLineIndexes: number[];
}

const relationPattern =
  /^(=>|<=|\+>|<\+|\^>|<\^|><|:>|<:|%>|<%|!>|<!|\?>|<\?|@>|<@|==|~=|\+|-)\s+(.+)$/;
const headerPattern = /^(?:CONTEXT-FREE DEFINITIONS|DISCOURSE TREE):\s*$/i;
const fencePattern = /^\s*```/;

const stripComments = (
  lines: string[],
  protectedLines: Set<number>
): string[] => {
  let inBlock: "c" | "html" | null = null;
  return lines.map((line, lineIndex) => {
    if (protectedLines.has(lineIndex)) return line;
    let output = "";
    for (let i = 0; i < line.length; i++) {
      if (inBlock === "c") {
        const end = line.indexOf("*/", i);
        if (end === -1) return output;
        inBlock = null;
        i = end + 1;
        continue;
      }
      if (inBlock === "html") {
        const end = line.indexOf("-->", i);
        if (end === -1) return output;
        inBlock = null;
        i = end + 2;
        continue;
      }
      if (line.substr(i, 2) === "/*") {
        inBlock = "c";
        i++;
        continue;
      }
      if (line.substr(i, 4) === "<!--") {
        inBlock = "html";
        i += 3;
        continue;
      }
      if (
        line.substr(i, 2) === "//" &&
        (i === 0 || /\s/.test(line.charAt(i - 1)))
      ) {
        break;
      }
      output += line.charAt(i);
    }
    return output;
  });
};

const markerType = (marker: string): DiscussionPointType => {
  switch (marker) {
    case "?":
      return DiscussionPointType.QUESTION;
    case "@":
      return DiscussionPointType.REFERENCE;
    case ">":
      return DiscussionPointType.EXCERPT;
    default:
      return DiscussionPointType.STATEMENT;
  }
};

const keyFor = (type: DiscussionPointType, title: string): string => {
  if (type === DiscussionPointType.ARGUMENT) return `<${title}>`;
  if (type === DiscussionPointType.QUESTION) return `[?${title}]`;
  if (type === DiscussionPointType.REFERENCE) return `[@${title}]`;
  if (type === DiscussionPointType.EXCERPT) return `[>${title}]`;
  return `[${title}]`;
};

export const parseMicroArgdown = (source: string): IMicroArgdownDocument => {
  const diagnostics: IArgdownDiagnostic[] = [];
  const sourceLines = source
    .split(/\r\n|\n|\r/)
    .map((line) => line.replace(/\t/g, "    "));
  const significantIndents = sourceLines
    .filter(
      (line) =>
        line.trim() &&
        !headerPattern.test(line.trim()) &&
        !fencePattern.test(line)
    )
    .map((line) => (/^ */.exec(line) || [""])[0].length);
  const outerIndent = significantIndents.length
    ? Math.min(...significantIndents)
    : 0;
  const dedentedLines = sourceLines.map((line) => line.slice(outerIndent));
  const protectedBlockLines = new Set<number>();
  for (let index = 0; index < dedentedLines.length; index++) {
    const line = dedentedLines[index];
    if (!/>>\s*(?:\/\/.*)?$/.test(line.trim())) continue;
    const headerIndent = (/^ */.exec(line) || [""])[0].length;
    for (let cursor = index + 1; cursor < dedentedLines.length; cursor++) {
      const candidate = dedentedLines[cursor];
      if (!candidate.trim()) {
        protectedBlockLines.add(cursor);
        continue;
      }
      const indent = (/^ */.exec(candidate) || [""])[0].length;
      if (indent <= headerIndent) break;
      protectedBlockLines.add(cursor);
    }
  }
  const lines = stripComments(dedentedLines, protectedBlockLines);
  const blocks = new Map<number, MicroBlock>();
  const bodyLineIndexes = new Set<number>();
  for (let index = 0; index < lines.length; index++) {
    if (!/>>\s*$/.test(lines[index].trim())) continue;
    const headerIndent = (/^ */.exec(lines[index]) || [""])[0].length;
    const indexes: number[] = [];
    let cursor = index + 1;
    for (; cursor < lines.length; cursor++) {
      const candidate = lines[cursor];
      if (!candidate.trim()) {
        indexes.push(cursor);
        continue;
      }
      const indent = (/^ */.exec(candidate) || [""])[0].length;
      if (indent <= headerIndent) break;
      indexes.push(cursor);
    }
    const nonBlankIndents = indexes
      .filter((i) => lines[i].trim())
      .map((i) => (/^ */.exec(lines[i]) || [""])[0].length);
    const contentIndent = nonBlankIndents.length
      ? Math.min(...nonBlankIndents)
      : headerIndent + 4;
    const contentLines = indexes.map((i) =>
      lines[i].trim() ? lines[i].slice(contentIndent) : ""
    );
    while (
      contentLines.length &&
      contentLines[contentLines.length - 1] === ""
    ) {
      contentLines.pop();
    }
    indexes.forEach((i) => bodyLineIndexes.add(i));
    blocks.set(index, {
      content: contentLines.join("\n"),
      endLineIndex: indexes.length ? indexes[indexes.length - 1] : index,
      bodyLineIndexes: indexes
    });
  }
  const nodes = new Map<string, DraftNode>();
  const explicitTypes = new Map<string, DiscussionPointType>();
  const sourceOccurrences: DraftSourceOccurrence[] = [];

  const diagnose = (
    code: string,
    severity: "error" | "warning" | "information",
    message: string,
    line: number
  ) =>
    diagnostics.push({
      code,
      severity,
      message,
      source: "MicroArgdownParser",
      startLine: line,
      endLine: line,
      startColumn: 1,
      endColumn: 1
    });

  const parseWrapped = (
    text: string
  ): { id: string; type: DiscussionPointType; rest: string } | null => {
    const argument = /^<([^>]+)>(.*)$/.exec(text);
    if (argument)
      return {
        id: argument[1],
        type: DiscussionPointType.ARGUMENT,
        rest: argument[2]
      };
    const statement = /^\[([!?@>]?)([^\]]+)\](.*)$/.exec(text);
    if (!statement) return null;
    return {
      id: statement[2],
      type: markerType(statement[1]),
      rest: statement[3]
    };
  };

  // Pass one: explicit definitions establish the global identifier namespace.
  lines.forEach((line, index) => {
    if (/^\s/.test(line) || !line.trim()) return;
    const wrapped = parseWrapped(line.trim());
    if (!wrapped || !/^\s*(?::|>>\s*$)/.test(wrapped.rest)) return;
    const existing = explicitTypes.get(wrapped.id);
    if (existing && existing !== wrapped.type) {
      diagnose(
        "micro-type-conflict",
        "error",
        `Identifier '${wrapped.id}' is explicitly assigned both '${existing}' and '${wrapped.type}'.`,
        index + 1
      );
    } else {
      explicitTypes.set(wrapped.id, wrapped.type);
    }
  });

  const getNode = (
    identity: string,
    title: string,
    type: DraftType,
    isImplicitText: boolean,
    isExplicitIdentifier: boolean,
    line: number
  ): DraftNode => {
    const existing = nodes.get(identity);
    const globalType = isExplicitIdentifier
      ? explicitTypes.get(title)
      : undefined;
    const resolvedType = globalType || type;
    if (existing) {
      if (resolvedType && existing.type && resolvedType !== existing.type) {
        diagnose(
          "micro-type-conflict",
          "error",
          `Identity '${title}' is used as both '${existing.type}' and '${resolvedType}'.`,
          line
        );
      } else if (resolvedType) {
        existing.type = resolvedType;
      }
      existing.isExplicitIdentifier =
        existing.isExplicitIdentifier || isExplicitIdentifier;
      return existing;
    }
    const node: DraftNode = {
      identity,
      title,
      type: resolvedType,
      explicitType: globalType || type,
      isImplicitText,
      isExplicitIdentifier,
      definitions: []
    };
    nodes.set(identity, node);
    return node;
  };

  const parseNode = (
    text: string,
    line: number,
    column: number,
    allowContext: boolean,
    block?: MicroBlock
  ): DraftOccurrence => {
    const trimmed = text.trim();
    if (trimmed === ">>") {
      const content = block ? block.content : "";
      const node = getNode(
        `excerpt-text:${content}`,
        content,
        DiscussionPointType.EXCERPT,
        true,
        false,
        line
      );
      sourceOccurrences.push({
        node,
        kind: "implicit",
        image: ">>",
        startLine: line,
        endLine: line,
        startColumn: column,
        endColumn: column + 1
      });
      return { node, hasBlock: true, children: [], line };
    }
    const wrapped = parseWrapped(trimmed);
    if (wrapped) {
      const contextMatch = allowContext
        ? /^\s*:\s*(.*)$/.exec(wrapped.rest)
        : null;
      const node = getNode(
        `id:${wrapped.id}`,
        wrapped.id,
        wrapped.type,
        false,
        true,
        line
      );
      const image = trimmed.substring(0, trimmed.length - wrapped.rest.length);
      sourceOccurrences.push({
        node,
        kind: "reference",
        image,
        startLine: line,
        endLine: line,
        startColumn: column,
        endColumn: column + image.length - 1
      });
      if (/^\s*>>\s*$/.test(wrapped.rest)) {
        if (wrapped.type !== DiscussionPointType.EXCERPT) {
          diagnose(
            "micro-non-excerpt-block",
            "error",
            "Micro >> blocks are only valid for Excerpts.",
            line
          );
        }
        return {
          node,
          contextualText: allowContext && block ? block.content : undefined,
          hasBlock: true,
          children: [],
          line
        };
      }
      if (wrapped.rest.trim() && !contextMatch) {
        diagnose(
          "micro-invalid-node-suffix",
          "error",
          "Text after a wrapped Micro entity requires ':' or '>>'.",
          line
        );
      }
      return {
        node,
        contextualText: contextMatch ? contextMatch[1] : undefined,
        children: [],
        line
      };
    }
    const node = getNode(
      `text:${trimmed}`,
      trimmed,
      undefined,
      true,
      false,
      line
    );
    sourceOccurrences.push({
      node,
      kind: "implicit",
      image: trimmed,
      startLine: line,
      endLine: line,
      startColumn: column,
      endColumn: column + trimmed.length - 1
    });
    return {
      node,
      children: [],
      line
    };
  };

  // Collect definition occurrences before discourse parsing.
  lines.forEach((line, index) => {
    if (bodyLineIndexes.has(index) || /^\s/.test(line) || !line.trim()) return;
    const wrapped = parseWrapped(line.trim());
    if (!wrapped) return;
    const inlineDefinition = /^\s*:\s*(.*)$/.exec(wrapped.rest);
    const blockDefinition = /^\s*>>\s*$/.test(wrapped.rest)
      ? blocks.get(index)
      : undefined;
    if (!inlineDefinition && !blockDefinition) return;
    if (blockDefinition && wrapped.type !== DiscussionPointType.EXCERPT) {
      diagnose(
        "micro-non-excerpt-block",
        "error",
        "Micro >> blocks are only valid for Excerpts.",
        index + 1
      );
    }
    const node = getNode(
      `id:${wrapped.id}`,
      wrapped.id,
      wrapped.type,
      false,
      true,
      index + 1
    );
    const image = line
      .trim()
      .substring(0, line.trim().length - wrapped.rest.length);
    sourceOccurrences.push({
      node,
      kind: "definition",
      image: blockDefinition ? `${image} >>` : `${image}:`,
      startLine: index + 1,
      endLine: index + 1,
      startColumn: 1,
      endColumn: blockDefinition ? image.length + 3 : image.length + 1
    });
    node.definitions.push({
      type: ArgdownTypes.STATEMENT,
      title: wrapped.id,
      text: blockDefinition ? blockDefinition.content : inlineDefinition![1],
      role:
        wrapped.type === DiscussionPointType.ARGUMENT
          ? StatementRole.ARGUMENT_DESCRIPTION
          : StatementRole.TOP_LEVEL_STATEMENT,
      discussionPointType: wrapped.type,
      startLine: index + 1,
      endLine: blockDefinition ? blockDefinition.endLineIndex + 1 : index + 1,
      startColumn: 1,
      endColumn: image.length + 1,
      isTopLevel: true
    });
  });

  const roots: DraftOccurrence[] = [];
  const relations: DraftRelation[] = [];
  const occurrenceAtIndent = new Map<number, DraftOccurrence>();
  let indentationUnit = 0;

  lines.forEach((line, index) => {
    if (bodyLineIndexes.has(index)) return;
    const trimmed = line.trim();
    if (!trimmed || headerPattern.test(trimmed) || fencePattern.test(trimmed))
      return;
    const indent = line.length - line.replace(/^\s*/, "").length;
    const wrapped = indent === 0 ? parseWrapped(trimmed) : null;
    if (wrapped && /^\s*(?::|>>\s*$)/.test(wrapped.rest)) return;
    const relationMatch = relationPattern.exec(trimmed);
    if (indent > 0 && relationMatch) {
      if (!indentationUnit) indentationUnit = indent;
      if (
        (indentationUnit !== 2 && indentationUnit !== 4) ||
        indent % indentationUnit !== 0
      ) {
        diagnose(
          "micro-invalid-indentation",
          "error",
          "Relations must use a consistent two- or four-space indentation unit.",
          index + 1
        );
        return;
      }
      const parent = occurrenceAtIndent.get(indent - indentationUnit);
      if (!parent) {
        diagnose(
          "micro-missing-parent",
          "error",
          "Indented relation has no parent at the preceding indentation level.",
          index + 1
        );
        return;
      }
      if (parent.hasBlock) {
        diagnose(
          "micro-block-not-leaf",
          "error",
          "A block-bearing Micro occurrence is a leaf; repeat an explicit Excerpt reference to attach another relation.",
          index + 1
        );
        return;
      }
      const childColumn = indent + relationMatch[1].length + 2;
      const child = parseNode(
        relationMatch[2],
        index + 1,
        childColumn,
        true,
        blocks.get(index)
      );
      const relation: DraftRelation = {
        symbol: relationMatch[1],
        parent,
        child,
        line: index + 1,
        indent
      };
      child.relation = relation;
      parent.children.push(child);
      relations.push(relation);
      occurrenceAtIndent.set(indent, child);
      for (const key of Array.from(occurrenceAtIndent.keys()))
        if (key > indent) occurrenceAtIndent.delete(key);
      return;
    }
    if (indent > 0) {
      diagnose(
        "micro-expected-relation",
        "error",
        "Indented lines must begin with a Micro relation symbol.",
        index + 1
      );
      return;
    }
    const root = parseNode(trimmed, index + 1, 1, false, blocks.get(index));
    roots.push(root);
    occurrenceAtIndent.clear();
    occurrenceAtIndent.set(0, root);
  });

  const setType = (
    node: DraftNode,
    type: DiscussionPointType,
    relation: DraftRelation
  ) => {
    if (node.type && node.type !== type) {
      diagnose(
        "micro-type-conflict",
        "error",
        `Relation '${relation.symbol}' requires '${node.title}' to be '${type}', but it is '${node.type}'.`,
        relation.line
      );
    } else node.type = type;
  };
  const orient = (
    relation: DraftRelation
  ): { from: DraftNode; to: DraftNode } => {
    const reverse = /^(<=|<\+|\+|<\^|<:|<%|<!|<\?|<@)$/.test(relation.symbol);
    return reverse
      ? { from: relation.child.node, to: relation.parent.node }
      : { from: relation.parent.node, to: relation.child.node };
  };

  // Constraint propagation. Any unconstrained node falls back to Statement later.
  for (const relation of relations) {
    const { from, to } = orient(relation);
    switch (relation.symbol) {
      case "=>":
      case "<=":
      case "><":
      case "-":
      case "%>":
      case "<%":
        setType(from, DiscussionPointType.STATEMENT, relation);
        setType(to, DiscussionPointType.STATEMENT, relation);
        break;
      case "!>":
      case "<!":
        setType(from, DiscussionPointType.STATEMENT, relation);
        setType(to, DiscussionPointType.QUESTION, relation);
        break;
      case "?>":
      case "<?":
        setType(from, DiscussionPointType.QUESTION, relation);
        if (to.type === DiscussionPointType.EXCERPT) {
          diagnose(
            "adp-invalid-excerpt-relation",
            "error",
            "Questions may target Discussion Points, not Excerpt artifacts.",
            relation.line
          );
        }
        break;
      case "^>":
      case "<^":
        setType(from, DiscussionPointType.STATEMENT, relation);
        if (to.type === DiscussionPointType.EXCERPT) {
          diagnose(
            "adp-invalid-excerpt-relation",
            "error",
            "Presupposition targets must be Discussion Points, not Excerpt artifacts.",
            relation.line
          );
        }
        break;
      case "@>":
      case "<@":
        if (!from.type) {
          diagnose(
            "micro-ambiguous-type",
            "error",
            `Relation '${relation.symbol}' requires its source to be explicitly typed as Reference or Excerpt.`,
            relation.line
          );
        } else if (
          from.type !== DiscussionPointType.REFERENCE &&
          from.type !== DiscussionPointType.EXCERPT
        ) {
          diagnose(
            "micro-type-conflict",
            "error",
            `Relation '${relation.symbol}' requires a Reference or Excerpt source.`,
            relation.line
          );
        }
        break;
      case ":>":
      case "<:":
        if (!from.type && !to.type) {
          diagnose(
            "micro-ambiguous-type",
            "error",
            `Relation '${relation.symbol}' needs an explicit Statement or Question endpoint type.`,
            relation.line
          );
        }
        if (from.type && !to.type) to.type = from.type;
        if (to.type && !from.type) from.type = to.type;
        break;
      case "==":
      case "~=":
        if (
          from.type === DiscussionPointType.EXCERPT ||
          to.type === DiscussionPointType.EXCERPT
        ) {
          diagnose(
            "adp-excerpt-equality",
            "error",
            "Excerpts use exact text identity and cannot participate in equality relations.",
            relation.line
          );
          break;
        }
        if (!from.type && !to.type) {
          diagnose(
            "micro-ambiguous-type",
            "error",
            `Relation '${relation.symbol}' needs at least one explicitly typed endpoint.`,
            relation.line
          );
        }
        if (from.type && !to.type) to.type = from.type;
        if (to.type && !from.type) from.type = to.type;
        break;
      case "+>":
      case "<+":
      case "+":
        setType(to, DiscussionPointType.STATEMENT, relation);
        if (
          !from.type &&
          (relation.symbol === "<+" || relation.symbol === "+")
        ) {
          from.type = DiscussionPointType.ARGUMENT;
        } else if (!from.type) {
          diagnose(
            "micro-ambiguous-type",
            "error",
            "An untyped '+>' source may be either a Statement or Argument; use an explicit wrapper.",
            relation.line
          );
        }
        break;
    }
  }
  for (const node of nodes.values())
    node.type = node.type || DiscussionPointType.STATEMENT;

  const isDiscussionPoint = (node: DraftNode): boolean =>
    node.type !== DiscussionPointType.EXCERPT;
  for (const relation of relations) {
    const { from, to } = orient(relation);
    const isCitation = relation.symbol === "@>" || relation.symbol === "<@";
    const isEquality = relation.symbol === "==" || relation.symbol === "~=";
    if (isCitation) {
      const valid =
        (from.type === DiscussionPointType.REFERENCE &&
          (isDiscussionPoint(to) || to.type === DiscussionPointType.EXCERPT)) ||
        (from.type === DiscussionPointType.EXCERPT && isDiscussionPoint(to));
      if (!valid) {
        diagnose(
          "adp-invalid-excerpt-relation",
          "error",
          "Citation must be Reference -> Discussion Point, Reference -> Excerpt, or Excerpt -> Discussion Point.",
          relation.line
        );
      }
    } else if (
      !isEquality &&
      (from.type === DiscussionPointType.EXCERPT ||
        to.type === DiscussionPointType.EXCERPT)
    ) {
      diagnose(
        "adp-invalid-excerpt-relation",
        "error",
        "Excerpt artifacts may only participate in citation relations.",
        relation.line
      );
    }
  }

  const discussionPoints: { [key: string]: IDiscussionPoint } = {};
  const excerpts: { [title: string]: IExcerpt } = {};
  const statements: { [title: string]: IEquivalenceClass } = {};
  const argumentsMap: { [title: string]: IArgument } = {};
  const excerptsByText = new Map<string, IExcerpt>();
  for (const node of nodes.values()) {
    const resolvedType = node.type || DiscussionPointType.STATEMENT;
    if (resolvedType === DiscussionPointType.ARGUMENT) {
      const argument: IArgument = {
        type: ArgdownTypes.ARGUMENT,
        title: node.title,
        discussionPointType: resolvedType,
        entityKind: "discussion-point",
        relations: [],
        pcs: [],
        members: node.definitions as any
      };
      node.dp = argument;
      argumentsMap[node.title] = argument;
    } else if (resolvedType === DiscussionPointType.EXCERPT) {
      const definitionTexts = node.definitions
        .filter((member) => !member.isReference && member.text !== undefined)
        .map((member) => member.text as string);
      if (node.isImplicitText && definitionTexts.length === 0) {
        definitionTexts.push(node.title);
      }
      const normalizeExcerpt = (text: string): string =>
        text.replace(/\r\n?|\n/g, "\n").replace(/\n$/, "");
      const normalizedTexts = definitionTexts.map(normalizeExcerpt);
      const canonicalText = normalizedTexts[0];
      if (normalizedTexts.some((text) => text !== canonicalText)) {
        diagnose(
          "adp-excerpt-definition-conflict",
          "error",
          `Excerpt '${node.title}' has definitions with different exact text.`,
          (node.definitions[1] && node.definitions[1].startLine) || 1
        );
      }
      let excerpt =
        canonicalText !== undefined
          ? excerptsByText.get(canonicalText)
          : undefined;
      if (excerpt) {
        excerpt.aliases = excerpt.aliases || [];
        if (
          excerpt.aliases.indexOf(node.title) === -1 &&
          excerpt.title !== node.title
        ) {
          excerpt.aliases.push(node.title);
          diagnose(
            "adp-duplicate-excerpt-alias",
            "information",
            `Excerpt '${node.title}' has the same exact text as '${excerpt.title}' and is treated as an alias.`,
            (node.definitions[0] && node.definitions[0].startLine) || 1
          );
        }
      } else {
        excerpt = IEquivalenceClass.create(node.title) as IExcerpt;
        excerpt.discussionPointType = DiscussionPointType.EXCERPT;
        excerpt.entityKind = "text-artifact";
        excerpt.normalizedText = canonicalText;
        excerpt.aliases = [];
        if (canonicalText !== undefined)
          excerptsByText.set(canonicalText, excerpt);
      }
      excerpt.members.push(...node.definitions);
      node.dp = excerpt;
      excerpts[node.title] = excerpt;
      statements[node.title] = excerpt;
    } else {
      const ec = IEquivalenceClass.create(node.title);
      ec.discussionPointType = resolvedType;
      ec.entityKind = "discussion-point";
      ec.members.push(...node.definitions);
      node.dp = ec;
      statements[node.title] = ec;
    }
    if (node.isImplicitText && node.definitions.length === 0) {
      const firstSourceOccurrence = sourceOccurrences.find(
        (occurrence) => occurrence.node === node
      );
      const implicitDefinition: IStatement = {
        type: ArgdownTypes.STATEMENT,
        title: node.title,
        text: node.title,
        discussionPointType: resolvedType,
        role:
          resolvedType === DiscussionPointType.ARGUMENT
            ? StatementRole.ARGUMENT_DESCRIPTION
            : StatementRole.TOP_LEVEL_STATEMENT,
        isAnonymous: true,
        isTopLevel: true,
        startLine: firstSourceOccurrence && firstSourceOccurrence.startLine,
        endLine: firstSourceOccurrence && firstSourceOccurrence.endLine,
        startColumn: firstSourceOccurrence && firstSourceOccurrence.startColumn,
        endColumn: firstSourceOccurrence && firstSourceOccurrence.endColumn
      };
      node.dp.members.push(implicitDefinition as any);
    }
    (node.dp as any).microIdentity = node.identity;
    node.dp.hasExplicitIdentifier = node.isExplicitIdentifier;
    const definitions = node.dp.members.filter((member) => !member.isReference);
    node.dp.definitionOccurrences = definitions;
    const canonical = definitions.find(
      (member) => !!member.text && member.text.trim().length > 0
    );
    node.dp.canonicalMember = canonical;
    node.dp.canonicalText = canonical && canonical.text;
    if (
      canonical &&
      canonical.text !== undefined &&
      resolvedType !== DiscussionPointType.EXCERPT
    ) {
      for (const alternate of definitions) {
        if (
          alternate !== canonical &&
          alternate.text &&
          alternate.text !== canonical.text
        ) {
          diagnose(
            "adp-competing-context-free-text",
            "warning",
            `Discussion point '${node.title}' has competing context-free text; the first non-empty definition remains canonical.`,
            alternate.startLine || 1
          );
        }
      }
    }
    if (resolvedType !== DiscussionPointType.EXCERPT) {
      const preferredKey = keyFor(resolvedType, node.title);
      const key =
        discussionPoints[preferredKey] &&
        discussionPoints[preferredKey] !== node.dp
          ? `${preferredKey}#${node.identity}`
          : preferredKey;
      discussionPoints[key] = node.dp as IDiscussionPoint;
    }
  }

  const normalizedRelations: IRelation[] = [];
  for (const draft of relations) {
    const oriented = orient(draft);
    const from = oriented.from.dp!;
    const to = oriented.to.dp!;
    let relationType: RelationType;
    switch (draft.symbol) {
      case "=>":
      case "<=":
        relationType = RelationType.IMPLIES;
        break;
      case "+>":
      case "<+":
      case "+":
        relationType =
          from.discussionPointType === DiscussionPointType.ARGUMENT
            ? RelationType.JUSTIFIES
            : RelationType.IMPLIES;
        break;
      case "^>":
      case "<^":
        relationType = RelationType.IS_PRESUPPOSED_BY;
        break;
      case "><":
        relationType = RelationType.CONTRADICTORY;
        break;
      case "-":
        relationType = RelationType.CONTRARY;
        break;
      case ":>":
      case "<:":
        relationType = RelationType.SPECIFIES;
        break;
      case "%>":
      case "<%":
        relationType = RelationType.IS_EXAMPLE_FOR;
        break;
      case "!>":
      case "<!":
        relationType = RelationType.ANSWERS;
        break;
      case "?>":
      case "<?":
        relationType = RelationType.QUESTIONS;
        break;
      case "@>":
      case "<@":
        relationType = RelationType.IS_CITED_BY;
        break;
      case "==":
        relationType = RelationType.EQUAL;
        break;
      default:
        relationType = RelationType.POTENTIALLY_EQUAL;
    }
    const occurrence: IRelationOccurrence = {
      type: ArgdownTypes.RULE_NODE,
      name: RuleNames.RELATIONS,
      children: [],
      startLine: draft.line,
      endLine: draft.line,
      startColumn: draft.indent + 1,
      contextualText: draft.child.contextualText,
      contextualizedEndpoint: oriented.from === draft.child.node ? "from" : "to"
    };
    let relation = normalizedRelations.find(
      (existing) =>
        existing.relationType === relationType &&
        ((existing.from === from && existing.to === to) ||
          (IRelation.isSymmetric(existing) &&
            existing.from === to &&
            existing.to === from))
    );
    if (relation) relation.occurrences.push(occurrence);
    else {
      relation = {
        type: ArgdownTypes.RELATION,
        relationType,
        from,
        to,
        occurrences: [occurrence]
      };
      normalizedRelations.push(relation);
      from.relations!.push(relation);
      to.relations!.push(relation);
    }
  }

  const normalizeSelection = (text: string): string =>
    text.replace(/\s+/g, " ").trim();
  for (const draft of relations) {
    const child = draft.child;
    if (
      child.contextualText === undefined ||
      child.node.type !== DiscussionPointType.EXCERPT
    )
      continue;
    const excerpt = child.node.dp as IExcerpt;
    if (draft.symbol !== "@>" && draft.symbol !== "<@") {
      diagnose(
        "adp-invalid-excerpt-relation",
        "error",
        "Contextual Excerpt text is only valid on a citation relation.",
        draft.line
      );
      continue;
    }
    if (excerpt.normalizedText === undefined) {
      diagnose(
        "adp-excerpt-context-without-root",
        "error",
        `Contextual passage for Excerpt '${child.node.title}' requires a root-level Excerpt definition.`,
        draft.line
      );
      continue;
    }
    if (
      normalizeSelection(child.contextualText) &&
      normalizeSelection(excerpt.normalizedText).indexOf(
        normalizeSelection(child.contextualText)
      ) === -1
    ) {
      diagnose(
        "adp-excerpt-selection-mismatch",
        "warning",
        `Contextual passage is not contained in the root definition of Excerpt '${child.node.title}' after whitespace normalization.`,
        draft.line
      );
    }
  }

  const convertOccurrence = (
    occurrence: DraftOccurrence
  ): IMicroOccurrence => ({
    discussionPoint: occurrence.node.dp!,
    contextualText: occurrence.contextualText,
    relation: occurrence.relation
      ? normalizedRelations.find((relation) =>
          relation.occurrences.some(
            (item) => item.startLine === occurrence.line
          )
        )
      : undefined,
    children: occurrence.children.map(convertOccurrence),
    line: occurrence.line
  });

  return {
    discussionPoints,
    excerpts,
    statements,
    arguments: argumentsMap,
    relations: normalizedRelations,
    roots: roots.map(convertOccurrence),
    diagnostics,
    sourceOccurrences: sourceOccurrences.map((occurrence) => ({
      identity: occurrence.node.identity,
      title: occurrence.node.title,
      discussionPointType:
        occurrence.node.type || DiscussionPointType.STATEMENT,
      kind: occurrence.kind,
      image: occurrence.image,
      startLine: occurrence.startLine,
      endLine: occurrence.endLine,
      startColumn: occurrence.startColumn,
      endColumn: occurrence.endColumn
    }))
  };
};
