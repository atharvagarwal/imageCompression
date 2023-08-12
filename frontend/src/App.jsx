import React, { useState } from 'react';

const App = () => {
  const [selectedFolder, setSelectedFolder] = useState(null);

  const handleFolderSelect = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      setSelectedFolder(directoryHandle);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  const handleUpload = async () => {
    if (selectedFolder) {
      var folderContent = {};
      var directoryName="root";
      let directoryContent=[];
      const readEntries = async (directory) => {
        const entries = await directory.values();
        let entry = await entries.next();
        while (!entry.done) {
          if (entry.value.kind === 'file') {
            directoryContent.push(entry.value);
            folderContent[directoryName]=directoryContent;
            console.log(folderContent);
          } else if (entry.value.kind === 'directory') {
            directoryName=entry.value.name;
            if(directoryContent.length===0){
              folderContent[directoryName]=[];
            }
            directoryContent=[];
            await readEntries(entry.value);
          }
          entry = await entries.next();
        }
      };
      readEntries(selectedFolder);
      // Now you have the list of folder contents in the folderContents array
      console.log('Folder contents:', [folderContent]);

    // Continue with your upload logic
    fetch('http://localhost:3000/upload-folder', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: [folderContent]
})
.then(response => response.json())
.then(data => {
  console.log(data);
})
.catch(error => {
  console.error(error);
});
    }
  };

  return (
    <div>
      <button onClick={handleFolderSelect}>Select Folder</button>
      {selectedFolder && (
        <div>
          <p>Selected folder:</p>
          <p>{selectedFolder.name}</p>
          <button onClick={handleUpload}>Upload Folder</button>
        </div>
      )}
    </div>
  );
};

export default App;