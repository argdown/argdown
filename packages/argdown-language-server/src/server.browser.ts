import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection
} from "vscode-languageserver/browser";
import { Server } from "./server.common";

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);
// Create a connection for the server using the browser/web worker message transport
const connection = createConnection(messageReader, messageWriter);
const serverBrowser = new Server(connection);

serverBrowser.init();
