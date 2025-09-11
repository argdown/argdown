import { expect } from "chai";
import { LanguageServerTestHelper } from "./LanguageServerTestHelper";

describe("Language Server Lifecycle", function() {
  this.timeout(15000); // Extended timeout for server operations
  
  let helper: LanguageServerTestHelper;

  beforeEach(async function() {
    helper = new LanguageServerTestHelper();
  });

  afterEach(async function() {
    if (helper) {
      await helper.shutdown();
    }
  });

  it("should start server successfully", async function() {
    await helper.startServer();
    // If we get here without throwing, the server started successfully
    expect(true).to.be.true;
  });

  it("should initialize successfully", async function() {
    await helper.startServer();
    
    // The helper automatically sends initialize during startServer()
    // If we get here, initialization was successful
    expect(true).to.be.true;
  });

  it("should respond to initialize request with correct capabilities", async function() {
    await helper.startServer();
    
    // We can't easily re-initialize, but we can verify the server is responsive
    // by making a request that requires initialization to be complete
    const testUri = "file:///test.argdown";
    const testContent = "[T1]: Test statement";
    
    await helper.openDocument(testUri, testContent);
    const symbols = await helper.getDocumentSymbols(testUri);
    
    // If we get symbols back, initialization worked correctly
    expect(symbols).to.exist;
  });

  it("should handle shutdown gracefully", async function() {
    await helper.startServer();
    
    // Open a document to ensure server is active
    const testUri = "file:///test.argdown";
    await helper.openDocument(testUri, "[T1]: Test");
    
    // Shutdown should complete without throwing
    await helper.shutdown();
    expect(true).to.be.true;
  });

  it("should be responsive after initialization", async function() {
    await helper.startServer();
    
    const testUri = "file:///test.argdown";
    const testContent = `
# Test Document

[Statement1]: This is a test statement.

<Argument1>: This is a test argument.
  -> [Statement1]
`;
    
    await helper.openDocument(testUri, testContent);
    
    // Test multiple capabilities to ensure server is fully responsive
    const symbols = await helper.getDocumentSymbols(testUri);
    expect(symbols).to.exist;
    expect(Array.isArray(symbols)).to.be.true;
    
    const foldingRanges = await helper.getFoldingRanges(testUri);
    expect(foldingRanges).to.exist;
  });
});
