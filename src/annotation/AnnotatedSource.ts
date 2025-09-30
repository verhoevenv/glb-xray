export type AnnotatedSource = AnnotatedSourceFragment[];
export interface AnnotatedSourceFragment {
  content: string;
  path: SourcePath;
  refersTo: SourcePath | null;
}

export class SourcePath {
  private readonly _elements: string[];

  constructor(path: string[]) {
    this._elements = path;
  }

  get elements(): string[] {
    return this._elements;
  }

  extend(next: string): SourcePath {
    return new SourcePath([...this._elements, next])
  }

  matchesExactly(searchPath: SourcePath): boolean {
    return searchPath.elements.every((v, i) => this.elements[i] === v);
  }
}