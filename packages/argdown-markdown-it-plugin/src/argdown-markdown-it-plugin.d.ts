import { IArgdownRequest, ArgdownApplication } from "@argdown/core";
import type MarkdownIt from "markdown-it";
declare const createArgdownPlugin: (config?: ((env: any) => IArgdownRequest) | IArgdownRequest, customArgdownApplication?: ArgdownApplication) => (md: MarkdownIt) => void;
export default createArgdownPlugin;
