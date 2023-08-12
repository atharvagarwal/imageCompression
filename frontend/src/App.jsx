import React, { useRef, useState } from "react";
import JSZip from "jszip";
import throttle from "lodash.throttle";
import { saveAs } from "file-saver";

export default function App() {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(-1);
  const [files, setFiles] = useState([]);

  const onZipUpdate = (metadata) => {
    setProgress(metadata.percent);
    console.log("progression: " + metadata.percent.toFixed(2) + " %");
    if (metadata.currentFile) {
      console.log("current file = " + metadata.currentFile);
    }
  };
  const throttledZipUpdate = throttle(onZipUpdate, 50);

  const onZip = () => {
    const zip = new JSZip();
    const files = Array.from(inputRef.current.files);

    files.forEach((file) => {
      zip.file(file.webkitRelativePath, file);
    });
    zip
      .generateAsync({ type: "blob" }, throttledZipUpdate)
      .then(function (content) {
        saveAs(content, "files.zip");

        const formData = new FormData();
        formData.append("folderzip", content);
        console.log("ready to send to server", content);
      })
      .catch((e) => console.log(e));
  };
  return (
    <div className="App">
      <h1>Folder upload</h1>
      <h2>Select a folder to send to the server</h2>
      <input ref={inputRef} type="file" webkitdirectory="true" />
      {files.length && (
        <div>
          <div>
            <button onClick={onZip}>zip {files.length} files</button>
          </div>
          <progress max="100" value={progress}>
            {progress?.toFixed(2)}%{" "}
          </progress>
          <h3>Selected Files</h3>
          {files.map((file) => (
            <div key={file.webkitRelativePath}>{file.webkitRelativePath}</div>
          ))}
        </div>
      )}
    </div>
  );
}
