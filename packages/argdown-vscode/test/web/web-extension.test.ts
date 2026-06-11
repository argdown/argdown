import * as vscode from "vscode";

// Web extension test runner - simpler approach for web environment
export async function run(): Promise<void> {
  console.log("Starting Argdown Web Extension Tests...");

  const EXTENSION_ID = "argdown.argdown-vce";

  try {
    // Test 1: Extension should be loaded
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    if (!extension) {
      throw new Error(`Web extension ${EXTENSION_ID} not found`);
    }
    console.log("✓ Extension found:", extension.packageJSON.displayName);

    // Test 2: Extension should activate
    if (!extension.isActive) {
      await extension.activate();
    }

    if (!extension.isActive) {
      throw new Error("Extension failed to activate");
    }
    console.log("✓ Extension is active");

    // Test 3: Language should be registered
    const languages = await vscode.languages.getLanguages();
    if (!languages.includes("argdown")) {
      throw new Error("Argdown language not registered");
    }
    console.log("✓ Argdown language registered");

    // Test 4: Core commands should be registered
    const commands = await vscode.commands.getCommands();
    const coreCommands = [
      "argdown.showPreview",
      "argdown.showPreviewToSide",
      "argdown.preview.refresh"
    ];

    for (const cmd of coreCommands) {
      if (!commands.includes(cmd)) {
        throw new Error(`Command ${cmd} not registered`);
      }
    }
    console.log("✓ Core commands registered");

    // Test 5: Document handling
    const testDoc = await vscode.workspace.openTextDocument({
      language: "argdown",
      content: "# Test\n[A]: Test statement."
    });

    if (testDoc.languageId !== "argdown") {
      throw new Error("Document language ID incorrect");
    }
    console.log("✓ Document handling works");

    // Test 6: Document processing with complex content
    const complexTestDoc = await vscode.workspace.openTextDocument({
      language: "argdown",
      content: `# Test Argument Structure

[Statement 1]: This is a test statement.
[Statement 2]: This is another statement.

<Argument 1>: This is a test argument.
  + [Statement 1]
  - [Statement 2]

<Argument 2>: Another argument.
  + [Statement 2]
  - [Statement 1]
`
    });

    if (complexTestDoc.languageId !== "argdown") {
      throw new Error("Complex document language ID incorrect");
    }

    if (!complexTestDoc.getText().includes("[Statement 1]")) {
      throw new Error("Complex document should contain test content");
    }
    console.log("✓ Complex document processing works");

    // Test 7: Preview functionality (adapted for web environment)
    await vscode.window.showTextDocument(complexTestDoc);

    try {
      await vscode.commands.executeCommand("argdown.showPreview");
      console.log("✓ Preview command executed successfully");
    } catch (error) {
      console.log(
        "⚠ Preview command failed (may be expected in headless web environment):",
        error
      );
      // Don't fail the test - preview may have limitations in headless browser mode
    }

    // Test 8: Export commands (adapted for web environment)
    try {
      await vscode.commands.executeCommand(
        "argdown.copyWebComponentToClipboard"
      );
      console.log("✓ Web component clipboard command executed");
    } catch (error) {
      console.log(
        "⚠ Web component clipboard failed (may be expected due to browser security):",
        error
      );
      // Don't fail - clipboard operations often restricted in headless browser
    }

    // Test file export commands that may not work in web environment
    try {
      await vscode.commands.executeCommand("argdown.exportDocumentToJson");
      console.log(
        "✓ Export to JSON command executed (unexpected success in web environment)"
      );
    } catch (error) {
      console.log(
        "⚠ Export to JSON failed (expected in web environment):",
        error
      );
      // Expected - file system exports typically don't work in web environment
    }

    console.log("All web extension tests passed! ✅");

    // Small delay to allow server to finish serving responses before shutdown
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.error("Web extension test failed:", error);
    throw error;
  }
}
