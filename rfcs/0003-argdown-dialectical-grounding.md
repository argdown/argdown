# RFC 0003: Dialectical Grounding

| | |
|---|---|
| **RFC** | 0003 |
| **Title** | Dialectical Grounding |
| **Status** | Draft |
| **Authors** | Gregor Betz |
| **Created** | 2026-11-10 |
| **Related** | RFC 0001 (data model), RFC 0002 (validation), RFC 0004 (classical semantics) |

## 1. Summary

This RFC defines when the logical layer of RFC 0001 *grounds* a dialectical relation. Grounding is parametric in a **logical oracle** and does not presuppose any particular logic.

It defines:

- the oracle interface (§2);
- grounding rules (§3);
- queries: derivation and reconciliation (§4);
- two oracles: *identity* and *asserted* (§5). The *asserted* oracle is the normative basis for drawing Argdown argument maps.

RFC 0004 defines classical oracles.

## 2. Logical oracles

A **logical oracle** *O* provides two binary relations on statements:

- `entails`(*s1*, *s2*): *s1* gives reason for *s2*;
- `conflicts`(*s1*, *s2*): *s1* speaks against *s2*.

`entails` MUST be reflexive. `conflicts` need not be symmetric.

## 3. Grounding rules

Here conc(*a*) is the `mainConclusion` of argument *a*, and "a premise of *a*" refers to RFC 0002 §4. Relative to an oracle *O*, a dialectical relation of type `support` or `attack` from source to target is **grounded** iff:

| Source → target | `support` | `attack` |
|---|---|---|
| argument *a1* → argument *a2* | `entails`(conc(*a1*), *p*) for a premise *p* of *a2* | `conflicts`(conc(*a1*), *p*) for a premise *p* of *a2* |
| argument *a* → statement *s* | `entails`(conc(*a*), *s*) | `conflicts`(conc(*a*), *s*) |
| statement *s* → argument *a* | `entails`(*s*, *p*) for a premise *p* of *a* | `conflicts`(*s*, *p*) for a premise *p* of *a* |
| statement *s1* → statement *s2* | `entails`(*s1*, *s2*) | `conflicts`(*s1*, *s2*) |

The pair of statements that satisfies the condition is the **witness**.

Notes:

- An attack on an argument is grounded only through its premises. A rebuttal of an argument's main conclusion is grounded as an attack on that statement.
- Self-relations (source = target) are never grounded.
- Undercuts are not covered.

## 4. Queries

**Derivation.** The **grounded relations** of a model *M* under *O* are all triples (type, source, target) that are grounded, each with its witnesses. They are derived, not stored (RFC 0001, P1).

**Reconciliation.** Each `support` or `attack` triple has one status:

| Status | Asserted in *M* | Grounded under *O* |
|---|---|---|
| **confirmed** | yes | yes |
| **implicit** | no | yes |
| **ungrounded** | yes | no |
| **undetermined** | yes | the source or target is a sketched argument |

Several asserted relations with the same triple (RFC 0001, P5) share one status. A parser or editor MAY assert implicit relations (RFC 0001, P2).

## 5. Oracles defined here

**Identity oracle.**

- `entails`(*s1*, *s2*) iff *s1* = *s2*.
- `conflicts` is empty.

**Asserted oracle.** This oracle is normative for drawing Argdown argument maps.

- `entails`(*s1*, *s2*) iff
  - *s1* = *s2*, or
  - an `equivalent` relation links *s1* and *s2*, or
  - an inference referenced by no argument has premises {*s1*} and conclusion *s2*.
- `conflicts`(*s1*, *s2*) iff a `contradictory` or `contrary` relation links *s1* and *s2*.

The asserted oracle uses no closure. It reproduces Argdown's current map relations if the parser:

- asserts `equivalent` between all statements with the same title, and
- maps `[A] +> [B]` to a standalone inference {*A*} → *B* (RFC 0001 §6).

## 6. Diagnostics

Findings use the format of RFC 0002 §7.

| ID | Check | Severity |
|---|---|---|
| GRD-1 | An asserted `support` or `attack` relation is ungrounded under the chosen oracle. | INFO |

## 7. Out of scope

- grounding of undercuts;
- linked support, where a conclusion grounds a premise only together with other statements;
- graded grounding;
- abduction: finding what would ground an ungrounded relation.

## Appendix A. Map projection (informative)

Argument maps often display only some statements. With a set *V* of displayed statements, Argdown draws grounded relations as follows:

- A relation between two displayed nodes is drawn as is.
- An argument → argument relation with witness (*c*, *p*) is drawn only if neither *c* nor *p* is in *V*. Otherwise the map shows the corresponding argument → statement and statement → argument relations.
