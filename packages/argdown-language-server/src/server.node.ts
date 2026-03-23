import path from "path";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { Server } from "./server.common";

class ServerNode extends Server {
  pathSeperator: string = path.sep;
}

const connection = createConnection(ProposedFeatures.all);
const serverNode = new ServerNode(connection);

serverNode.init();
