import type {ChangeEvent, DragEvent} from "react";
import "./App.css";

interface FileSelectorProps {
  onFileSelect: (file: File) => void;
}

function FileSelector({ onFileSelect }: FileSelectorProps) {
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];
      onFileSelect(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    onFileSelect(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    >
      <label htmlFor="upload_button" className="button">Choose file to analyze (GLB)</label>
      <input
        id="upload_button"
        style={{opacity: 0}}
        type="file"
        accept=".glb,model/gltf-binary"
        onChange={handleFileSelect}/>
      <p>Or drag a file here!</p>
    </div>
  );
}

export default FileSelector;
