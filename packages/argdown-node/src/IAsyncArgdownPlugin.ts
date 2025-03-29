import { IArgdownPlugin, IArgdownRequest, IArgdownResponse, IArgdownLogger } from "@argdown/core";
export interface IAsyncRequestHandler {
  (request: IArgdownRequest, response: IArgdownResponse, logger: IArgdownLogger): Promise<void>;
}
export interface IAsyncArgdownPlugin extends IArgdownPlugin {
  runAsync: IAsyncRequestHandler;
}
export const isAsyncPlugin = (plugin: IArgdownPlugin): plugin is IAsyncArgdownPlugin => {
  return (typeof ((<any>plugin).runAsync) === 'function');
};
