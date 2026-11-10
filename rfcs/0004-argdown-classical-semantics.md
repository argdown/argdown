# RFC 0004: Classical Semantics for the Argdown Data Model

| | |
|---|---|
| **RFC** | 0004 |
| **Title** | Classical Semantics for the Argdown Data Model |
| **Status** | Draft |
| **Authors** | Gregor Betz |
| **Created** | 2026-11-10 |
| **Related** | RFC 0001 (data model), RFC 0002 (validation), RFC 0003 (dialectical grounding) |

## 1. Summary

This RFC gives the logical layer of RFC 0001 a classical propositional semantics. On that basis it defines consistency, entailed relations between statements and further queries. It also defines classical oracles for dialectical grounding (RFC 0003).

Reasoners following this RFC produce derived facts and diagnostics. Neither becomes part of the model (RFC 0001, P1).

## 2. Classical semantics

Each statement is a propositional atom. Logical relations and inferences translate as follows:

| Element | Formula |
|---|---|
| `equivalent`(*s1*, *s2*) | *s1* ↔ *s2* |
| `contradictory`(*s1*, *s2*) | *s1* ↔ ¬*s2* |
| `contrary`(*s1*, *s2*) | ¬(*s1* ∧ *s2*) |
| inference *P* → *c* | (∧*P*) → *c* |

Inferences are read **deductively**. Defeasible inferences are out of scope (§7).

Two theories are used:

- ***T_L***: the translation of all logical relations;
- ***T_D***: *T_L* plus the translation of all inferences.

*T_L* consists of 2-clauses only, so its satisfiability and entailments are decidable in polynomial time (2-SAT). *T_D* is general SAT.

## 3. Logical relations

**Consistency.** The logical relations are *consistent* iff *T_L* is satisfiable.

The following definitions assume that *T_L* is consistent.

**Entailed relations.** For two statements *s1*, *s2*, the entailed relations are those of the four clauses below that *T_L* entails:

| Clause | Name |
|---|---|
| *s1* → *s2* | *s1* implies *s2* |
| *s2* → *s1* | *s2* implies *s1* |
| ¬(*s1* ∧ *s2*) | *s1* and *s2* are contrary |
| *s1* ∨ *s2* | *s1* and *s2* are subcontrary |

Combinations are named as usual: mutual implication is *equivalence*; contrariety plus subcontrariety is *contradiction*. If none is entailed, *s1* and *s2* are *unrelated*. *s1* **contradicts** *s2* if they are contrary (which includes contradiction).

**Equivalence classes.** *s1* and *s2* are in the same equivalence class iff *T_L* ⊨ *s1* ↔ *s2*. These classes are the strongly connected components of the 2-SAT implication graph. Following `equivalent` links, and chains of two `contradictory` links, computes part of each class.

## 4. Inferences

**Consistency.** A debate is *consistent* iff *T_D* is satisfiable.

Assuming that *T_D* is consistent, reasoners MAY answer:

- **Entailment:** does *T_D* ∪ *P* ⊨ *c* hold, for *P* ⊆ *S* and *c* ∈ *S*?
- **Joint consistency:** is *T_D* ∪ *K* satisfiable, for *K* ⊆ *S*?
- **Inferential redundancy:** is every inference of an argument *a* entailed by *T_L* together with the inferences not referenced by *a*?

## 5. Classical oracles

For a theory *T* ∈ {*T_L*, *T_D*}, the classical oracle *O_T* (RFC 0003 §2) is:

- `entails`(*s1*, *s2*) iff *T* ⊨ *s1* → *s2*;
- `conflicts`(*s1*, *s2*) iff *T* ⊨ ¬(*s1* ∧ *s2*).

*O_TL* is cheap, and depends only on the logical relations. *O_TD* grounds relations "relative to the debate", possibly through other arguments' inferences.

Both oracles are informative only if *T* is consistent. If it is not, everything entails and conflicts with everything.

## 6. Diagnostics

Findings use the format of RFC 0002 §7.

| ID | Check | Severity |
|---|---|---|
| SEM-1 | *T_L* is unsatisfiable. | WARNING |
| SEM-2 | *T_D* is unsatisfiable. | WARNING |

## 7. Unresolved questions

1. **Defeasible inferences.** Should they get their own semantics, or a flag that excludes them from *T_D*?
2. **Reasoning under inconsistency.** All queries become trivial if *T_L* or *T_D* is unsatisfiable. Should we use maximal consistent subsets, or a paraconsistent semantics?
3. **Severities** of SEM-1 and SEM-2.
