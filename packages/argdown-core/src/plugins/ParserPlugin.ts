import * as argdownLexer from "../lexer.js";
import { parser } from "../parser.js";
import { IArgdownPlugin, IRequestHandler } from "../IArgdownPlugin.js";
import { IArgdownLogger } from "../IArgdownLogger.js";
import { ArgdownPluginError } from "../ArgdownPluginError.js";
import { IArgdownRequest, IArgdownResponse } from "../index.js";
import {
  DiscussionPointType,
  IAstNode,
  IRuleNode,
  ITokenNode
} from "../model/model.js";
import { RuleNames } from "../RuleNames.js";
import { parseMicroArgdown } from "../micro/MicroArgdownParser.js";
import { addDiagnostic } from "../diagnostics.js";
import {
  IToken,
  ILexingError,
  IRecognitionException,
  tokenMatcher,
  EOF,
  createTokenInstance
} from "chevrotain";
import last from "lodash.last";
import { isObject, mergeDefaults } from "../utils.js";
import defaultsDeep from "lodash.defaultsdeep";

declare module "../index.js" {
  interface IArgdownResponse {
    /**
     * The abstract syntax tree of the Argdown input.
     * The tree consists of [[IRuleNode]] objects for every syntax rule applied.
     * Each [[IRuleNode]] contains other [[IRuleNode]] objects or [[IArgdownToken]] objects as children.
     *
     * Plugins can traverse the tree by defining [[IArgdownPlugin.tokenListeners]] and [[IArgdownPlugin.ruleListeners]].
     *
     * Provided by the [[ParserPlugin]].
     */
    ast?: IAstNode;
    /**
     * The list of tokens produced by the Argdown lexer that was used to produce the abstract syntax tree.
     *
     * Provided by the [[ParserPlugin]].
     */
    tokens?: IToken[];
    /**
     * Errors thrown by the lexer.
     *
     * Provided by the [[ParserPlugin]].
     */
    lexerErrors?: ILexingError[];
    /**
     * Errors thrown by the parser.
     *
     * Provided by the [[ParserPlugin]].
     */
    parserErrors?: IRecognitionException[];
  }
  interface IArgdownRequest {
    /**
     * Settings of the parser plugin. The parser plugin executes parser *and*  lexer.
     */
    parser?: IParserPluginSettings;
  }
}
export interface IParserPluginSettings {
  /**
   * Throw exceptions if parser or lexer returns error. Otherwise will simply add the errors to the response. By default set to false.
   */
  throwExceptions?: boolean;
  /**
   * Selects Argdown syntax mode.
   *
   * "argdown" keeps legacy behavior.
   * "argdown+" enables strict extended ADP syntax.
   * "micro-argdown+" enables the condensed drafting dialect.
   */
  syntax?: "argdown" | "argdown+" | "micro-argdown+";
}
const defaultSettings: IParserPluginSettings = {
  throwExceptions: false,
  syntax: "argdown"
};

/**
 * The ParserPlugin is the most basic building block of an ArgdownApplication.
 * It takes a string provided in [[IArgdownRequest.input]]
 * and scans it for tokens. The resulting tokens list is added to the [[IArgdownResponse.tokens]] response property.
 * The tokens are parsed into an abstract syntax tree (AST).
 * The AST is added to the [[IArgdownResponse.ast]] response property.
 *
 * The AST is then used by the [[ModelPlugin]] to build the basic data model used by most other plugins.
 *
 * Lexer errors are added to [[IArgdownResponse.lexerErrors]] response property. Parser errors are added to the [[IArgdownResponse.parserErrors]] response property.
 * These errors can be used to build an Argdown linter.
 */
export class ParserPlugin implements IArgdownPlugin {
  name: string = "ParserPlugin";
  defaults: IParserPluginSettings = {};
  constructor(config?: IParserPluginSettings) {
    this.defaults = defaultsDeep({}, config, defaultSettings);
  }
  getSettings = (request: IArgdownRequest) => {
    if (!isObject(request.parser)) {
      request.parser = {};
    }
    return request.parser;
  };
  prepare: IRequestHandler = (request) => {
    mergeDefaults(this.getSettings(request), this.defaults);
  };

  run(
    request: IArgdownRequest,
    response: IArgdownResponse,
    logger: IArgdownLogger
  ) {
    if (!request.input) {
      throw new ArgdownPluginError(
        this.name,
        "missing-input-request-field",
        "No input field in request."
      );
    }
    const settings = this.getSettings(request);
    if (settings.syntax === "micro-argdown+") {
      const document = parseMicroArgdown(request.input);
      response.microDocument = document;
      response.discussionPoints = document.discussionPoints;
      response.excerpts = document.excerpts;
      response.statements = document.statements;
      response.arguments = document.arguments;
      response.relations = document.relations;
      response.diagnostics = document.diagnostics;
      const microTokens = document.sourceOccurrences.map(
        (occurrence, index) => {
          const isArgument =
            occurrence.discussionPointType === DiscussionPointType.ARGUMENT;
          const tokenType = isArgument
            ? occurrence.kind === "definition"
              ? argdownLexer.ArgumentDefinition
              : argdownLexer.ArgumentReference
            : occurrence.kind === "definition"
              ? argdownLexer.StatementDefinition
              : argdownLexer.StatementReference;
          const token = createTokenInstance(
            tokenType,
            occurrence.image,
            index,
            index + occurrence.image.length - 1,
            occurrence.startLine,
            occurrence.endLine,
            occurrence.startColumn,
            occurrence.endColumn
          ) as ITokenNode;
          token.title = occurrence.title;
          return token;
        }
      );
      response.tokens = microTokens;
      response.lexerErrors = [];
      response.parserErrors = [];
      response.ast = IRuleNode.create(RuleNames.ARGDOWN, microTokens);
      if (
        settings.throwExceptions &&
        document.diagnostics.some(
          (diagnostic) => diagnostic.severity === "error"
        )
      ) {
        throw new ArgdownPluginError(
          this.name,
          "micro-parser-error",
          JSON.stringify(document.diagnostics)
        );
      }
      return response;
    }
    const lexResult = argdownLexer.tokenize(request.input, settings.syntax);
    response.tokens = lexResult.tokens;
    response.lexerErrors = lexResult.errors;
    parser.input = lexResult.tokens;
    response.ast = parser.argdown();
    response.parserErrors = parser.errors;

    for (const error of response.lexerErrors || []) {
      addDiagnostic(response, {
        code: "lexer-error",
        severity: "error",
        source: this.name,
        message: error.message,
        startLine: error.line,
        endLine: error.line,
        startColumn: error.column,
        endColumn: (error.column ?? 1) + error.length,
        startOffset: error.offset,
        endOffset: error.offset + error.length
      });
    }
    if (response.lexerErrors && response.lexerErrors.length > 0) {
      if (settings.throwExceptions) {
        // do throw error instead of returning a response
        throw new ArgdownPluginError(
          this.name,
          "lexer-error",
          JSON.stringify(response.lexerErrors)
        );
      } else {
        logger.log(
          "verbose",
          "[ParserPlugin]: Lexer returned errors.\n" +
            JSON.stringify(response.lexerErrors)
        );
      }
    }
    if (response.parserErrors && response.parserErrors.length > 0) {
      // //add location if token is EOF
      const lastToken = last(response.tokens);
      for (const error of response.parserErrors) {
        if (error.token && tokenMatcher(error.token, EOF)) {
          const startLine = (lastToken && lastToken.endLine) || 1;
          const endLine = startLine;
          const startOffset = (lastToken && lastToken.endOffset) || 1;
          const endOffset = startOffset;
          const startColumn = (lastToken && lastToken.endColumn) || 1;
          const endColumn = startColumn;
          const newToken = createTokenInstance(
            EOF,
            "",
            startOffset,
            endOffset,
            startLine,
            endLine,
            startColumn,
            endColumn
          );
          error.token = newToken;
        }
        addDiagnostic(
          response,
          {
            code: "parser-error",
            severity: "error",
            source: this.name,
            message: error.message
          },
          error.token
        );
      }
      if (settings.throwExceptions) {
        // do throw error instead of returning a response
        throw new ArgdownPluginError(
          this.name,
          "parser-error",
          JSON.stringify(response.parserErrors)
        );
      } else {
        logger.log(
          "verbose",
          "[ParserPlugin]: Parser returned errors.\n" +
            JSON.stringify(response.parserErrors)
        );
      }
    }
    return response;
  }
}
