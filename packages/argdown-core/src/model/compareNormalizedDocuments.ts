import {
  ArgdownTypes,
  DiscussionPointType,
  IDiscussionPoint,
  IExcerpt,
  IGraphEntity,
  IRelation,
  RelationType
} from "./model.js";

export interface INormalizedGraphLike {
  discussionPoints?: { [key: string]: IDiscussionPoint };
  excerpts?: { [key: string]: IExcerpt };
  relations?: IRelation[];
}

const endpointKey = (endpoint: IRelation["from"]): string => {
  if (!endpoint) return "missing";
  if (endpoint.type === ArgdownTypes.INFERENCE) {
    return `inference:${endpoint.argumentTitle}:${endpoint.conclusionIndex}`;
  }
  return `${endpoint.discussionPointType || DiscussionPointType.STATEMENT}:${endpoint.title}`;
};

export const normalizedGraphSnapshot = (graph: INormalizedGraphLike): any => ({
  entities: Array.from(
    new Set<IGraphEntity>([
      ...Object.values(graph.discussionPoints || {}),
      ...Object.values(graph.excerpts || {})
    ])
  )
    .map((dp) => ({
      key: endpointKey(dp),
      text: dp.canonicalText,
      aliases:
        dp.discussionPointType === DiscussionPointType.EXCERPT
          ? [...((dp as IExcerpt).aliases || [])].sort()
          : undefined,
      definitions: (dp.definitionOccurrences || []).map((member) => member.text)
    }))
    .sort((a, b) => a.key.localeCompare(b.key)),
  relations: (graph.relations || [])
    .map((relation) => {
      let from = endpointKey(relation.from);
      let to = endpointKey(relation.to);
      if (
        (relation.relationType === RelationType.CONTRARY ||
          relation.relationType === RelationType.CONTRADICTORY ||
          relation.relationType === RelationType.EQUAL ||
          relation.relationType === RelationType.POTENTIALLY_EQUAL) &&
        from > to
      ) {
        const swap = from;
        from = to;
        to = swap;
      }
      return {
        type: relation.relationType,
        from,
        to,
        contexts: relation.occurrences.map((occurrence) => ({
          endpoint: occurrence.contextualizedEndpoint,
          text: occurrence.contextualText,
          data: occurrence.contextualData
        }))
      };
    })
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
});

export const normalizedGraphsEqual = (
  left: INormalizedGraphLike,
  right: INormalizedGraphLike
): boolean =>
  JSON.stringify(normalizedGraphSnapshot(left)) ===
  JSON.stringify(normalizedGraphSnapshot(right));
