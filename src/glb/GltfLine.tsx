import type {AnnotatedSourceFragment} from "../annotation/AnnotatedSource.ts";
import type {SourcePath} from "../annotation/SourcePath.ts";

interface Props {
  fragment: AnnotatedSourceFragment;
  highlighted: SourcePath | undefined;
  setHighlighted: (name: SourcePath | undefined) => void;
}

function GltfLine({
  fragment,
  highlighted,
  setHighlighted,
}: Props) {
  const onMouseEnter= () => setHighlighted(fragment.refersTo);
  const onMouseLeave= () => setHighlighted(undefined);
  const path=fragment.path;

  const contentWhitespace = "  ".repeat(fragment.indentLevel);
  const contentRest = fragment.content;

  const shouldHighlight = !!path && !!highlighted && path.matchesExactly(highlighted);
  const hasOutgoing = !!fragment.refersTo;
  const hasExtraInfo = !!fragment.extraInfo;
  const classNames = ["gltfLine"];
  if (shouldHighlight) {
    classNames.push("highlighted");
  }
  if (hasOutgoing) {
    classNames.push("outgoing");
  }
  if (hasExtraInfo) {
    classNames.push("withPopup");
  }
  return (
    <p
      className="gltfLine"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={fragment.extraInfo}
    >
      <span>{contentWhitespace}</span><span className={classNames.join(" ")}>{contentRest}</span>
    </p>
  );
}

export default GltfLine;
