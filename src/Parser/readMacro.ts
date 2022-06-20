﻿import { SyntaxNode } from "web-tree-sitter";
import { MacroItem } from "../Backend/Items/spMacroItem";
import { findDoc } from "./readDocumentation";

import { TreeWalker } from "./spParser";
import { pointsToRange } from "./utils";

/**
 * Process an enum declaration.
 * @param  {TreeWalker} walker  TreeWalker object.
 * @param  {SyntaxNode} node    Node to process.
 * @returns void
 */
export function readMacro(walker: TreeWalker, node: SyntaxNode): void {
  const nameNode = node.childForFieldName("name");
  const { doc, dep } = findDoc(walker, node);
  const macroItem = new MacroItem(
    nameNode.text,
    node.text,
    doc,
    walker.filePath,
    pointsToRange(nameNode.startPosition, nameNode.endPosition),
    "any",
    pointsToRange(node.startPosition, node.endPosition),
    dep,
    []
  );
  walker.fileItem.items.push(macroItem);
}
