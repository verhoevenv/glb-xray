import {SourcePath} from "./SourcePath.ts";

export type AnnotatedSource = AnnotatedSourceFragment[];
export interface AnnotatedSourceFragment {
  content: string;
  indentLevel: number;
  path: SourcePath;
  refersTo: SourcePath | null;
}
