import { checkResponseFields, IArgdownPlugin, IRequestHandler, IRuleNode, RuleNames } from "../index.js";

declare module "../index.js" {
  interface IArgdownResponse {
    includes?: IRuleNode[];
  }
}

export class IncludePositionsPlugin implements IArgdownPlugin {
  name: string = "IncludePositionsPlugin";
  run: IRequestHandler = (_, response) => {
    checkResponseFields(this, response, ["ast"])
    const ast = response.ast as IRuleNode;
    if (!ast.children) return;
    const includeNodes = ast.children.filter((x) => (x as IRuleNode).name === RuleNames.INCLUDE)
    response.includes = includeNodes as IRuleNode[];
  };
}
