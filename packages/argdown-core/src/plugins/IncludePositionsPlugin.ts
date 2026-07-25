import { checkResponseFields, IArgdownPlugin, IRequestHandler, IRuleNode, ITokenNode, RuleNames } from "../index.js";

declare module "../index.js" {
  interface IArgdownResponse {
    includes?: ITokenNode[];
  }
}

export class IncludePositionsPlugin implements IArgdownPlugin {
  name: string = "IncludePositionsPlugin";
  run: IRequestHandler = (_, response) => {
    checkResponseFields(this, response, ["ast"])
    const ast = response.ast as IRuleNode;
    if (!ast.children) return;
    const includeNodes = ast.children.filter((x) => (x as IRuleNode).name === RuleNames.INCLUDE).flatMap(x => (x as IRuleNode).children).filter(x => (x as ITokenNode).tokenType.name === "Include");

    response.includes = includeNodes as ITokenNode[];
  };
}
