# Argdown RFCs

This folder holds Requests for Comments (RFCs): design documents for substantial changes to Argdown, such as specifications, data models or new language features.

## Process

1. Create a branch `rfc/NNNN-short-title` and add `rfcs/NNNN-short-title.md`. `NNNN` is the next free four-digit number.
2. Open a pull request. Discussion happens on the PR.
3. The status in the RFC header moves through `Draft` → `Under review` → `Accepted` | `Rejected` | `Withdrawn`. An accepted RFC can later become `Superseded` by another RFC.

## Template

Each RFC starts with a header table (number, title, status, authors, created, related RFCs) and usually has these sections:

- **Summary**: one paragraph.
- **Motivation**: why the change is needed.
- **Design**: the proposal itself. Normative parts use the key words MUST, MUST NOT, SHOULD and MAY as defined in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).
- **Alternatives considered**: the options that were rejected, and why.
- **Unresolved questions**: what still has to be decided.

## Index

| RFC | Title | Status |
|---|---|---|
| [0001](0001-argdown-data-model.md) | Abstract Argdown Data Model | Draft |
