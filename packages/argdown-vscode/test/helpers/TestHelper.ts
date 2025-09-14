import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Test helper utilities for the Argdown VS Code extension
 */
export class TestHelper {
  
  /**
   * Wait for extension to be activated
   */
  static async waitForExtensionActivation(extensionId: string): Promise<vscode.Extension<any>> {
    const extension = vscode.extensions.getExtension(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    if (!extension.isActive) {
      await extension.activate();
    }

    return extension;
  }

  /**
   * Create a test document with Argdown content
   */
  static async createArgdownDocument(content: string): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument({
      language: 'argdown',
      content
    });
  }

  /**
   * Get a test workspace file URI
   */
  static getTestFileUri(filename: string): vscode.Uri {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder found');
    }
    return vscode.Uri.joinPath(workspaceFolder.uri, filename);
  }

  /**
   * Wait for a specific command to be available
   */
  static async waitForCommand(commandId: string, timeout = 5000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const commands = await vscode.commands.getCommands();
      if (commands.includes(commandId)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Command ${commandId} not found within timeout`);
  }

  /**
   * Execute a command and wait for completion
   */
  static async executeCommand(commandId: string, ...args: any[]): Promise<any> {
    try {
      return await vscode.commands.executeCommand(commandId, ...args);
    } catch (error) {
      throw new Error(`Failed to execute command ${commandId}: ${error}`);
    }
  }

  /**
   * Verify extension files are built and available
   */
  static verifyExtensionBuild(): void {
    const extensionPath = path.join(__dirname, '..');
    const nodeMainPath = path.join(extensionPath, 'dist', 'node', 'node-main.js');
    const webMainPath = path.join(extensionPath, 'dist', 'web', 'browser-main.js');
    
    if (!fs.existsSync(nodeMainPath)) {
      throw new Error('Node extension not built. Run "npm run build" first.');
    }
    
    if (!fs.existsSync(webMainPath)) {
      throw new Error('Web extension not built. Run "npm run build" first.');
    }
  }

  /**
   * Get Argdown configuration
   */
  static getArgdownConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('argdown');
  }

  /**
   * Sample Argdown content for testing
   */
  static readonly SAMPLE_ARGDOWN = `# Test Argument Map

[Premise 1]: This is the first premise.
[Premise 2]: This is the second premise.

<Argument 1>: This is the main argument.
  + [Premise 1]
  + [Premise 2]
  - [Counter-premise]: This contradicts the argument.

[Conclusion]: This is the conclusion.
  <- <Argument 1>
`;
}