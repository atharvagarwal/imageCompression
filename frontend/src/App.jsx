import React, { useRef, useState, useEffect } from "react";
import JSZip from "jszip";
import throttle from "lodash.throttle";
export default function App() {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(-1);
  const [files, setFiles] = useState([]);
  const [downloadBtn, useDownload] = useState(false);
  useEffect(() => {
    //every time we refresh the page it tends to clean up the dirty files present on the backend.
    handleCleanup();
  }, []);

  //it is used to update the zip file with the contents
  const onZipUpdate = (metadata) => {
    setProgress(metadata.percent);
    console.log("progression: " + metadata.percent.toFixed(2) + " %");
    if (metadata.currentFile) {
      console.log("current file = " + metadata.currentFile);
    }
  };
  const throttledZipUpdate = throttle(onZipUpdate, 50);
  //it is used to initiate the zip file and send it to the server;
  const onZipAndSend = async () => {
    const zip = new JSZip();
    const files = Array.from(inputRef.current.files);

    files.forEach((file) => {
      zip.file(file.webkitRelativePath, file);
    });

    try {
      const zipContent = await zip.generateAsync(
        { type: "blob" },
        throttledZipUpdate
      );
      const formData = new FormData();
      formData.append("zipFile", zipContent, "images.zip");

      const response = await fetch("https://image-compression-backend-ten.vercel.app/upload", {
        method: "POST",
        body: formData,

      });

      if (response.ok) {
        const data = await response.json();
        alert("files Uploaded");
        useDownload(true);
      } else {
        console.error("Error sending zip file to the backend.");
      }
    } catch (error) {
      console.error("Error generating zip or sending to backend:", error);
    }
  };

  //every time we refresh the page it tends to clean up the dirty files present on the backend.
  const handleCleanup = async () => {
    try {
      // Send a POST request to initiate cleanup
      const response = await fetch("https://image-compression-backend-ten.vercel.app/cleanup", {
        method: "POST",
        

      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
      } else {
        console.log("not cleaned");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };
  //once our files are processed we can download it using this function.
  const handleDownload = async () => {
    try {
      const response = await fetch("https://image-compression-backend-ten.vercel.app/download-zip", {
        method: "GET",

      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "output.zip"; // Replace with the desired download filename
        a.click();
        window.URL.revokeObjectURL(url);
        handleCleanup();
        useDownload(false);
      } else {
        console.error("Error downloading ZIP file:", response.statusText);
      }
    } catch (error) {
      console.error("Error downloading ZIP file:", error);
    }
  };

  return (
    <div className="App">
      <h1 className="text-3xl font-extrabold text-center p-6">
        Multi Folder Image Compression System
      </h1>
      <div className=" flex justify-center gap-16 mt-6 px-10">
        <div className="border-2 rounded-xl p-6 bg-gray-100 lg:w-1/4 md:w-1/2 sm:w-full sm:m-6">
          <h2 className="text-xl font-bold  m-2 text-red-700">
            Select a folder to send to the server*
          </h2>

          <input
            className="text-md font-bold  m-2 text-green-700"
            ref={inputRef}
            type="file"
            webkitdirectory="true"
          />
          <div>
            <div>
              <button
                className="text-md font-bold m-2  bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                onClick={onZipAndSend}
              >
                zip and send files
              </button>
            </div>
            {files.map((file) => (
              <div key={file.webkitRelativePath}>{file.webkitRelativePath}</div>
            ))}
          </div>
          {downloadBtn ? (
            <button
              onClick={handleDownload}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center m-2"
            >
              <svg
                className="fill-current w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              <span>Download (Enabled)</span>
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center m-2"
              disabled
            >
              <svg
                className="fill-current w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              <span>Download (Disabled)</span>
            </button>
          )}
        </div>
        <div className="hidden md:inline w-1/2">
          <img src="frontImage.png" alt="main-image"></img>
        </div>
      </div>
    </div>
  );
}
