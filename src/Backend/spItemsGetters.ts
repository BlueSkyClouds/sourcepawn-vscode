import { TextDocument, Position, CompletionItemKind, Range } from "vscode";
import { resolve } from "path";
import { existsSync } from "fs";
import { URI } from "vscode-uri";

import { SPItem } from "./Items/spItems";
import { IncludeItem } from "./Items/spIncludeItem";
import { FileItem } from "./spFilesRepository";
import { getAllPossibleIncludeFolderPaths } from "./spFileHandlers";
import { ItemsRepository } from "./spItemsRepository";
import { findMainPath } from "../spUtils";
import { getIncludeExtension } from "./spUtils";
import { MethodMapItem } from "./Items/spMethodmapItem";

/**
 * Returns an array of all the items parsed from a file and its known includes
 * @param  {ItemsRepository} itemsRepo      The itemsRepository object constructed in the activation event.
 * @param  {URI} uri                        The URI of the file we are getting the items for.
 * @returns SPItem
 */
export function getAllItems(itemsRepo: ItemsRepository, uri: URI): SPItem[] {
  const mainPath = findMainPath(uri);
  if (mainPath !== undefined && mainPath !== "") {
    uri = URI.file(mainPath);
  }

  const includes = new Set<string>([uri.toString()]);
  const fileItems = itemsRepo.fileItems.get(uri.toString());
  if (fileItems === undefined) {
    return [];
  }

  getIncludedFiles(itemsRepo, fileItems, includes);
  return Array.from(includes).map(getFileItems, itemsRepo).flat();
}

/**
 * Returns a map of all the defines parsed from a file and its known includes
 * @param  {ItemsRepository} itemsRepo      The itemsRepository object constructed in the activation event.
 * @param  {URI} uri                        The URI of the file we are getting the items for.
 * @param  {FileItem} fileItem              The fileItem object.
 * @returns Map<string, string>
 */
export function getAllDefines(
  itemsRepo: ItemsRepository,
  uri: URI,
  fileItem: FileItem
): Map<string, string> {
  const defines = new Map<string, string>(fileItem.defines);

  const includes = new Set<string>([uri.toString()]);

  getIncludedFiles(itemsRepo, fileItem, includes);
  includes.forEach((e) => {
    const fileItem = itemsRepo.fileItems.get(e);
    if (fileItem === undefined) {
      return;
    }
    fileItem.defines.forEach((v, k) => {
      defines.set(k, v);
    });
  });
  return defines;
}

/**
 * Returns a map of all the methodmaps parsed from a file and its known includes
 * @param  {ItemsRepository} itemsRepo      The itemsRepository object constructed in the activation event.
 * @param  {URI} uri                        The URI of the file we are getting the methodmaps for.
 * @returns Map<string, MethodMapItem>
 */
export function getAllMethodmaps(
  itemsRepo: ItemsRepository,
  uri: URI
): Map<string, MethodMapItem> {
  const mainPath = findMainPath(uri);
  if (mainPath !== undefined && mainPath !== "") {
    uri = URI.file(mainPath);
  }

  const includes = new Set<string>([uri.toString()]);
  const methodmapItems = itemsRepo.fileItems.get(uri.toString());
  if (methodmapItems === undefined) {
    return new Map<string, MethodMapItem>();
  }

  getIncludedFiles(itemsRepo, methodmapItems, includes);
  const methodmaps = new Map<string, MethodMapItem>();
  includes.forEach((v) => {
    getMethodmapItems.call(itemsRepo, methodmaps, v);
  });
  return methodmaps;
}

/**
 * Callback used by the map function in getAllMethodmaps. Gets all the methodmaps from a parsed file, without its includes.
 * @param  {ItemsRepository} this
 * @param  {Map<string, MethodMapItem>} methodmapItems
 * @param  {string} uri
 * @returns void
 */
function getMethodmapItems(
  this: ItemsRepository,
  methodmapItems: Map<string, MethodMapItem>,
  uri: string
): void {
  const items = this.fileItems.get(uri);
  if (items === undefined) {
    return;
  }
  items.items.forEach((e) => {
    if (e.kind === CompletionItemKind.Class) {
      methodmapItems.set(e.name, e as MethodMapItem);
    }
  });
}

/**
 * Callback used by the map function in getAllItems. Gets all the items from a parsed file, without its includes.
 * @param  {string} uri    The URI of the file we should get the items for.
 * @returns SPItem
 */
function getFileItems(this: ItemsRepository, uri: string): SPItem[] {
  const items = this.fileItems.get(uri);
  return items !== undefined ? items.items : [];
}

/**
 * Recursively get all the includes from a FileItems object.
 * @param  {FileItem} fileItems    The object to get the includes from.
 * @param  {Set<string>} includes   The Set to add the include to.
 * @returns void
 */
function getIncludedFiles(
  itemsRepo: ItemsRepository,
  fileItems: FileItem,
  includes: Set<string>
): void {
  fileItems.includes.forEach((v, k) => {
    if (includes.has(v.uri)) {
      return;
    }
    includes.add(v.uri);
    const includeFileItems = itemsRepo.fileItems.get(v.uri);
    if (includeFileItems) {
      getIncludedFiles(itemsRepo, includeFileItems, includes);
    }
  });
}

/**
 * Get corresponding items from a position in a document.
 * @param  {ItemsRepository} itemsRepo      The itemsRepository object constructed in the activation event.
 * @param  {TextDocument} document          The document to get the item from.
 * @param  {Position} position              The position at which to get the item.
 * @returns SPItem
 */
export function getItemFromPosition(
  itemsRepo: ItemsRepository,
  document: TextDocument,
  position: Position
): SPItem[] {
  const range = document.getWordRangeAtPosition(position);
  if (range === undefined) {
    return [];
  }

  const allItems = itemsRepo.getAllItems(document.uri);

  const word = document.getText(range);
  const line = document.lineAt(position.line).text;

  if (word === "float") {
    const substring = line.slice(range.start.character);
    if (/^float\s*\(/.test(substring)) {
      return allItems.filter((e) => e.name === "float");
    }
  }

  // Generate an include item if the line is an #include statement and return it.
  const includeItem = makeIncludeItem(document, line, position);
  if (includeItem.length > 0) {
    return includeItem;
  }

  return allItems.filter((item) => {
    if (item.name !== word) {
      return false;
    }
    if (!item.range) {
      return false;
    }
    if (range.isEqual(item.range) && item.filePath === document.uri.fsPath) {
      return true;
    }
    if (item.references) {
      for (const ref of item.references) {
        if (
          range.isEqual(ref.range) &&
          ref.uri.fsPath === document.uri.fsPath
        ) {
          return true;
        }
      }
    }
    return false;
  });
}

/**
 * Try to generate an IncludeItem from an #include statement line and return it.
 * @param  {TextDocument} document          The document the item is generated for.
 * @param  {string} line                    The line to parse.
 * @param  {Position} position              The position to parse.
 * @returns SPItem
 */
function makeIncludeItem(
  document: TextDocument,
  line: string,
  position: Position
): SPItem[] {
  const match =
    line.match(/^\s*#include\s+<([A-Za-z0-9\-_\/.]+)>/) ||
    line.match(/^\s*#include\s+"([A-Za-z0-9\-_\/.]+)"/);
  if (!match) {
    return [];
  }
  let file = match[1];
  const fileStartPos = line.search(file);
  file = getIncludeExtension(file);
  const defRange = new Range(
    position.line,
    fileStartPos - 1,
    position.line,
    fileStartPos + file.length
  );
  const potentialIncludePaths = getAllPossibleIncludeFolderPaths(document.uri);

  const incFolderPath = potentialIncludePaths.find((e) =>
    existsSync(resolve(e, file))
  );
  if (incFolderPath) {
    return [
      new IncludeItem(
        URI.file(resolve(incFolderPath, file)).toString(),
        defRange
      ),
    ];
  }
  return [];
}
