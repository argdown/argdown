import { SaveDialogOptions, Uri, window, workspace } from "vscode";
import { URI, Utils } from "vscode-uri";
import { isArgdownFile } from "../../util/file";

export const saveExportedFile = async (
  resource: Uri,
  content: string,
  filters: { [name: string]: string[] },
  defaultExtension: string,
  transformer: (content: string) => Buffer<ArrayBuffer> = (content: string) =>
    Buffer.from(content, "utf8")
) => {
  const fileUri = await getTargetFileUri(resource, filters, defaultExtension);
  if (fileUri) {
    try {
      const buf = transformer(content);
      workspace.fs.writeFile(fileUri, buf);
    } catch (e) {
      return console.log(e);
    }
  }
};

// Transform content to base64 and save file
export const savePng = (resource: Uri, content: string) =>
  saveExportedFile(
    resource,
    content,
    { PNG: ["png"] },
    "png",
    (content: string) =>
      Buffer.from(content.replace(/^data:image\/\w+;base64,/, ""), "base64")
  );

export const getTargetFileUri = async (
  resource: Uri,
  filters: { [name: string]: string[] },
  defaultExtension: string
): Promise<Uri | undefined> => {
  let uri = resource;
  if (!uri && window.activeTextEditor) {
    // If the command is not invoked with a resource argument (e.g. in the command palette), we try to use the uri of the active document
    if (!window.activeTextEditor) {
      return;
    }
    const doc = window.activeTextEditor.document;
    if (!isArgdownFile(doc)) {
      return;
    }
    uri = doc.uri;
  }

  if (!uri) return;

  const extension: string = Utils.extname(uri);
  const defaultUri = URI.parse(
    uri.toString().replace(extension, "." + defaultExtension)
  );

  const option: SaveDialogOptions = {
    defaultUri,
    filters: filters
  };
  return await window.showSaveDialog(option);
};
