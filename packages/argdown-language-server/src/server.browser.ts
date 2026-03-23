import path from "path-browserify";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection
} from "vscode-languageserver/browser";
import { Server } from "./server.common";
class ServerBrowser extends Server {
  pathSeperator: string = path.sep;
}

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);
// Create a connection for the server using the browser/web worker message transport
const connection = createConnection(messageReader, messageWriter);
const serverBrowser = new ServerBrowser(connection);

serverBrowser.init();
