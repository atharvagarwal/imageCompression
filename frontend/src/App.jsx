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

  const onZipAndSend = async () => {
    const zip = new JSZip();
    const files = Array.from(inputRef.current.files);

    files.forEach((file) => {
      zip.file(file.webkitRelativePath, file);
    });

    try {
      const zipContent = await zip.generateAsync({ type: "blob" }, throttledZipUpdate);
      const formData = new FormData();
      formData.append("zipFile", zipContent,"images.zip");

      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Zip file sent to the backend successfully.");
      } else {
        console.error("Error sending zip file to the backend.");
      }
    } catch (error) {
      console.error("Error generating zip or sending to backend:", error);
    }
  };

  return (
    <div className="App">
      <h1>Folder upload</h1>
      <h2>Select a folder to send to the server</h2>
      <input ref={inputRef} type="file" webkitdirectory="true" />
        <div>
          <div>
            <button onClick={onZipAndSend}>zip and send {files.length} files</button>
          </div>
          <progress max="100" value={progress}>
            {progress?.toFixed(2)}%{" "}
          </progress>
          <h3>Selected Files</h3>
          {files.map((file) => (
            <div key={file.webkitRelativePath}>{file.webkitRelativePath}</div>
          ))}
        </div>
    </div>
  );
}
