import { ChildProcess, spawn } from "child_process";
import * as path from "path";

export interface LSPRequest {
  id: number;
  method: string;
  params?: any;
}

export interface LSPResponse {
  id: number;
  result?: any;
  error?: any;
}

export interface LSPNotification {
  method: string;
  params?: any;
}

export class LanguageServerTestHelper {
  private serverProcess: ChildProcess | null = null;
  private requestId = 1;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private initializeCompleted = false;

  async startServer(): Promise<void> {
    const serverPath = path.join(__dirname, "../dist/node/server-node.js");
    
    this.serverProcess = spawn("node", [serverPath, "--stdio"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    if (!this.serverProcess.stdin || !this.serverProcess.stdout) {
      throw new Error("Failed to create server process stdio streams");
    }

    // Set up response handling
    let buffer = "";
    this.serverProcess.stdout.on("data", (data: Buffer) => {
      buffer += data.toString();
      buffer = this.extractCompleteMessages(buffer);
    });

    this.serverProcess.stderr?.on("data", (data: Buffer) => {
      console.error("Server stderr:", data.toString());
    });

    this.serverProcess.on("error", (error) => {
      console.error("Server process error:", error);
    });

    // Initialize the server
    await this.initialize();
  }



  private extractCompleteMessages(buffer: string): string {
    let remaining = buffer;
    
    while (true) {
      const contentLengthMatch = remaining.match(/Content-Length: (\d+)\r?\n/);
      if (!contentLengthMatch) {
        break; // No more complete headers
      }
      
      const contentLength = parseInt(contentLengthMatch[1]);
      const headerEndIndex = remaining.indexOf('\r\n\r\n');
      
      if (headerEndIndex === -1) {
        break; // Incomplete header
      }
      
      const messageStart = headerEndIndex + 4;
      const messageEnd = messageStart + contentLength;
      
      if (remaining.length < messageEnd) {
        break; // Incomplete message
      }
      
      const messageContent = remaining.substring(messageStart, messageEnd);
      try {
        const message = JSON.parse(messageContent);
        this.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse message:", messageContent, error);
      }
      
      remaining = remaining.substring(messageEnd);
    }
    
    return remaining;
  }

  private handleMessage(message: any): void {
    if (message.id !== undefined) {
      // Response to a request
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(new Error(JSON.stringify(message.error)));
        } else {
          pending.resolve(message.result);
        }
      }
    } else {
      // Notification from server
      console.log("Server notification:", message.method, message.params);
    }
  }

  private async initialize(): Promise<any> {
    const initializeParams = {
      processId: process.pid,
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      },
      capabilities: {
        textDocument: {
          documentSymbol: {
            dynamicRegistration: false
          }
        }
      },
      workspaceFolders: null
    };

    const result = await this.sendRequest("initialize", initializeParams);
    
    // Send initialized notification
    await this.sendNotification("initialized", {});
    
    this.initializeCompleted = true;
    return result;
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.serverProcess?.stdin) {
      throw new Error("Server not started");
    }

    const id = this.requestId++;
    const request: LSPRequest = { id, method, params };
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      const message = JSON.stringify(request);
      const header = `Content-Length: ${Buffer.byteLength(message)}\r\n\r\n`;
      
      this.serverProcess!.stdin!.write(header + message);
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 10000); // 10 second timeout
    });
  }

  async sendNotification(method: string, params?: any): Promise<void> {
    if (!this.serverProcess?.stdin) {
      throw new Error("Server not started");
    }

    const notification: LSPNotification = { method, params };
    const message = JSON.stringify(notification);
    const header = `Content-Length: ${Buffer.byteLength(message)}\r\n\r\n`;
    
    this.serverProcess.stdin.write(header + message);
  }

  async openDocument(uri: string, content: string): Promise<void> {
    if (!this.initializeCompleted) {
      throw new Error("Server not initialized");
    }

    await this.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId: "argdown",
        version: 1,
        text: content
      }
    });
  }

  async getDocumentSymbols(uri: string): Promise<any> {
    return this.sendRequest("textDocument/documentSymbol", {
      textDocument: { uri }
    });
  }

  async getFoldingRanges(uri: string): Promise<any> {
    return this.sendRequest("textDocument/foldingRange", {
      textDocument: { uri }
    });
  }

  async shutdown(): Promise<void> {
    if (this.serverProcess) {
      // Send shutdown request
      try {
        await this.sendRequest("shutdown", null);
        await this.sendNotification("exit", null);
      } catch (error) {
        console.warn("Error during graceful shutdown:", error);
      }

      // Force kill if still running
      if (!this.serverProcess.killed) {
        this.serverProcess.kill("SIGTERM");
        
        // Wait a bit, then force kill
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill("SIGKILL");
          }
        }, 2000);
      }
      
      this.serverProcess = null;
    }
  }
}
