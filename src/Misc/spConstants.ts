import { DocumentFilter, SemanticTokensLegend } from "vscode";

import { ConstantItem } from "../Backend/Items/spConstantItem";

export const SP_MODE: DocumentFilter = {
  language: "sourcepawn",
  scheme: "file",
};

const tokenTypes = [
  "variable",
  "enumMember",
  "function",
  "class",
  "method",
  "macro",
];
const tokenModifiers = [
  "readonly",
  "declaration",
  "deprecated",
  "modification",
];

export const SP_LEGENDS = new SemanticTokensLegend(tokenTypes, tokenModifiers);

export const globalIdentifier = "$GLOBAL";
export const globalItem = new ConstantItem(globalIdentifier);

export const reservedTokens = new Set<string>([
  "float",
  "int",
  "char",
  "bool",
  "void",
  "any",
  "Float",
  "String",
  "_",
]);
