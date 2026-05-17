#!/usr/bin/env node
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { Server } from "./server.common";

const connection = createConnection(ProposedFeatures.all);
const serverNode = new Server(connection);

serverNode.init();
