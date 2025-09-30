import type {GLTFNode} from "./GLTF.ts";
import parse, {type ArrayNode, type LiteralNode, type ObjectNode, type ValueNode,} from "json-to-ast";
import {type AnnotatedSource, SourcePath} from "../annotation/AnnotatedSource.ts";

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
        content: line,
        path: new SourcePath([""]),
        refersTo: null,
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

type ReferenceMapper = (rawValue: string) => SourcePath | null;

function noReference(): ReferenceMapper {
  return () => null;
}

function indexesIn(prefix: string): ReferenceMapper {
  return (rawValue: string) => new SourcePath([prefix, rawValue]);
}

function getReferenceMapper(path: SourcePath) {
  const anIndex = null;
  const aProperty = null;
  function matches(
    path: SourcePath,
    ...queryElements: (string | null)[]
  ): boolean {
    if (path.elements.length !== queryElements.length) {
      return false;
    }
    for (let i = 0; i < path.elements.length; i++) {
      const pathElement = path.elements[i];
      const queryElement = queryElements[i];
      if (queryElement && pathElement !== queryElement) {
        return false;
      }
    }
    return true;
  }

  if (matches(path, "scene")) {
    return indexesIn("scenes");
  }
  if (matches(path, "scenes", anIndex, "nodes", anIndex)) {
    return indexesIn("nodes");
  }
  if (matches(path, "nodes", anIndex, "mesh")) {
    return indexesIn("meshes");
  }
  if (matches(path, "meshes", anIndex, "primitives", anIndex, "attributes", aProperty)) {
    return indexesIn("accessors");
  }
  if (matches(path, "meshes", anIndex, "primitives", anIndex, "indices")) {
    return indexesIn("accessors");
  }
  if (matches(path, "meshes", anIndex, "primitives", anIndex, "material")) {
    return indexesIn("materials");
  }
  if (matches(path, "materials", anIndex, "pbrMetallicRoughness", "baseColorTexture", "index")) {
    return indexesIn("textures");
  }
  if (matches(path, "materials", anIndex, "pbrMetallicRoughness", "metallicRoughnessTexture", "index")) {
    return indexesIn("textures");
  }
  if (matches(path, "materials", anIndex, "normalTexture", "index")) {
    return indexesIn("textures");
  }
  if (matches(path, "textures", anIndex, "source")) {
    return indexesIn("images");
  }
  if (matches(path, "images", anIndex, "bufferView")) {
    return indexesIn("bufferViews");
  }
  if (matches(path, "accessors", anIndex, "bufferView")) {
    return indexesIn("bufferViews");
  }
  if (matches(path, "bufferViews", anIndex, "buffer")) {
    return indexesIn("buffers");
  }
  return noReference();
}

function convert(ast: ValueNode, path: SourcePath): AnnotatedSource {
  switch (ast.type) {
    case "Array":
      return convertArray(ast, path);
    case "Object":
      return convertObject(ast, path);
    case "Literal":
      return convertLiteral(ast, path);
  }
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
    annotatedSourceFragments[i].content =
      "  " + annotatedSourceFragments[i].content;
  }

  return [
    {
      content: "[",
      path: path,
      refersTo: null,
    },
    ...annotatedSourceFragments,
    {
      content: "]",
      path: path,
      refersTo: null,
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
          content: `${rawKey}: ${value[0].content}`,
          path: path.extend(key),
          refersTo: value[0].refersTo,
        },
        ...value.slice(1),
      ];
    });

  for (let i = 0; i < childSources.length - 1; i++) {
    childSources[i].at(-1)!.content += ",";
  }

  const annotatedSourceFragments = childSources.flat();

  for (let i = 0; i < annotatedSourceFragments.length; i++) {
    annotatedSourceFragments[i].content =
      "  " + annotatedSourceFragments[i].content;
  }

  return [
    {
      content: "{",
      path: path,
      refersTo: null,
    },
    ...annotatedSourceFragments,
    {
      content: "}",
      path: path,
      refersTo: null,
    },
  ];
}

function convertLiteral(ast: LiteralNode, path: SourcePath): AnnotatedSource {
  const referenceMapper = getReferenceMapper(path);
  const reference = referenceMapper(ast.raw);

  return [
    {
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
