import { homedir } from "os";
import { join } from "path";
import { workspace, ExtensionContext, languages, extensions } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";
import { platform, arch } from "os";
import { existsSync } from "fs";

import { registerSMCommands } from "./Commands/registerCommands";
import { SMDocumentFormattingEditProvider } from "./Formatters/spFormat";
import { KVDocumentFormattingEditProvider } from "./Formatters/kvFormat";
import {
  getLatestVersionName,
  run as installLanguageServerCommand,
} from "./Commands/installLanguageServer";

let client: LanguageClient;

function makeCommand() {
  let lsp_path = join(
    extensions.getExtension("Sarrus.sourcepawn-vscode").extensionPath,
    "bin"
  );
  const platform_ = platform();
  const arch_ = arch();
  if (platform_ === "win32") {
    lsp_path = join(lsp_path, "win32/sourcepawn_lsp.exe");
  } else {
    lsp_path = "./" + join(lsp_path, `${platform_}_${arch_}/sourcepawn_lsp`);
  }
  return lsp_path;
}

async function installLanguageServer(context: ExtensionContext) {
  const lspPath = join(
    extensions.getExtension("Sarrus.sourcepawn-vscode").extensionPath,
    "languageServer"
  );
  if (!existsSync(lspPath)) {
    await installLanguageServerCommand(undefined);
    const version = await getLatestVersionName();
    context.globalState.update("language_server_version", version);
  }
}

async function checkForLanguageServerUpdate(context: ExtensionContext) {
  const latestVersion = await getLatestVersionName();
  const installedVersion = context.globalState.get("language_server_version");
  if (
    latestVersion === undefined ||
    installedVersion === undefined ||
    latestVersion === installedVersion
  ) {
    return;
  }
  await installLanguageServerCommand(undefined);
  context.globalState.update("language_server_version", latestVersion);
  client.start();
}

export async function activate(context: ExtensionContext) {
  await installLanguageServer(context);

  registerSMCommands(context);

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      {
        language: "sourcepawn",
        scheme: "file",
      },
      new SMDocumentFormattingEditProvider()
    )
  );

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      {
        language: "valve-kv",
      },
      new KVDocumentFormattingEditProvider()
    )
  );

  const serverOptions: ServerOptions = {
    run: {
      command: makeCommand(),
      args: [],
    },
    debug: {
      command: "cargo",
      args: [
        "run",
        "--manifest-path",
        join(homedir(), "dev/sourcepawn-lsp/Cargo.toml"),
      ],
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: "sourcepawn" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.{inc,sp}"),
    },
  };

  client = new LanguageClient(
    "SourcePawnLanguageServer",
    serverOptions,
    clientOptions
  );

  client.start();
  checkForLanguageServerUpdate(context);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
