import { RelationType } from "./model.js";

export const isWeakRelationType = (relationType: RelationType): boolean =>
  relationType === RelationType.POTENTIALLY_EQUAL ||
  relationType === RelationType.IS_EXAMPLE_FOR ||
  relationType === RelationType.QUESTIONS ||
  relationType === RelationType.IS_CITED_BY;
