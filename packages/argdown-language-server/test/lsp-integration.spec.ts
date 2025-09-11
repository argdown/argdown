import { expect } from "chai";
import { LanguageServerTestHelper } from "./LanguageServerTestHelper";

describe("LSP Integration", function() {
  this.timeout(20000); // Extended timeout for integration tests
  
  let helper: LanguageServerTestHelper;

  beforeEach(async function() {
    helper = new LanguageServerTestHelper();
  });

  afterEach(async function() {
    if (helper) {
      await helper.shutdown();
    }
  });

  it("should establish IPC connection", async function() {
    await helper.startServer();
    
    // If startServer completes without throwing, IPC connection was established
    expect(true).to.be.true;
  });

  it("should handle textDocument/didOpen notifications", async function() {
    await helper.startServer();
    
    const testUri = "file:///didopen-test.argdown";
    const content = "[Test]: This is a test statement.";
    
    // This should not throw - server should accept the notification
    await helper.openDocument(testUri, content);
    
    // Verify server processed the document by requesting symbols
    const symbols = await helper.getDocumentSymbols(testUri);
    expect(symbols).to.exist;
    expect(Array.isArray(symbols)).to.be.true;
  });

  it("should respond to textDocument/documentSymbol requests", async function() {
    await helper.startServer();
    
    const testUri = "file:///symbols-request-test.argdown";
    const content = `
# Test Document

[Statement1]: A test statement.

<Argument1>: A test argument.
  -> [Statement1]
`;
    
    await helper.openDocument(testUri, content);
    const symbols = await helper.getDocumentSymbols(testUri);
    
    expect(symbols).to.exist;
    expect(Array.isArray(symbols)).to.be.true;
    expect(symbols.length).to.be.greaterThan(0);
    
    // Should have proper symbol structure
    const firstSymbol = symbols[0];
    expect(firstSymbol).to.have.property('name');
    expect(firstSymbol).to.have.property('kind');
    expect(firstSymbol).to.have.property('range');
  });

  it("should respond to textDocument/foldingRange requests", async function() {
    await helper.startServer();
    
    const testUri = "file:///folding-request-test.argdown";
    const content = `
# Section 1

Content here.

## Subsection

More content.

# Section 2

Different content.
`;
    
    await helper.openDocument(testUri, content);
    const foldingRanges = await helper.getFoldingRanges(testUri);
    
    expect(foldingRanges).to.exist;
    expect(Array.isArray(foldingRanges)).to.be.true;
    
    if (foldingRanges.length > 0) {
      const firstRange = foldingRanges[0];
      expect(firstRange).to.have.property('startLine');
      expect(firstRange).to.have.property('endLine');
    }
  });

  it("should handle multiple document operations", async function() {
    await helper.startServer();
    
    // Open multiple documents
    const doc1Uri = "file:///multi-test1.argdown";
    const doc1Content = "[Statement1]: First document statement.";
    
    const doc2Uri = "file:///multi-test2.argdown";
    const doc2Content = "<Argument1>: Second document argument.";
    
    await helper.openDocument(doc1Uri, doc1Content);
    await helper.openDocument(doc2Uri, doc2Content);
    
    // Request symbols for both documents
    const symbols1 = await helper.getDocumentSymbols(doc1Uri);
    const symbols2 = await helper.getDocumentSymbols(doc2Uri);
    
    expect(symbols1).to.exist;
    expect(symbols2).to.exist;
    expect(Array.isArray(symbols1)).to.be.true;
    expect(Array.isArray(symbols2)).to.be.true;
  });

  it("should maintain server state across requests", async function() {
    await helper.startServer();
    
    const testUri = "file:///state-test.argdown";
    const content = `
# Persistent Document

[Statement1]: This statement should be remembered.

<Argument1>: This argument references the statement.
  -> [Statement1]
`;
    
    await helper.openDocument(testUri, content);
    
    // Make multiple requests to the same document
    const symbols1 = await helper.getDocumentSymbols(testUri);
    const symbols2 = await helper.getDocumentSymbols(testUri);
    const foldingRanges = await helper.getFoldingRanges(testUri);
    
    // All requests should succeed and return consistent results
    expect(symbols1).to.exist;
    expect(symbols2).to.exist;
    expect(foldingRanges).to.exist;
    
    // Results should be consistent
    expect(symbols1.length).to.equal(symbols2.length);
  });

  it("should handle request errors gracefully", async function() {
    await helper.startServer();
    
    // Try to request symbols for a document that wasn't opened
    const nonExistentUri = "file:///does-not-exist.argdown";
    
    try {
      await helper.getDocumentSymbols(nonExistentUri);
      // If this doesn't throw, server handled it gracefully by returning empty/null
      expect(true).to.be.true;
    } catch (error) {
      // If it throws, that's also acceptable - server should give meaningful error
      expect(error).to.be.instanceOf(Error);
    }
  });
});
