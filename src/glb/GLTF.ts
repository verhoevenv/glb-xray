import type {AnnotatedSource} from "../annotation/AnnotatedSource.ts";

export interface GLTFRoot {
  [index: string]: GLTFNode;
}

export interface GLTFNode {
  annotatedSource: AnnotatedSource;
}
