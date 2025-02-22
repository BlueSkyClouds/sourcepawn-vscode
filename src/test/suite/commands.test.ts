import * as assert from "assert";
import * as vscode from "vscode";
import { URI } from "vscode-uri";
const { suite, test, suiteSetup, suiteTeardown } = require("mocha");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as fs from "fs";
import { join } from "path";
import { run as CreateTaskCommand } from "../../Commands/createTask";
import { run as CreateScriptCommand } from "../../Commands/createScript";
import { run as CreateREADMECommand } from "../../Commands/createREADME";
import { run as CreateMasterCommand } from "../../Commands/createGitHubActions";
import { run as CreateChangelogCommand } from "../../Commands/createCHANGELOG";

const testFolderLocation = "/../../../src/test/testSuite/";
const testMainLocation = "scripting/main.sp";
const testSecondaryLocation = "scripting/include/second.sp";
const testKvLocation = "scripting/test.phrases.txt";
const mainUri: URI = URI.file(
  join(__dirname, testFolderLocation, testMainLocation)
);
const secondaryUri: URI = URI.file(
  join(__dirname, testFolderLocation, testSecondaryLocation)
);
const kvUri: URI = URI.file(
  join(__dirname, testFolderLocation, testKvLocation)
);
const examplesVscode = join(__dirname, testFolderLocation, ".vscode");
const examplesReadme = join(__dirname, testFolderLocation, "README.md");
const examplesScript = join(
  __dirname,
  testFolderLocation,
  "scripting/testSuite.sp"
);
const examplesGithub = join(__dirname, testFolderLocation, ".github");
const examplesChangelog = join(__dirname, testFolderLocation, "CHANGELOG.md");

suite("Run tests", () => {
  suiteSetup(async () => {
    const uri: URI = URI.file(join(__dirname, testFolderLocation));
    vscode.commands.executeCommand("vscode.openFolder", uri);
    rmdir(examplesVscode);
    if (fs.existsSync(examplesReadme)) {
      fs.unlinkSync(examplesReadme);
    }
    if (fs.existsSync(examplesScript)) {
      fs.unlinkSync(examplesScript);
    }
    if (fs.existsSync(examplesChangelog)) {
      fs.unlinkSync(examplesChangelog);
    }
    rmdir(examplesGithub);
    vscode.commands.executeCommand("vscode.open", mainUri);

    // Give some time to parse everything
    await sleep(2000);
  });

  suiteTeardown("Remove files after the tests", () => {
    rmdir(examplesVscode);
    if (fs.existsSync(examplesReadme)) {
      fs.unlinkSync(examplesReadme);
    }
    if (fs.existsSync(examplesScript)) {
      fs.unlinkSync(examplesScript);
    }
    if (fs.existsSync(examplesChangelog)) {
      fs.unlinkSync(examplesChangelog);
    }
    rmdir(examplesGithub);
  });

  suite("Test commands", () => {
    test("Create Task Command", () => {
      rmdir(examplesVscode);
      const error: number = CreateTaskCommand();
      // If sm_home is not defined, this command will error out.
      // This counts this error as expected behaviour.
      assert.ok(error == 0 || error == 1);
    });

    test("Create Script Command", () => {
      assert.equal(CreateScriptCommand(), 0);
    });

    test("Create Changelog Command", () => {
      assert.equal(CreateChangelogCommand(), 0);
    });

    test("Create Readme Command", () => {
      assert.equal(CreateREADMECommand(), 0);
    });

    test("Create Master Command", () => {
      assert.equal(CreateMasterCommand(), 0);
    });
  });

  suite("Test providers", () => {
    suite("Test Definition provider", () => {
      test("Test ConVar g_cvWebhook", () => {
        const position: vscode.Position = new vscode.Position(16, 8);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(
              location[0].range,
              new vscode.Range(16, 7, 16, 18)
            );
            assert.equal(location[0].uri.fsPath, mainUri.fsPath);
          });
      });

      test("Test FooEnum test", () => {
        const position: vscode.Position = new vscode.Position(17, 10);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(
              location[0].range,
              new vscode.Range(17, 8, 17, 12)
            );
            assert.equal(location[0].uri.fsPath, mainUri.fsPath);
          });
      });

      test("Test OnPluginStart", () => {
        const position: vscode.Position = new vscode.Position(19, 19);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(
              location[0].range,
              new vscode.Range(125, 13, 125, 26)
            );
            assert.ok(location[0].uri.fsPath.endsWith("sourcemod.inc"));
          });
      });

      test("Test CreateConVar", () => {
        const position: vscode.Position = new vscode.Position(21, 22);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(
              location[0].range,
              new vscode.Range(80, 14, 80, 26)
            );
            assert.ok(location[0].uri.fsPath.endsWith("convars.inc"));
          });
      });

      test("Test test line 28", () => {
        const position: vscode.Position = new vscode.Position(28, 4);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(
              location[0].range,
              new vscode.Range(17, 8, 17, 12)
            );
            assert.equal(location[0].uri.fsPath, mainUri.fsPath);
          });
      });

      test("Test test.fullAccountID line 28", () => {
        const position: vscode.Position = new vscode.Position(28, 13);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(location[0].range, new vscode.Range(4, 6, 4, 19));
            assert.equal(location[0].uri.fsPath, secondaryUri.fsPath);
          });
      });

      test("Test test line 29", () => {
        const position: vscode.Position = new vscode.Position(29, 4);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(
              location[0].range,
              new vscode.Range(17, 8, 17, 12)
            );
            assert.equal(location[0].uri.fsPath, mainUri.fsPath);
          });
      });

      test("Test test.Init(1) line 29", () => {
        const position: vscode.Position = new vscode.Position(29, 9);
        return vscode.commands
          .executeCommand("vscode.executeDefinitionProvider", mainUri, position)
          .then((location: vscode.Location[]) => {
            assert.ok(location.length > 0);
            assert.deepEqual(location[0].range, new vscode.Range(6, 6, 6, 10));
            assert.equal(location[0].uri.fsPath, secondaryUri.fsPath);
          });
      });
    });

    suite("Test Hover provider", () => {
      test("Test ConVar g_cvWebhook", () => {
        const position: vscode.Position = new vscode.Position(16, 3);
        return vscode.commands
          .executeCommand("vscode.executeHoverProvider", mainUri, position)
          .then((hover: vscode.Hover[]) => {
            assert.ok(hover.length > 0);
            assert.deepEqual(hover[0].range, new vscode.Range(16, 0, 16, 6));
          });
      });

      test("Test OnPluginStart", () => {
        const position: vscode.Position = new vscode.Position(19, 19);
        return vscode.commands
          .executeCommand("vscode.executeHoverProvider", mainUri, position)
          .then((hover: vscode.Hover[]) => {
            assert.ok(hover.length > 0);
            assert.deepEqual(hover[0].range, new vscode.Range(19, 12, 19, 25));
          });
      });

      test("Test CreateConVar", () => {
        const position: vscode.Position = new vscode.Position(21, 22);
        return vscode.commands
          .executeCommand("vscode.executeHoverProvider", mainUri, position)
          .then((hover: vscode.Hover[]) => {
            assert.ok(hover.length > 0);
            assert.deepEqual(hover[0].range, new vscode.Range(21, 15, 21, 27));
          });
      });

      test("Test test.Init(1) line 29", () => {
        const position: vscode.Position = new vscode.Position(29, 9);
        return vscode.commands
          .executeCommand("vscode.executeHoverProvider", mainUri, position)
          .then((hover: vscode.Hover[]) => {
            assert.ok(hover.length > 0);
            assert.deepEqual(hover[0].range, new vscode.Range(29, 6, 29, 10));
          });
      });

      test("cvField.BoolValue", () => {
        const position: vscode.Position = new vscode.Position(145, 19);
        return vscode.commands
          .executeCommand("vscode.executeHoverProvider", mainUri, position)
          .then((hover: vscode.Hover[]) => {
            assert.ok(hover.length > 0);
            assert.deepEqual(
              hover[0].range,
              new vscode.Range(145, 14, 145, 23)
            );
          });
      });
    });

    suite("Test Completion provider", () => {
      test("Test Include completion provider", () => {
        const position = new vscode.Position(2, 9);
        return vscode.commands
          .executeCommand(
            "vscode.executeCompletionItemProvider",
            mainUri,
            position,
            "<"
          )
          .then((docCompletion: vscode.CompletionList) => {
            assert.ok(docCompletion.items.length > 0);
          });
      });

      test("Test global scope completion provider", () => {
        const position = new vscode.Position(18, 0);
        return vscode.commands
          .executeCommand(
            "vscode.executeCompletionItemProvider",
            mainUri,
            position,
            "a"
          )
          .then((docCompletion: vscode.CompletionList) => {
            assert.ok(docCompletion.items.length > 0);
          });
      });

      test("Test global scope callback completion provider", () => {
        const position = new vscode.Position(18, 0);
        return vscode.commands
          .executeCommand(
            "vscode.executeCompletionItemProvider",
            mainUri,
            position,
            "$"
          )
          .then((docCompletion: vscode.CompletionList) => {
            assert.ok(docCompletion.items.length > 0);
          });
      });

      test("Test local scope completions provider", () => {
        const position = new vscode.Position(142, 3);
        return vscode.commands
          .executeCommand(
            "vscode.executeCompletionItemProvider",
            mainUri,
            position,
            "c"
          )
          .then((docCompletion: vscode.CompletionList) => {
            assert.ok(docCompletion.items.length > 0);
          });
      });

      test("Test methodmap attributes completion provider", () => {
        const position = new vscode.Position(46, 8);
        return vscode.commands
          .executeCommand(
            "vscode.executeCompletionItemProvider",
            mainUri,
            position,
            "."
          )
          .then((docCompletion: vscode.CompletionList) => {
            assert.ok(docCompletion.items.length > 0);
          });
      });

      test("Test enum struct attributes completion provider", () => {
        const position = new vscode.Position(145, 13);
        return vscode.commands
          .executeCommand(
            "vscode.executeCompletionItemProvider",
            mainUri,
            position,
            "."
          )
          .then((docCompletion: vscode.CompletionList) => {
            assert.ok(docCompletion.items.length > 0);
          });
      });
    });

    test("Test Doc Completion provider", () => {
      const position = new vscode.Position(31, 0);
      return vscode.commands
        .executeCommand(
          "vscode.executeCompletionItemProvider",
          mainUri,
          position,
          "/*"
        )
        .then((docCompletion: vscode.CompletionList) => {
          assert.ok(docCompletion.items.length > 0);
        });
    });

    test("Test Signature Help provider", () => {
      const position = new vscode.Position(24, 18);
      return vscode.commands
        .executeCommand(
          "vscode.executeSignatureHelpProvider",
          mainUri,
          position,
          "("
        )
        .then((signature: vscode.SignatureHelp) => {
          console.log(signature.signatures);
          assert.deepEqual(
            signature.signatures[0].label,
            'native void RegConsoleCmd(const char[] cmd, ConCmd callback, const char[] description="", int flags=0)'
          );
          assert.equal(signature.signatures[0].parameters.length, 4);
        });
    });

    suite("Test Hover provider", () => {
      test("Test SP Formater provider", () => {
        return vscode.commands
          .executeCommand("vscode.executeFormatDocumentProvider", mainUri)
          .then((edits: vscode.TextEdit[]) => {
            assert.ok(edits !== undefined);
          });
      });

      test("Test KV Formater provider", () => {
        return vscode.commands
          .executeCommand("vscode.executeFormatDocumentProvider", kvUri)
          .then((edits: vscode.TextEdit[]) => {
            assert.ok(edits !== undefined);
          });
      });
    });

    suite("Test document edits", () => {
      test("Test document edit", () => {
        return vscode.workspace
          .openTextDocument(mainUri)
          .then((a: vscode.TextDocument) => {
            vscode.window.showTextDocument(a, 1, false).then((e) => {
              e.edit((edit) => {
                edit.insert(new vscode.Position(0, 0), "a");
              });
            });
          });
      });
    });

    /*
    test("Test Semantic Token Highlighting provider", () => {
      return vscode.commands
        .executeCommand("vscode.provideDocumentSemanticTokens", mainUri)
        .then((tokens: vscode.SemanticTokens) => {
          // For now we test that it's not null
          assert.ok(tokens !== undefined && tokens.data.length === 1);
        });
    });
    */
  });
});

function rmdir(dir: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }
  fs.readdirSync(dir).forEach((f) => {
    const pathname = join(dir, f);
    if (!fs.existsSync(pathname)) {
      return fs.unlinkSync(pathname);
    }
    if (fs.statSync(pathname).isDirectory()) {
      return rmdir(pathname);
    } else {
      return fs.unlinkSync(pathname);
    }
  });
  return fs.rmdirSync(dir);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
