import type {GLTFNode} from "./GLTF.ts";
import parse, {type ArrayNode, type LiteralNode, type ObjectNode, type ValueNode,} from "json-to-ast";
import {type AnnotatedSource} from "../annotation/AnnotatedSource.ts";
import {SourcePath} from "../annotation/SourcePath.ts";

export function annotate(
  gltfJson: string,
  method: "json" | "ast" = "ast",
): Record<string, GLTFNode> {
  if (method === "json") {
    return annotateByJsonParse(gltfJson);
  } else if (method === "ast") {
    return annotateByAst(gltfJson);
  } else {
    return {};
  }
}

function annotateByJsonParse(gltfJson: string): Record<string, GLTFNode> {
  const parsed = JSON.parse(gltfJson) as Record<string, unknown>;

  const children: Record<string, GLTFNode> = {};
  for (const attributeName in parsed) {
    const attributeElement = parsed[attributeName];

    const prettyPrinted = JSON.stringify(attributeElement, null, 2);
    const annotatedSource = prettyPrinted.split("\n").map((line) => {
      return {
        indentLevel: 0,
        content: line,
        path: new SourcePath([""]),
      };
    });
    children[attributeName] = {
      annotatedSource,
    };
  }
  return children;
}

function annotateByAst(gltfJson: string) {
  let children: Record<string, GLTFNode> = {};

  const astRoot = parse(gltfJson);
  if (astRoot.type === "Object") {
    children = extractChildren(astRoot);
  }

  return children;
}

function extractChildren(gltf: ObjectNode): Record<string, GLTFNode> {
  const children: Record<string, GLTFNode> = {};
  for (const child of gltf.children) {
    const attributeName = child.key.value;
    const attributeElement = child.value;
    children[attributeName] = makeNode(attributeName, attributeElement);
  }
  return children;
}

type ReferenceMapper = (rawValue: string) => SourcePath | undefined;

function noReference(): ReferenceMapper {
  return () => undefined;
}

function indexesIn(prefix: string): ReferenceMapper {
  return (rawValue: string) => new SourcePath([prefix, rawValue]);
}

function getReferenceMapper(path: SourcePath) {
  const anIndex = null;
  const aProperty = null;

  if (path.matches("scene")) {
    return indexesIn("scenes");
  }
  if (path.matches("scenes", anIndex, "nodes", anIndex)) {
    return indexesIn("nodes");
  }
  if (path.matches("nodes", anIndex, "children", anIndex)) {
    return indexesIn("nodes");
  }
  if (path.matches("nodes", anIndex, "mesh")) {
    return indexesIn("meshes");
  }
  if (path.matches("meshes", anIndex, "primitives", anIndex, "attributes", aProperty)) {
    return indexesIn("accessors");
  }
  if (path.matches("meshes", anIndex, "primitives", anIndex, "indices")) {
    return indexesIn("accessors");
  }
  if (path.matches("meshes", anIndex, "primitives", anIndex, "material")) {
    return indexesIn("materials");
  }
  if (path.matches("materials", anIndex, "pbrMetallicRoughness", "baseColorTexture", "index")) {
    return indexesIn("textures");
  }
  if (path.matches("materials", anIndex, "pbrMetallicRoughness", "metallicRoughnessTexture", "index")) {
    return indexesIn("textures");
  }
  if (path.matches("materials", anIndex, "normalTexture", "index")) {
    return indexesIn("textures");
  }
  if (path.matches("textures", anIndex, "source")) {
    return indexesIn("images");
  }
  if (path.matches("images", anIndex, "bufferView")) {
    return indexesIn("bufferViews");
  }
  if (path.matches("accessors", anIndex, "bufferView")) {
    return indexesIn("bufferViews");
  }
  if (path.matches("bufferViews", anIndex, "buffer")) {
    return indexesIn("buffers");
  }
  return noReference();
}

function cleanup(annotatedSource: AnnotatedSource, path: SourcePath): AnnotatedSource {
  if (path.matches("nodes", null, "matrix")) {
    // matrix should have 18 children: opening "[", 4 x 4 elements, closing "]"
    if (annotatedSource.length != 18) {
      // if it doesn't have 18 children, let's stay away from it
      return annotatedSource;
    }
    annotatedSource[16].content += " "; // offset missing comma after last element
    const columnWidths = [0, 0, 0, 0];
    for (let rowIdx = 0; rowIdx < 4; rowIdx++) {
      for (let colIdx = 0; colIdx < 4; colIdx++) {
        columnWidths[colIdx] = Math.max(columnWidths[colIdx], annotatedSource[rowIdx*4 + colIdx + 1].content.length);
      }
    }
    for (let i = 0; i < 4; i++) {
      columnWidths[i] = columnWidths[i] + 1;
    }
    const matrixLines = [];
    for (let i = 0; i < 4; i++) {
      const joinedLine =
        annotatedSource[i * 4 + 1].content.padStart(columnWidths[0]) +
        annotatedSource[i * 4 + 2].content.padStart(columnWidths[1]) +
        annotatedSource[i * 4 + 3].content.padStart(columnWidths[2]) +
        annotatedSource[i * 4 + 4].content.padStart(columnWidths[3])
      matrixLines.push( {
        ...annotatedSource[i*4 + 1],
        path: path,
        content: joinedLine
      })
    }
    return [
      annotatedSource[0],
      ...matrixLines,
      annotatedSource[17],
    ]
  }
  return annotatedSource;
}

function addExtraInfo(annotatedSource: AnnotatedSource, path: SourcePath): AnnotatedSource {
  if (path.matches("accessors", null, "componentType")) {
    if (annotatedSource.length != 1) {
      return annotatedSource;
    }
    const componentTypeValue = annotatedSource[0].content;
    const result = {
      "5120": "signed byte (8 bits)",
      "5121": "unsigned byte (8 bits)",
      "5122": "signed short (16 bits)",
      "5123": "unsigned short (16 bits)",
      "5125": "unsigned int (32 bits)",
      "5126": "float (32 bits)",
    }[componentTypeValue] ?? "unknown componentType";
    return [{
      ...annotatedSource[0],
      extraInfo: result
    }];
  }
  return annotatedSource;
}

function convert(ast: ValueNode, path: SourcePath): AnnotatedSource {
  let annotatedSource;
  switch (ast.type) {
    case "Array":
      annotatedSource = convertArray(ast, path);
      break;
    case "Object":
      annotatedSource = convertObject(ast, path);
      break;
    case "Literal":
      annotatedSource = convertLiteral(ast, path);
      break;
  }
  const cleanedSource = cleanup(annotatedSource, path);
  return addExtraInfo(cleanedSource, path);
}

function convertArray(ast: ArrayNode, path: SourcePath): AnnotatedSource {
  const children = ast.children;
  const childSources = children.map((child, idx) => {
    return convert(child, path.extend("" + idx));
  });

  for (let i = 0; i < childSources.length - 1; i++) {
    childSources[i].at(-1)!.content += ",";
  }

  const annotatedSourceFragments = childSources.flat();

  for (let i = 0; i < annotatedSourceFragments.length; i++) {
    annotatedSourceFragments[i].indentLevel = annotatedSourceFragments[i].indentLevel + 1;
  }

  return [
    {
      indentLevel: 0,
      content: "[",
      path: path,
    },
    ...annotatedSourceFragments,
    {
      indentLevel: 0,
      content: "]",
      path: path,
    },
  ];
}

function convertObject(ast: ObjectNode, path: SourcePath): AnnotatedSource {
  const children = ast.children;
  const childSources = children
    .map((child) => {
      return {
        rawKey: child.key.raw,
        key: child.key.value,
        value: convert(child.value, path.extend(child.key.value)),
      };
    })
    .map(({ rawKey, key, value }) => {
      return [
        {
          ...value[0],
          content: `${rawKey}: ${value[0].content}`,
          path: path.extend(key),
        },
        ...value.slice(1),
      ];
    });

  for (let i = 0; i < childSources.length - 1; i++) {
    childSources[i].at(-1)!.content += ",";
  }

  const annotatedSourceFragments = childSources.flat();

  for (let i = 0; i < annotatedSourceFragments.length; i++) {
    annotatedSourceFragments[i].indentLevel = annotatedSourceFragments[i].indentLevel + 1;
  }

  return [
    {
      indentLevel: 0,
      content: "{",
      path: path,
    },
    ...annotatedSourceFragments,
    {
      indentLevel: 0,
      content: "}",
      path: path,
    },
  ];
}

function convertLiteral(ast: LiteralNode, path: SourcePath): AnnotatedSource {
  const referenceMapper = getReferenceMapper(path);
  const reference = referenceMapper(ast.raw);

  return [
    {
      indentLevel: 0,
      content: ast.raw,
      path: path,
      refersTo: reference,
    },
  ];
}

function makeNode(
  attributeName: string,
  attributeElement: ValueNode,
): GLTFNode {
  const annotatedSourceFragments = convert(attributeElement, new SourcePath([attributeName]));
  return {
    annotatedSource: annotatedSourceFragments,
  };
}
