import { expect } from "chai";
import { LanguageServerTestHelper } from "./LanguageServerTestHelper";

describe("Document Processing (Simple)", function() {
  this.timeout(15000);
  
  let helper: LanguageServerTestHelper;

  beforeEach(async function() {
    helper = new LanguageServerTestHelper();
    await helper.startServer();
  });

  afterEach(async function() {
    if (helper) {
      await helper.shutdown();
    }
  });

  it("should parse valid Argdown document", async function() {
    const testUri = "file:///test.argdown";
    const validContent = `# Test Document

[Statement1]: This is a valid statement.`;
    
    await helper.openDocument(testUri, validContent);
    const symbols = await helper.getDocumentSymbols(testUri);
    
    expect(symbols).to.exist;
    expect(Array.isArray(symbols)).to.be.true;
    expect(symbols.length).to.be.greaterThan(0);
  });

  it("should handle syntax errors gracefully", async function() {
    const testUri = "file:///error-test.argdown";
    const invalidContent = `[Incomplete statement without closing bracket`;
    
    await helper.openDocument(testUri, invalidContent);
    const symbols = await helper.getDocumentSymbols(testUri);
    
    // Server should respond (may return empty array due to parse errors)
    expect(symbols).to.exist;
    expect(Array.isArray(symbols)).to.be.true;
  });

  it("should provide folding ranges", async function() {
    const testUri = "file:///folding-test.argdown";
    const content = `# Section 1

[Statement1]: A statement.

## Subsection 1.1

<Argument1>: An argument.
  -> [Statement1]

# Section 2

Different content.`;
    
    await helper.openDocument(testUri, content);
    const foldingRanges = await helper.getFoldingRanges(testUri);
    
    expect(foldingRanges).to.exist;
    expect(Array.isArray(foldingRanges)).to.be.true;
  });

  it("should handle complex Argdown structures", async function() {
    const testUri = "file:///complex-test.argdown";
    const content = `# Main Document

[Statement1]: A clear statement.

<Argument1>: An argument supporting the statement.
  -> [Statement1]

[Statement2]: Another statement.
  <- <Argument1>`;
    
    await helper.openDocument(testUri, content);
    const symbols = await helper.getDocumentSymbols(testUri);
    
    expect(symbols).to.exist;
    expect(Array.isArray(symbols)).to.be.true;
    expect(symbols.length).to.be.greaterThan(0);
    
    // Should find at least the main heading (symbols are hierarchical)
    expect(symbols.length).to.be.greaterThanOrEqual(1);
  });
});
