import type {AnnotatedSourceFragment} from "../annotation/AnnotatedSource.ts";
import type {SourcePath} from "../annotation/SourcePath.ts";

interface Props {
  fragment: AnnotatedSourceFragment;
  highlighted: SourcePath | null;
  setHighlighted: (name: SourcePath | null) => void;
}

function GltfLine({
  fragment,
  highlighted,
  setHighlighted,
}: Props) {
  const onMouseEnter= () => setHighlighted(fragment.refersTo);
  const onMouseLeave= () => setHighlighted(null);
  const path=fragment.path;

  const contentWhitespace = "  ".repeat(fragment.indentLevel);
  const contentRest = fragment.content;

  const shouldHighlight = !!path && !!highlighted && path.matchesExactly(highlighted);
  const hasOutgoing = !!fragment.refersTo;
  const classNames = ["gltfLine"];
  if (shouldHighlight) {
    classNames.push("highlighted");
  }
  if (hasOutgoing) {
    classNames.push("outgoing");
  }
  return (
    <p
      className="gltfLine"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span>{contentWhitespace}</span><span className={classNames.join(" ")}>{contentRest}</span>
    </p>
  );
}

export default GltfLine;
