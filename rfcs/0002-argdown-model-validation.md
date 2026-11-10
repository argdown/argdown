# RFC 0002: Validation of the Argdown Data Model

| | |
|---|---|
| **RFC** | 0002 |
| **Title** | Validation of the Argdown Data Model |
| **Status** | Draft |
| **Authors** | Gregor Betz |
| **Created** | 2026-11-10 |
| **Related** | RFC 0001 (data model), RFC 0003 (dialectical grounding), RFC 0004 (classical semantics), planned RFC 0005 (RDF/SHACL encoding) |

## 1. Summary

This RFC defines validation checks for models of RFC 0001. Checks are grouped into *conformance* (errors: not a model instance) and *diagnostics* (warnings and infos: a valid but possibly flawed model).

## 2. Scope

Validation uses only:

- asserted content (RFC 0001, P1), and
- the **structural derivations** of §4, which depend on graph shape only.

Checks that rely on the *meaning* of logical relations or inferences belong to RFC 0003 (grounding) and RFC 0004 (consistency, entailment).

## 3. Concepts

- **Check:** a test on a model. Each check has an ID, a category, an input level and a severity.
- **Input level:** *asserted* (asserted content only) or *structural* (asserted content plus §4).
- **Severity:** `ERROR`, `WARNING` or `INFO`. Severity is fixed per check.
- **Finding:** the result of a failed check (§7).

## 4. Structural derivations

For an argument *a* with referenced inferences *I(a)*:

- **inference graph of *a*:** directed graph on statements with an edge *p* → *c* for each premise *p* of each inference in *I(a)* with conclusion *c*;
- **premises of *a*:** statements that are premises of some inference in *I(a)* and the conclusion of none;
- **intermediate conclusions of *a*:** statements that are the conclusion of some inference in *I(a)* and a premise of some other;
- **final conclusions of *a*:** statements that are the conclusion of some inference in *I(a)* and a premise of none.

## 5. Conformance

Severity: `ERROR`. Input level: asserted, except C10 (structural, no closure).

- C1. The sets of RFC 0001 §4.1 are pairwise disjoint, and every entity has a unique identifier.
- C2. A statement has a `label`, a `text`, or both.
- C3. Every inference has a non-empty premise set of statements and exactly one conclusion statement.
- C4. Logical relations connect exactly two statements and have one of the types in RFC 0001 §4.6.
- C5. Dialectical relations respect the type, source and target table in RFC 0001 §4.7.
- C6. Subdebate members are nodes.
- C7. The model holds exactly one debate.
- C8. No relation, logical or dialectical, connects a statement to itself.
- C9. An argument references at least one inference if and only if it has a `mainConclusion`.
- C10. An argument's `mainConclusion` is one of its final conclusions (§4).

## 6. Diagnostics

### 6.1 Completeness

| ID | Check | Input | Severity |
|---|---|---|---|
| COMP-1 | An argument has no `label`. | asserted | WARNING |
| COMP-2 | A statement occurs in no inference, relation or subdebate. | asserted | INFO |

### 6.2 Inference structure

| ID | Check | Input | Severity |
|---|---|---|---|
| INF-1 | An argument's inference graph is not weakly connected. | structural | WARNING |
| INF-2 | An argument's inference graph contains a cycle. | structural | WARNING |
| INF-3 | An argument has more than one final conclusion. | structural | WARNING |
| INF-4 | An inference's conclusion is also one of its premises. | asserted | WARNING |
| INF-5 | Two premises of an argument are linked as `contradictory` or `contrary`. | structural | WARNING |
| INF-6 | A premise of an argument and its `mainConclusion` are linked as `contradictory` or `contrary`. | structural | WARNING |
| INF-7 | Two inferences have the same premises and the same conclusion. | asserted | INFO |

### 6.3 Dialectical relations

| ID | Check | Input | Severity |
|---|---|---|---|
| DIA-1 | A dialectical relation connects an argument to itself. | asserted | WARNING |
| DIA-2 | An argument and a statement are connected, with the same source and target, by both a `support` and an `attack` relation. | asserted | WARNING |
| DIA-3 | Two dialectical relations have the same type, source and target. | asserted | INFO |

An argument MAY both support and attack another argument; this is not flagged.

### 6.4 Logical relations

| ID | Check | Input | Severity |
|---|---|---|---|
| LOG-1 | Two statements are linked as both `equivalent` and `contradictory` (unsatisfiable). | asserted | WARNING |
| LOG-2 | Two statements are linked as both `equivalent` and `contrary` (satisfiable, but both are forced false). | asserted | WARNING |
| LOG-3 | Two statements are linked as both `contradictory` and `contrary` (redundant). | asserted | INFO |
| LOG-4 | Two logical relations have the same type and the same members. | asserted | INFO |

## 7. Findings

A finding has:

- `focus`: the entity the check failed on;
- `check`: the check ID;
- `severity`;
- `message`: a human-readable explanation.

A model *conforms* if it produces no `ERROR` finding. Reasoners following RFC 0003 or RFC 0004 SHOULD report their diagnostics in the same format.

## 8. Unresolved questions

1. Encoding in SHACL: `sh:conforms` is false for any result, including warnings, so "conforms" in §7 differs from SHACL's.
