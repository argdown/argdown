import { SaveAsFilePlugin, StdOutPlugin } from "@argdown/node";
import { isObject, mergeDefaults, checkResponseFields } from "@argdown/core";
import { from } from "svg-to-img";
import defaultsDeep from "lodash.defaultsdeep";
const defaultSettings = {
    format: "png",
    quality: 1,
    background: "#FFFFFF"
};
export class ImageExportPlugin {
    name = "ImageExportPlugin";
    defaults = {};
    constructor(config) {
        this.defaults = defaultsDeep({}, config, defaultSettings);
        this.name = "ImageExportPlugin";
    }
    getSettings = (request) => {
        if (!isObject(request.image)) {
            request.image = {};
        }
        return request.image;
    };
    prepare = (request, response) => {
        checkResponseFields(this, response, ["svg"]);
        mergeDefaults(this.getSettings(request), this.defaults);
    };
    runAsync = async (request, response) => {
        const settings = this.getSettings(request);
        if (settings.format == "png") {
            response.png = await from(response.svg).toPng(settings);
        }
        else if (settings.format == "jpg") {
            response.jpg = await from(response.svg).toJpeg(settings);
        }
        else if (settings.format == "webp") {
            response.webp = await from(response.svg).toWebp(settings);
        }
    };
}
export const installImageExport = (argdown) => {
    argdown.addPlugin(new ImageExportPlugin({ format: "png" }), "export-png");
    argdown.addPlugin(new ImageExportPlugin({ format: "jpg" }), "export-jpg");
    argdown.addPlugin(new ImageExportPlugin({ format: "webp" }), "export-webp");
    argdown.addPlugin(new SaveAsFilePlugin({
        dataKey: "png",
        extension: ".png",
        outputDir: "./images"
    }), "save-as-png");
    argdown.addPlugin(new SaveAsFilePlugin({
        dataKey: "jpg",
        extension: ".jpg",
        outputDir: "./images"
    }), "save-as-jpg");
    argdown.addPlugin(new SaveAsFilePlugin({
        dataKey: "webp",
        extension: ".webp",
        outputDir: "./images"
    }), "save-as-webp");
    argdown.addPlugin(new StdOutPlugin({ dataKey: "png" }), "stdout-png");
    argdown.addPlugin(new StdOutPlugin({ dataKey: "jpg" }), "stdout-jpg");
    argdown.addPlugin(new StdOutPlugin({ dataKey: "webp" }), "stdout-webp");
};
//# sourceMappingURL=index.js.map