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

export const getUri = (resource: Uri | undefined | null): Uri | undefined => {
  if (resource) return resource;
  const doc = window.activeTextEditor?.document;
  if (doc && isArgdownFile(doc)) return doc.uri;
  return undefined;
};

export const getTargetFileUri = async (
  resource: Uri,
  filters: { [name: string]: string[] },
  defaultExtension: string
): Promise<Uri | undefined> => {
  const uri = getUri(resource);
  if (!uri) return;

  // try to get the url of the provided argdown resource. If it fails default to undefined. Current file I think
  let defaultUri: Uri | undefined;
  try {
    const extension: string = Utils.extname(uri);
    defaultUri = URI.parse(
      uri.toString().replace(extension, "." + defaultExtension)
    );
  } catch {
    defaultUri = undefined;
  }

  const option: SaveDialogOptions = {
    defaultUri,
    filters: filters
  };
  return await window.showSaveDialog(option);
};
