import { IArgdownPlugin, IRequestHandler } from "../IArgdownPlugin.js";
import { IRuleNodeHandler, ITokenNodeHandler } from "../ArgdownTreeWalker.js";
import { checkResponseFields } from "../ArgdownPluginError.js";
import { ITokenNode, IRuleNode, isConclusion } from "../model/model.js";
import { TokenNames } from "../TokenNames.js";
import { RuleNames } from "../RuleNames.js";
import { IArgdownRequest, IArgdownResponse } from "../index.js";
import {
  validateLink,
  normalizeLink,
  mergeDefaults,
  getHtmlId,
  escapeHtml,
  validateColorString,
  DefaultSettings,
  isObject
} from "../utils.js";
import defaultsDeep from "lodash.defaultsdeep";

const getTypedStatementMarker = (
  request: IArgdownRequest,
  token: ITokenNode
): string => {
  if (!request.parser || request.parser.syntax !== "argdown+") return "";
  const match = /\[([!?@>])/.exec(token.image);
  return match ? match[1] : "";
};

/**
 * Settings used by the HTMLExportPlugin
 */
export interface IHtmlExportSettings {
  /**
   * Remove sourrounding html and body tags, remove head section of HTML.
   *
   * Instead a simple div containing the argdown HTML is returned.
   */
  headless?: boolean;
  /**
   * Create a document header from config data
   *
   * Looks for config.title,  config.author, config.date, config.subTitle and config.abstract.
   * If present will insert the data into a header section, using h1 for the title.
   * The only field required for this is the title field.
   *
   */
  createHeaderFromMetadata?: boolean;
  /**
   * External CSS file to include in the HTML head section.
   */
  cssFile?: string;
  lang?: string;
  charset?: string;
  allowFileProtocol?: boolean;
  /** Optional setting to specify a custom head section. */
  head?: string;
  /** Function to test if a link is valid. */
  validateLink?: (url: string, allowFile: boolean) => boolean;
  /** Function to normalize links. */
  normalizeLink?: (url: string) => string;
  /** Where should the html file be saved (if SaveAsPlugin is used)? */
  outputDir?: string;
  css?: string;
}
const defaultSettings: DefaultSettings<IHtmlExportSettings> = {
  headless: false,
  createHeaderFromMetadata: true,
  cssFile: "./argdown.css",
  lang: "en",
  charset: "utf8",
  allowFileProtocol: false,
  validateLink: validateLink,
  normalizeLink: normalizeLink
};
declare module "../index.js" {
  interface IArgdownRequest {
    /**
     * Settings for the [[HtmlExportPlugin]]
     */
    html?: IHtmlExportSettings;
  }
  interface IArgdownResponse {
    /**
     * Exported html
     *
     * Provided by the [[HtmlExportPlugin]]
     **/
    html?: string;
    /**
     * Temporary store of ids for the [[HtmlExportPlugin]]
     */
    htmlIds?: { [id: string]: boolean } | null;
  }
}
/**
 * Exports the Argdown code to HTML.
 *
 * Depends on data from: ParserPlugin, ModelPlugin
 *
 * Can use data from: TagPlugin
 */
export class HtmlExportPlugin implements IArgdownPlugin {
  name = "HtmlExportPlugin";
  defaults: IHtmlExportSettings;
  ruleListeners: { [eventId: string]: IRuleNodeHandler };
  tokenListeners: { [eventId: string]: ITokenNodeHandler };
  getSettings(request: IArgdownRequest) {
    let settings = request.html;
    if (!isObject(settings)) {
      settings = {};
      request.html = settings;
    }
    return settings;
  }
  prepare: IRequestHandler = (request, response) => {
    checkResponseFields(this, response, ["statements", "arguments", "ast"]);
    mergeDefaults(this.getSettings(request), this.defaults);
  };
  constructor(config?: IHtmlExportSettings) {
    this.defaults = defaultsDeep({}, config, defaultSettings);
    this.tokenListeners = {
      [TokenNames.STATEMENT_DEFINITION]: (
        request,
        response,
        token,
        parentNode
      ) => {
        const htmlId = getHtmlId(
          "statement",
          token.title ?? "untitled",
          response.htmlIds ?? undefined
        );
        response.htmlIds![htmlId] = true;
        let classes = "definition statement-definition definiendum";
        if (parentNode!.equivalenceClass && parentNode!.equivalenceClass.tags) {
          classes +=
            " " +
            this.getCssClassesFromTags(
              response,
              parentNode!.equivalenceClass.tags
            );
        }
        const isTopLevel = parentNode!.statement!.isTopLevel;
        if (isTopLevel) {
          classes += " top-level";
        }

        const marker = getTypedStatementMarker(request, token);
        response.html += `<span id="${htmlId}" class="${classes}">[${marker}<span class="title statement-title">${escapeHtml(
          token.title
        )}</span>]: </span>`;
      },
      [TokenNames.STATEMENT_REFERENCE]: (
        request,
        response,
        token,
        parentNode
      ) => {
        const htmlId = getHtmlId("statement", token.title ?? "untitled");
        let classes = "reference statement-reference";
        if (parentNode!.equivalenceClass && parentNode!.equivalenceClass.tags) {
          classes +=
            " " +
            this.getCssClassesFromTags(
              response,
              parentNode!.equivalenceClass.tags
            );
        }
        const isTopLevel = parentNode!.statement!.isTopLevel;
        if (isTopLevel) {
          classes += " top-level";
        }

        const marker = getTypedStatementMarker(request, token);
        response.html += `<a href="#${htmlId}" class="${classes}">[${marker}<span class="title statement-title">${escapeHtml(
          token.title
        )}</span>] </a>`;
      },
      [TokenNames.STATEMENT_MENTION]: (
        request,
        response,
        token,
        _parentNode,
        _childIndex,
        logger
      ) => {
        const equivalenceClass = response.statements![token.title!];
        let classes = "mention statement-mention";
        if (!equivalenceClass) {
          logger.log(
            "error",
            "Mentioned statement not found: " + (token.title ?? "untitled")
          );
        }
        if (equivalenceClass && equivalenceClass.tags) {
          classes +=
            " " + this.getCssClassesFromTags(response, equivalenceClass.tags);
        }
        const htmlId = getHtmlId("statement", token.title!);
        const marker = getTypedStatementMarker(request, token);
        response.html += `<a href="#${htmlId}" class="${classes}">@[${marker}<span class="title statement-title">${escapeHtml(
          token.title
        )}</span>]</a>${token.trailingWhitespace}`;
      },
      [TokenNames.ARGUMENT_REFERENCE]: (
        _request,
        response,
        token,
        parentNode
      ) => {
        const argument =
          response.arguments![token.title ?? "untitled"] ||
          response.arguments![(token.title ?? "untitled") + " - 1"]; // if argument was exploded, simply take argument generated from first step
        const htmlId = "";
        if (argument.members.length == 0 && argument.pcs.length == 0) {
          const htmlId = getHtmlId(
            "argument",
            token.title ?? "untitled",
            response.htmlIds ?? undefined
          );
          response.htmlIds![htmlId] = true;
        }
        const htmlIdLink = getHtmlId("argument", token.title ?? "untitled");
        let classes = "reference argument-reference";
        const isTopLevel = parentNode!.statement!.isTopLevel;
        if (isTopLevel) {
          classes += " top-level";
        }
        if (argument.tags) {
          classes += " " + this.getCssClassesFromTags(response, argument.tags);
        }
        response.html += `<a id="${htmlId}" href="#${htmlIdLink}" data-line="${
          token.startLine
        }" class="has-line ${classes}">&lt;<span class="title argument-title">${escapeHtml(
          token.title
        )}</span>&gt; </a>`;
      },
      [TokenNames.ARGUMENT_DEFINITION]: (
        _request,
        response,
        token,
        parentNode
      ) => {
        const argument =
          response.arguments![token.title ?? "untitled"] ||
          response.arguments![(token.title ?? "untitled") + " - 1"]; // if argument was exploded, simply take argument generated from first step
        let htmlId = "";
        if (argument.pcs.length == 0) {
          htmlId = getHtmlId(
            "argument",
            token.title ?? "untitled",
            response.htmlIds ?? undefined
          );
        }
        const htmlIdLink = getHtmlId("argument", token.title ?? "untitled");
        response.htmlIds![htmlId] = true;
        let classes = "definition argument-definition definiendum";
        const isTopLevel = parentNode!.statement!.isTopLevel;
        if (isTopLevel) {
          classes += " top-level";
        }

        if (argument.tags) {
          classes += " " + this.getCssClassesFromTags(response, argument.tags);
        }
        response.html += `<a id="${htmlId}" href="#${htmlIdLink}" class="${classes}">&lt;<span class="title argument-title">${escapeHtml(
          token.title
        )}</span>&gt;: </a>`;
      },
      [TokenNames.ARGUMENT_MENTION]: (
        _request,
        response,
        token,
        _parentNode,
        _childIndex,
        logger
      ) => {
        const htmlId = getHtmlId("argument", token.title ?? "untitled");
        let classes = "mention argument-mention";
        const argument =
          response.arguments![token.title ?? "untitled"] ||
          response.arguments![(token.title ?? "untitled") + " - 1"]; // if argument was exploded, simply take argument generated from first step
        if (!argument) {
          logger.log(
            "error",
            "Mentioned argument not found: " + (token.title ?? "untitled")
          );
        }
        if (argument && argument.tags) {
          classes += " " + this.getCssClassesFromTags(response, argument.tags);
        }
        response.html += `<a href="#${htmlId}" class="${classes}">@&lt;<span class="title argument-title">${escapeHtml(
          token.title ?? "untitled"
        )}</span>&gt;</a>${token.trailingWhitespace}`;
      },
      [TokenNames.LINK]: (request, response, token) => {
        const settings = this.getSettings(request);
        let linkUrl = settings.normalizeLink!(token.url ?? "");
        let linkText = token.text;
        if (
          !settings.validateLink!(linkUrl, settings.allowFileProtocol || false)
        ) {
          linkUrl = "";
          linkText = "removed insecure url.";
        }
        response.html += `<a href="${linkUrl}">${linkText}</a>${token.trailingWhitespace}`;
      },
      [TokenNames.BLOCK_CONTENT]: (_request, response, token) => {
        if (!token) {
          return;
        }
        response.html =
          (response.html || "") + escapeHtml(token.text || token.image || "");
      },
      [TokenNames.TAG]: (_request, response, node) => {
        const token = node;
        if (token.text) {
          response.html += `<span class="tag ${this.getCssClassesFromTags(
            response,
            [token.tag!]
          )}">${escapeHtml(token.text)}</span>`;
        }
      },
      [TokenNames.NEWLINE]: (
        _request,
        response,
        _node,
        parentNode,
        childIndex
      ) => {
        if (
          response.html!.charAt(response.html!.length - 1) !== " " &&
          childIndex != parentNode!.children!.length - 1
        ) {
          response.html += " ";
        }
      }
    };
    this.ruleListeners = {
      [RuleNames.ARGDOWN + "Entry"]: (request, response) => {
        response.html = "";
        response.htmlIds = {};
        const settings = this.getSettings(request);
        let title = request.title || "Argdown Document";
        if (response.frontMatter && response.frontMatter.title) {
          title = response.frontMatter.title;
        }
        if (!settings.headless) {
          let head = settings.head;
          if (!head) {
            head = `<!doctype html><html lang="${settings.lang}"><head><meta charset="${settings.charset}"><title>${title}</title>`;
            if (settings.cssFile) {
              head += `<link rel="stylesheet" href="${settings.cssFile}">`;
            }
            if (settings.css) {
              head += `<style>${settings.css}</style>`;
            }
            if (
              response.tags &&
              (!request.color || request.color.colorizeByTag !== false)
            ) {
              let tagColorCss = "";
              for (const tag of Object.values(response.tags)) {
                if (
                  tag.cssClass &&
                  tag.color &&
                  validateColorString(tag.color)
                ) {
                  tagColorCss += `.${tag.cssClass}{color: ${tag.color};}\n`;
                }
              }
              if (tagColorCss.length > 0) {
                head += `<style>${tagColorCss}</style>`;
              }
            }
            head += "</head>";
          }
          response.html += head;
          response.html += "<body>";
        }
        response.html += `<div class="argdown">`;
        if (settings.createHeaderFromMetadata) {
          const headerTitle = request.title
            ? `<h1>${escapeHtml(request.title)}</h1>`
            : "";
          const headerSubTitle = request.subTitle
            ? `<h2 class="subtitle">${escapeHtml(request.subTitle)}</h2>`
            : "";
          let author = "";
          if (request.author) {
            let authorData = request.author;
            if (!Array.isArray(authorData)) {
              authorData = [authorData];
            }
            let i = 0;
            for (const authorStr of authorData) {
              if (i > 0) {
                author += `<span class="separator">, </span>`;
              }
              author += `<span class="author">${authorStr}</>`;
              i++;
            }
            author = `<div class="authors">${author}</div>`;
          }
          const date = request.date
            ? `<div class="date">${escapeHtml(request.date)}</div>`
            : "";
          const abstract = request.abstract
            ? `<div class="abstract">${escapeHtml(request.abstract)}</div>`
            : "";
          if (headerTitle) {
            response.html += `<header>${headerTitle}${headerSubTitle}${author}${date}${abstract}</header>`;
          }
        }
      },
      [RuleNames.ARGDOWN + "Exit"]: (request, response) => {
        const settings = this.getSettings(request);
        // Remove htmlIds, because other plugins might create their own ones.
        // Ids only need to be unique within one document, not across documents.
        response.htmlIds = null;
        response.html += "</div>";
        if (!settings.headless) {
          response.html += "</body></html>";
        }
      },
      [RuleNames.STATEMENT + "Entry"]: (_request, response, node) => {
        let classes = "statement has-line";
        if (node.equivalenceClass && node.equivalenceClass.tags) {
          classes +=
            " " +
            this.getCssClassesFromTags(response, node.equivalenceClass.tags);
        }
        if (node.statement && node.statement.isTopLevel) {
          classes += " top-level";
        }
        response.html += `<div data-line="${node.startLine}" class="${classes}">`;
      },
      [RuleNames.STATEMENT + "Exit"]: (_request, response) =>
        (response.html += "</div>"),
      [RuleNames.ARGUMENT + "Entry"]: (_request, response, node) => {
        let classes = "argument has-line";
        if (node.argument && node.argument.tags) {
          classes +=
            " " + this.getCssClassesFromTags(response, node.argument.tags);
        }
        if (node.statement && node.statement.isTopLevel) {
          classes += " top-level";
        }
        response.html += `<div data-line="${node.startLine}" class="${classes}">`;
      },
      [RuleNames.ARGUMENT + "Exit"]: (_request, response) =>
        (response.html += "</div>"),
      [RuleNames.PCS + "Entry"]: (_request, response, node) => {
        let classes = "pcs has-line";
        const htmlId = getHtmlId(
          "argument",
          node.argument!.title ?? "untitled",
          response.htmlIds ?? undefined
        );
        response.htmlIds![htmlId] = true;

        if (node.argument && node.argument.tags && node.argument.tags) {
          classes +=
            " " + this.getCssClassesFromTags(response, node.argument.tags);
        }
        response.html += `<div id="${htmlId}" data-line="${node.startLine}" class="${classes}">`;
      },
      [RuleNames.PCS + "Exit"]: (_request, response) =>
        (response.html += "</div>"),
      [RuleNames.INCOMING_SUPPORT + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line incoming support relation"><div class="incoming support relation-symbol"><span>+&gt;</span></div>`;
      },
      [RuleNames.INCOMING_SUPPORT + "Exit"]: (_request, response) =>
        (response.html += "</div>"),
      [RuleNames.INCOMING_ATTACK + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line incoming attack relation"><div class="incoming attack relation-symbol"><span>-&gt;</span></div>`;
      },
      [RuleNames.INCOMING_ATTACK + "Exit"]: (_request, response) =>
        (response.html += "</div>"),
      [RuleNames.INCOMING_UNDERCUT + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line incoming undercut relation"><div class="incoming undercut relation-symbol"><span>_&gt;</span></div>`;
      },
      [RuleNames.INCOMING_UNDERCUT + "Exit"]: (_request, response) =>
        (response.html += "</div>"),
      [RuleNames.OUTGOING_SUPPORT + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line outgoing support relation"><div class="outgoing support relation-symbol"><span>+</span></div>`;
      },
      [RuleNames.OUTGOING_SUPPORT + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.OUTGOING_ATTACK + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line outgoing attack relation"><div class="outgoing attack relation-symbol"><span>-</span></div>`;
      },
      [RuleNames.OUTGOING_ATTACK + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.OUTGOING_UNDERCUT + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line outgoing undercut relation"><div class="outgoing undercut relation-symbol"><span>&lt;_</span></div>`;
      },
      [RuleNames.OUTGOING_UNDERCUT + "Exit"]: (_requst, response) => {
        response.html += "</div>";
      },
      [RuleNames.CONTRADICTION + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line contradiction relation"><div class="contradiction relation-symbol"><span>&gt;&lt;</span></div>`;
      },
      [RuleNames.CONTRADICTION + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.IMPLIES + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line implies relation"><div class="implies relation-symbol"><span>=&gt;</span></div>`;
      },
      [RuleNames.IMPLIES + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.REVERSE_IMPLIES + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line reverse-implies relation"><div class="reverse-implies relation-symbol"><span>&lt;=</span></div>`;
      },
      [RuleNames.REVERSE_IMPLIES + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.PRESUPPOSED_BY + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line presupposed-by relation"><div class="presupposed-by relation-symbol"><span>^&gt;</span></div>`;
      },
      [RuleNames.PRESUPPOSED_BY + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.REVERSE_PRESUPPOSED_BY + "Entry"]: (
        _request,
        response,
        node
      ) => {
        response.html += `<div data-line="${node.startLine}" class="has-line reverse-presupposed-by relation"><div class="reverse-presupposed-by relation-symbol"><span>^</span></div>`;
      },
      [RuleNames.REVERSE_PRESUPPOSED_BY + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.SPECIFIES + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line specifies relation"><div class="specifies relation-symbol"><span>:&gt;</span></div>`;
      },
      [RuleNames.SPECIFIES + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.REVERSE_SPECIFIES + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line reverse-specifies relation"><div class="reverse-specifies relation-symbol"><span>&lt;:</span></div>`;
      },
      [RuleNames.REVERSE_SPECIFIES + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.EXAMPLE_FOR + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line example-for relation"><div class="example-for relation-symbol"><span>%&gt;</span></div>`;
      },
      [RuleNames.EXAMPLE_FOR + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.REVERSE_EXAMPLE_FOR + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line reverse-example-for relation"><div class="reverse-example-for relation-symbol"><span>%</span></div>`;
      },
      [RuleNames.REVERSE_EXAMPLE_FOR + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.QUESTIONS + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line questions relation"><div class="questions relation-symbol"><span>?&gt;</span></div>`;
      },
      [RuleNames.QUESTIONS + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.REVERSE_QUESTIONS + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line reverse-questions relation"><div class="reverse-questions relation-symbol"><span>?</span></div>`;
      },
      [RuleNames.REVERSE_QUESTIONS + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.ANSWERS + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line answers relation"><div class="answers relation-symbol"><span>!&gt;</span></div>`;
      },
      [RuleNames.ANSWERS + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.REVERSE_ANSWERS + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line reverse-answers relation"><div class="reverse-answers relation-symbol"><span>!</span></div>`;
      },
      [RuleNames.REVERSE_ANSWERS + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.CITED_BY + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line cited-by relation"><div class="cited-by relation-symbol"><span>@&gt;</span></div>`;
      },
      [RuleNames.CITED_BY + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.REVERSE_CITED_BY + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line reverse-cited-by relation"><div class="reverse-cited-by relation-symbol"><span>@</span></div>`;
      },
      [RuleNames.REVERSE_CITED_BY + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.EQUAL + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line equal relation"><div class="equal relation-symbol"><span>==</span></div>`;
      },
      [RuleNames.EQUAL + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.POTENTIALLY_EQUAL + "Entry"]: (_request, response, node) => {
        response.html += `<div data-line="${node.startLine}" class="has-line potentially-equal relation"><div class="potentially-equal relation-symbol"><span>~=</span></div>`;
      },
      [RuleNames.POTENTIALLY_EQUAL + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.RELATIONS + "Entry"]: (_request, response) => {
        response.html += `<div class="relations">`;
      },
      [RuleNames.RELATIONS + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.ORDERED_LIST + "Entry"]: (_request, response) =>
        (response.html += "<ol>"),
      [RuleNames.ORDERED_LIST + "Exit"]: (_request, response) =>
        (response.html += "</ol>"),
      [RuleNames.UNORDERED_LIST + "Entry"]: (_request, response) =>
        (response.html += "<ul>"),
      [RuleNames.UNORDERED_LIST + "Exit"]: (_request, response) =>
        (response.html += "</ul>"),
      [RuleNames.ORDERED_LIST_ITEM + "Entry"]: (_request, response, node) =>
        (response.html += `<li data-line="${node.startLine}" class="has-line">`),
      [RuleNames.ORDERED_LIST_ITEM + "Exit"]: (_request, response) =>
        (response.html += "</li>"),
      [RuleNames.UNORDERED_LIST_ITEM + "Entry"]: (_request, response, node) =>
        (response.html += `<li data-line="${node.startLine}" class="has-line">`),
      [RuleNames.UNORDERED_LIST_ITEM + "Exit"]: (_request, response) =>
        (response.html += "</li>"),
      [RuleNames.HEADING + "Entry"]: (request, response, node) => {
        if (node.level === 1) {
          if (!request.title) {
            response.html = response.html!.replace(
              "<title>Argdown Document</title>",
              "<title>" + escapeHtml(node.text) + "</title>"
            );
          }
        }
        const htmlId = getHtmlId(
          "heading",
          node.text ?? "untitled",
          response.htmlIds ?? undefined
        );
        response.htmlIds![htmlId] = true;
        response.html += `<h${node.level} data-line="${node.startLine}" id="${htmlId}" class="has-line heading">`;
      },
      [RuleNames.HEADING + "Exit"]: (_request, response, node) =>
        (response.html += "</h" + node.level + ">"),
      [RuleNames.STATEMENT_CONTENT + "Entry"]: (
        _request,
        response,
        _node,
        parentNode
      ) => {
        let classes = "statement-content";
        const isTopLevel =
          parentNode!.statement && parentNode!.statement.isTopLevel;
        if (isTopLevel) {
          classes += " top-level";
        }
        response.html += `<span class="${classes}">`;
      },
      [RuleNames.STATEMENT_CONTENT + "Exit"]: (_request, response) => {
        response.html += `</span>`;
      },
      [RuleNames.BLOCK + "Entry"]: (_request, response, _node, parentNode) => {
        let classes = "statement-content block-content";
        const isTopLevel =
          parentNode && parentNode.statement && parentNode.statement.isTopLevel;
        if (isTopLevel) {
          classes += " top-level";
        }
        response.html += `<div class="${classes}">`;
      },
      [RuleNames.BLOCK + "Exit"]: (_request, response) => {
        response.html += "</div>";
      },
      [RuleNames.FREESTYLE_TEXT + "Entry"]: (
        _request,
        response,
        node,
        parentNode
      ) => {
        if (parentNode && parentNode.name != RuleNames.INFERENCE_RULES) {
          response.html += escapeHtml(node.text) || "";
        }
      },
      [RuleNames.BOLD + "Entry"]: (_request, response) =>
        (response.html += "<b>"),
      [RuleNames.BOLD + "Exit"]: (_request, response, node) =>
        (response.html += "</b>" + node.trailingWhitespace),
      [RuleNames.ITALIC + "Entry"]: (_request, response) =>
        (response.html += "<i>"),
      [RuleNames.ITALIC + "Exit"]: (_request, response, node) =>
        (response.html += "</i>" + node.trailingWhitespace),
      [RuleNames.PCS_STATEMENT + "Entry"]: (_request, response, node) => {
        const statement = node.statement;
        if (statement && isConclusion(statement) && statement.inference) {
          const inference = statement.inference;
          if (
            !inference.inferenceRules ||
            inference.inferenceRules.length == 0
          ) {
            response.html += `<div data-line="${inference.startLine}" class="has-line inference">`;
          } else {
            response.html += `<div data-line="${inference.startLine}" class="has-line inference with-data">`;
          }

          response.html += `<span class="inference-rules">`;
          if (inference.inferenceRules && inference.inferenceRules.length > 0) {
            let i = 0;
            for (const inferenceRule of inference.inferenceRules) {
              if (i > 0) response.html += ", ";
              response.html += `<span class="inference-rule">${inferenceRule}</span>`;
              i++;
            }
            response.html += "</span> ";
          }
          response.html += "</div>";
        }
        response.html += `<div data-line="${node.startLine}" class="has-line ${
          node.statement!.role
        } pcs-statement"><div class="statement-nr">(<span>${
          node.statementNr
        }</span>)</div>`;
      },
      [RuleNames.PCS_STATEMENT + "Exit"]: (_request, response) =>
        (response.html += "</div>")
    };
  }
  getCssClassesFromTags(response: IArgdownResponse, tags: string[]): string {
    let classes = "";
    if (!tags || tags.length === 0 || !response.tags) {
      return classes;
    }
    classes = tags
      .sort((a, b) => {
        const aTagData = response.tags![a];
        const bTagData = response.tags![b];
        return (aTagData.priority || 0) - (bTagData.priority || 0);
      })
      .map((t) => {
        const tagData = response.tags![t];
        if (tagData) {
          return tagData.cssClass;
        }
        return undefined;
      })
      .filter((cssClass) => cssClass !== undefined)
      .join(" ");
    return classes;
  }
}
