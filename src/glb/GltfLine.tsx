interface GltfLineProps {
  content: string;
  path?: string[];
  highlighted?: string[] | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function GltfLine({
  content,
  path,
  highlighted,
  onMouseEnter,
  onMouseLeave,
}: GltfLineProps) {
  const shouldHighlight =
    path && highlighted && highlighted.every((v, i) => path[i] === v);
  const className = shouldHighlight ? "gltfLine highlighted" : "gltfLine";
  return (
    <p
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </p>
  );
}

export default GltfLine;
