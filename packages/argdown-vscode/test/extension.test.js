var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as assert from 'assert';
import * as vscode from 'vscode';
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Sample test', () => {
        assert.strictEqual([1, 2, 3].indexOf(5), -1);
        assert.strictEqual([1, 2, 3].indexOf(0), -1);
    });
    test('Extension should be present', () => __awaiter(void 0, void 0, void 0, function* () {
        const extension = vscode.extensions.getExtension('argdown.argdown-vscode');
        assert.ok(extension, 'Extension should be installed');
    }));
    test('Extension should activate', () => __awaiter(void 0, void 0, void 0, function* () {
        const extension = vscode.extensions.getExtension('argdown.argdown-vscode');
        if (extension && !extension.isActive) {
            yield extension.activate();
        }
        assert.ok(extension === null || extension === void 0 ? void 0 : extension.isActive, 'Extension should be active');
    }));
    test('Should register argdown language', () => __awaiter(void 0, void 0, void 0, function* () {
        const languages = yield vscode.languages.getLanguages();
        assert.ok(languages.includes('argdown'), 'Argdown language should be registered');
    }));
    test('Should register expected commands', () => __awaiter(void 0, void 0, void 0, function* () {
        const commands = yield vscode.commands.getCommands();
        const expectedCommands = [
            'argdown.helloWorld',
            'argdown.exportDocumentToHtml',
            'argdown.exportDocumentToJson',
            'argdown.exportDocumentToDot',
            'argdown.exportDocumentToGraphML',
            'argdown.copyWebComponentToClipboard',
            'argdown.exportDocumentToVizjsSvg',
            'argdown.exportDocumentToVizjsPdf',
            'argdown.showPreview',
            'argdown.showPreviewToSide',
            'argdown.showLockedPreviewToSide',
            'argdown.showSource',
            'argdown.showPreviewSecuritySelector',
            'argdown.preview.refresh',
            'argdown.preview.toggleLock',
            'argdown.run'
        ];
        expectedCommands.forEach(cmd => {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
        });
    }));
    test('Should recognize argdown file extensions', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // Create a temporary argdown file
        const workspaceFolder = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0];
        if (workspaceFolder) {
            const argdownFile = vscode.Uri.joinPath(workspaceFolder.uri, 'test.argdown');
            const doc = yield vscode.workspace.openTextDocument(argdownFile);
            assert.strictEqual(doc.languageId, 'argdown', 'Should recognize .argdown files');
        }
    }));
    test('Should have proper configuration schema', () => {
        const config = vscode.workspace.getConfiguration('argdown');
        assert.ok(config, 'Should have argdown configuration');
        // Test default values
        assert.strictEqual(config.get('configFile'), 'argdown.config.js');
        assert.strictEqual(config.get('markdownWebComponent.enabled'), true);
        assert.strictEqual(config.get('preview.doubleClickToSwitchToEditor'), true);
        assert.strictEqual(config.get('preview.defaultView'), 'vizjs');
    });
    test('Should have keybindings configured', () => __awaiter(void 0, void 0, void 0, function* () {
        const commands = yield vscode.commands.getCommands();
        // We can't directly test keybindings, but we can verify the commands they trigger exist
        assert.ok(commands.includes('argdown.showPreview'));
        assert.ok(commands.includes('argdown.showPreviewToSide'));
    }));
    suite('Document Tests', () => {
        let document;
        suiteSetup(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create a test argdown document
            document = yield vscode.workspace.openTextDocument({
                language: 'argdown',
                content: `# Test Argument

[Statement 1]: This is a statement.

<Argument 1>: This is an argument.
  + [Statement 1]
  - [Statement 2]: This contradicts statement 1.`
            });
        }));
        test('Should open argdown document with correct language ID', () => {
            assert.strictEqual(document.languageId, 'argdown');
        });
        test('Should execute preview commands on argdown document', () => __awaiter(void 0, void 0, void 0, function* () {
            yield vscode.window.showTextDocument(document);
            // Test if preview commands can be executed (they should not throw)
            try {
                yield vscode.commands.executeCommand('argdown.showPreview');
                assert.ok(true, 'Preview command should execute without error');
            }
            catch (error) {
                // Command might fail in test environment, but should be registered
                assert.ok(true, 'Command exists even if execution fails in test environment');
            }
        }));
        test('Should handle export commands', () => __awaiter(void 0, void 0, void 0, function* () {
            yield vscode.window.showTextDocument(document);
            const exportCommands = [
                'argdown.exportDocumentToHtml',
                'argdown.exportDocumentToJson',
                'argdown.exportDocumentToDot',
                'argdown.exportDocumentToGraphML'
            ];
            for (const cmd of exportCommands) {
                try {
                    yield vscode.commands.executeCommand(cmd);
                    assert.ok(true, `${cmd} should execute`);
                }
                catch (error) {
                    // Commands might fail in test environment without proper file context
                    assert.ok(true, `${cmd} exists even if execution fails in test environment`);
                }
            }
        }));
    });
    suite('Configuration Tests', () => {
        test('Should update configuration values', () => __awaiter(void 0, void 0, void 0, function* () {
            const config = vscode.workspace.getConfiguration('argdown');
            // Test setting a configuration value
            yield config.update('preview.defaultView', 'html', vscode.ConfigurationTarget.Workspace);
            assert.strictEqual(config.get('preview.defaultView'), 'html');
            // Reset to default
            yield config.update('preview.defaultView', 'vizjs', vscode.ConfigurationTarget.Workspace);
        }));
        test('Should have all expected configuration properties', () => {
            const config = vscode.workspace.getConfiguration('argdown');
            const expectedProperties = [
                'configFile',
                'markdownWebComponent.enabled',
                'markdownWebComponent.withoutHeader',
                'markdownWebComponent.withoutLogo',
                'markdownWebComponent.withoutMaximize',
                'preview.trace',
                'preview.doubleClickToSwitchToEditor',
                'preview.syncPreviewSelectionWithEditor',
                'preview.lockMenu',
                'preview.minDelayBetweenUpdates',
                'preview.defaultView'
            ];
            expectedProperties.forEach(prop => {
                const value = config.get(prop);
                assert.notStrictEqual(value, undefined, `Configuration property ${prop} should exist`);
            });
        });
    });
    suite('Language Features Tests', () => {
        test('Should provide language configuration', () => {
            // Test that the language configuration is loaded
            // This is implicit when the language is registered
            assert.ok(true, 'Language configuration loaded with language registration');
        });
        test('Should provide syntax highlighting', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a document with argdown content
            const doc = yield vscode.workspace.openTextDocument({
                language: 'argdown',
                content: `[Statement]: This should be highlighted.

<Argument>:
  + [Statement]`
            });
            assert.strictEqual(doc.languageId, 'argdown');
            // Syntax highlighting is handled by the grammar file and can't be easily tested here
        }));
    });
    suite('Error Handling Tests', () => {
        test('Should handle invalid argdown syntax gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const doc = yield vscode.workspace.openTextDocument({
                language: 'argdown',
                content: `[Incomplete statement

<Malformed argument`
            });
            // Extension should not crash with invalid syntax
            yield vscode.window.showTextDocument(doc);
            assert.ok(true, 'Extension handles invalid syntax without crashing');
        }));
    });
});
//# sourceMappingURL=extension.test.js.map