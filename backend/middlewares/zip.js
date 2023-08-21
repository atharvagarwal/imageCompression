const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const AdmZip = require("adm-zip");
const archiver = require("archiver");

//middleware
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//extract zip file from uploads into our inputDirectory
async function extractZipFile() {
  const uploadsFolder = "uploads";
  const inputDirectory = "inputDirectory";

  // Check if inputDirectory exists, if not, create it
  if (!fs.existsSync(inputDirectory)) {
    fs.mkdirSync(inputDirectory);
  }

  // List all files in the uploads folder
  const uploadedFiles = fs.readdirSync(uploadsFolder);

  uploadedFiles.forEach((file) => {
    if (file.endsWith(".zip")) {
      const zipPath = path.join(uploadsFolder, file);

      // Create a subdirectory in inputDirectory with the same name as the zip file (without extension)
      const subdirectoryName = path.parse(file).name;
      const subdirectoryPath = path.join(inputDirectory, subdirectoryName);
      fs.mkdirSync(subdirectoryPath, { recursive: true });

      // Extract the zip file to the subdirectory
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(subdirectoryPath, true);

      console.log(`Extracted ${file} to ${subdirectoryPath}.`);
    }
  });
}

//code to convert the processed file into zip
async function archiveFile() {
  const sourceFolder = "outputDirectory"; // Replace with the path of the source folder
  const outputZipFile = "output.zip"; // Replace with the desired name of the output ZIP file
  const output = fs.createWriteStream(outputZipFile);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(`ZIP file ${outputZipFile} has been created.`);
  });

  archive.on("error", (err) => {
    console.error("Error creating ZIP:", err);
  });

  archive.pipe(output);

  function addFilesToArchive(archive, sourcePath, entryPath) {
    const items = fs.readdirSync(sourcePath);

    items.forEach((item) => {
      const itemPath = path.join(sourcePath, item);
      const stats = fs.statSync(itemPath);
      const archiveEntryPath = entryPath ? path.join(entryPath, item) : item;

      if (stats.isDirectory()) {
        addFilesToArchive(archive, itemPath, archiveEntryPath);
      } else {
        archive.file(itemPath, { name: archiveEntryPath });
      }
    });
  }

  addFilesToArchive(archive, sourceFolder);

  archive.finalize();
}

module.exports = { archiveFile, extractZipFile };
