export interface GLTFRoot {
  [index: string]: GLTFNode;
}

export type AnnotatedSource = AnnotatedSourceFragment[];
export interface AnnotatedSourceFragment {
  content: string;
  path: string[];
  refersTo: string[] | null;
}

export interface GLTFNode {
  annotatedSource: AnnotatedSource;
}
