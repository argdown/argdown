import { Location, Range } from "vscode-languageserver";
import {
  IAstNode,
  IEquivalenceClass,
  IArgument,
  ArgdownTypes,
  isRuleNode,
  HasLocation,
  IArgdownResponse,
  RelationMember,
  IRelation,
  RelationType,
  deriveImplicitRelations
} from "@argdown/core";

export const createLocation = (uri: string, el: HasLocation): Location => {
  return Location.create(uri, createRange(el));
};

/**
 *  Creates a range from an Argdown node, statement or argument
 * Chevrotain locations have to be transformed to VS Code locations
 **/
export const createRange = (el: HasLocation): Range => {
  return Range.create(
    (el.startLine || 1) - 1,
    (el.startColumn || 1) - 1,
    (el.endLine || 1) - 1,
    el.endColumn || 1
  );
};

export const formatStatementTitle = (
  title: string,
  discussionPointType?: string
): string => {
  if (discussionPointType === "question") {
    return `[?${title}]`;
  }
  if (discussionPointType === "reference") {
    return `[@${title}]`;
  }
  if (discussionPointType === "excerpt") {
    return `[>${title}]`;
  }
  return `[${title}]`;
};

export const formatDiscussionPointTitle = (member: RelationMember): string => {
  if (member.type === ArgdownTypes.ARGUMENT) {
    return `<${member.title}>`;
  }
  return formatStatementTitle(
    member.title,
    (member as any).discussionPointType
  );
};

const relationSymbols: { [key: string]: { forward: string; reverse: string } } =
  {
    support: { forward: "+>", reverse: "+" },
    attack: { forward: "->", reverse: "<-" },
    entails: { forward: "+>", reverse: "+" },
    contrary: { forward: "->", reverse: "<-" },
    undercut: { forward: "_>", reverse: "<_" },
    contradictory: { forward: "><", reverse: "><" },
    implies: { forward: "=>", reverse: "<=" },
    justifies: { forward: "+>", reverse: "+" },
    "is-presupposed-by": { forward: "^>", reverse: "^" },
    specifies: { forward: ":>", reverse: "<:" },
    "is-example-for": { forward: "%>", reverse: "%" },
    questions: { forward: "?>", reverse: "?" },
    answers: { forward: "!>", reverse: "!" },
    "is-cited-by": { forward: "@>", reverse: "@" },
    equal: { forward: "==", reverse: "==" },
    "potentially-equal": { forward: "~=", reverse: "~=" }
  };
const getRelationSymbol = (
  relationType: string,
  isOutgoing: boolean
): string => {
  const config = relationSymbols[relationType];
  if (!config) {
    return isOutgoing ? "<+?" : "+>?";
  }
  return isOutgoing ? config.reverse : config.forward;
};
const generateArgdownRelationString = function (
  relationType: RelationType,
  isOutgoing: boolean,
  relationPartner: RelationMember
) {
  const relationPartnerStr = formatDiscussionPointTitle(relationPartner);
  const relationSymbol = getRelationSymbol(relationType, isOutgoing);
  return `
  ${relationSymbol} ${relationPartnerStr}`;
};
const generateArgdownRelationStringFromRelation = function (
  relation: IRelation,
  member: RelationMember
) {
  const isOutgoing = relation.to === member;
  const otherRelationMember = isOutgoing ? relation.from : relation.to;
  return generateArgdownRelationString(
    relation.relationType,
    isOutgoing,
    otherRelationMember
  );
};
const caveat = `

// Additional implicit relations may be derivable from relation combination.`;
export const generateMarkdownForStatement = (
  eqClass: IEquivalenceClass,
  response: IArgdownResponse
): string => {
  const explicitRelations = eqClass.relations || [];
  const implicitRelations = deriveImplicitRelations(
    eqClass,
    response.statements,
    response.arguments
  );
  let explicitRelationsStr = "";
  for (const relation of explicitRelations) {
    if (relation.to.type === ArgdownTypes.INFERENCE) {
      //we can not refer directly to inferences, only to arguments (undercuts will only appear in implicit relations)
      continue;
    }
    explicitRelationsStr += generateArgdownRelationStringFromRelation(
      relation,
      eqClass
    );
  }
  let implicitRelationsStr = "";
  if (implicitRelations.length > 0) {
    implicitRelationsStr = "\n  // implicit relations derived from pcs";
    for (const relation of implicitRelations) {
      if (relation.to.type === ArgdownTypes.INFERENCE) {
        //we can not refer directly to inferences, only to arguments (undercuts will only appear in implicit relations)
        continue;
      }

      implicitRelationsStr += generateArgdownRelationStringFromRelation(
        relation,
        eqClass
      );
    }
  }

  let text = IEquivalenceClass.getCanonicalMemberText(eqClass);
  if (text) {
    text = ": " + text;
  } else {
    text = "";
  }
  return `
\`\`\`argdown
${formatStatementTitle(
  eqClass.title,
  (eqClass as any).discussionPointType
)}${text}${explicitRelationsStr}${implicitRelationsStr}${caveat}
\`\`\``;
};

export const generateMarkdownForArgument = (
  argument: IArgument,
  response: IArgdownResponse
): string => {
  const explicitRelations = argument.relations || [];
  const implicitRelations = deriveImplicitRelations(
    argument,
    response.statements,
    response.arguments
  );
  let explicitRelationsStr = "";
  for (const relation of explicitRelations) {
    if (relation.to.type === ArgdownTypes.INFERENCE) {
      //we can not refer directly to inferences, only to arguments (undercuts will only appear in implicit relations)
      continue;
    }
    explicitRelationsStr += generateArgdownRelationStringFromRelation(
      relation,
      argument
    );
  }
  let implicitRelationsStr = "";
  if (implicitRelations.length > 0) {
    implicitRelationsStr = " \n // implicit relations derived from pcs";
    for (const relation of implicitRelations) {
      if (relation.to.type === ArgdownTypes.INFERENCE) {
        //we can not refer directly to inferences, only to arguments (undercuts will only appear in implicit relations)
        continue;
      }

      implicitRelationsStr += generateArgdownRelationStringFromRelation(
        relation,
        argument
      );
    }
  }
  let desc = IArgument.getCanonicalMemberText(argument);
  if (desc) {
    desc = ": " + desc;
  } else {
    desc = "";
  }
  return `
\`\`\`argdown
<${
    argument.title
  }>${desc}${explicitRelationsStr}${implicitRelationsStr}${caveat}
\`\`\``;
};

export const walkTree = (
  node: IAstNode,
  parentNode: any,
  childIndex: number,
  callback: (node: any, parentNode: any, childIndex: number) => void
) => {
  if (node) {
    callback(node, parentNode, childIndex);
    if (isRuleNode(node) && node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        walkTree(child, node, i, callback);
      }
    }
  }
};
