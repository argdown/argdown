import { IAsyncArgdownPlugin, IAsyncRequestHandler, IArgdownRequest, AsyncArgdownApplication } from "@argdown/node";
import { IRequestHandler } from "@argdown/core";
export interface IImageExportPluginSettings {
    format?: "png" | "jpg" | "webp";
    directory?: string;
    quality?: number;
    width?: number;
    height?: number;
    background?: string;
    encoding?: "base64" | "utf8" | "binary" | "hex";
}
declare module "@argdown/core" {
    interface IArgdownRequest {
        image?: IImageExportPluginSettings;
    }
    interface IArgdownResponse {
        png?: String | Buffer;
        jpg?: String | Buffer;
        webp?: String | Buffer;
    }
}
export declare class ImageExportPlugin implements IAsyncArgdownPlugin {
    name: string;
    defaults: IImageExportPluginSettings;
    constructor(config?: IImageExportPluginSettings);
    getSettings: (request: IArgdownRequest) => IImageExportPluginSettings;
    prepare: IRequestHandler;
    runAsync: IAsyncRequestHandler;
}
export declare const installImageExport: (argdown: AsyncArgdownApplication) => void;
