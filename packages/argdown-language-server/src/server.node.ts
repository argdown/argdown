import path from "path";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { Server } from "./server.common";

class ServerNode extends Server {
  getPath(uri: string): string {
    return URI.parse(uri).fsPath;
  }
  pathSeperator: string = path.sep;
}

const connection = createConnection(ProposedFeatures.all);
const serverBrowser = new ServerNode(connection);

serverBrowser.init();
