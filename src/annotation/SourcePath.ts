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

  matches(...queryElements: (string | null)[]): boolean {
    if (this.elements.length !== queryElements.length) {
      return false;
    }
    for (let i = 0; i < this.elements.length; i++) {
      const pathElement = this.elements[i];
      const queryElement = queryElements[i];
      if (queryElement && pathElement !== queryElement) {
        return false;
      }
    }
    return true;
  }
}