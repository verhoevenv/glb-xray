import {useState} from "react";
import "./App.css";
import GltfRootStructure from "./glb/GltfRootStructure.tsx";
import {GLBParser} from "./glb/GLBParser.ts";
import FileSelector from "./FileSelector.tsx";
import type {GLTFRoot} from "./glb/GLTF.ts";

function App() {
  const [parsedGltf, setAnnotatedGltf] = useState<GLTFRoot | string | null>(null);

  const onFileSelect = (file: File) => {
    const arrayBuffer = file.arrayBuffer();
    arrayBuffer
      .then((b) => {
        const parseGLB = GLBParser.parseGLB(b);
        setAnnotatedGltf(parseGLB);
      })
      .catch((reason) => setAnnotatedGltf(reason as string));
  };

  let content;
  if (typeof parsedGltf === "string") {
    content = <span>error {parsedGltf}</span>;
  } else if (parsedGltf) {
    content = <GltfRootStructure gltf={parsedGltf} />;
  }

  return (
    <>
      <FileSelector onFileSelect={onFileSelect} />
      <div>{content}</div>
    </>
  );
}

export default App;
