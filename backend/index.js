const express = require("express");
const multer = require("multer");
const app = express();
const path = require("path");
const PORT = 3000;
const cors = require("cors");
const fs = require('fs')
const fsP = require('fs').promises;
const sharp = require("sharp");
const AdmZip = require("adm-zip");
const archiver = require("archiver");
app.use(cors());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(express.json());

//Compression Script
const compressAndResizeImage = async (inputPath, outputPath, maxWidth) => {
  try {
    // Read the input image file
    const inputBuffer = await fs.promises.readFile(inputPath);

    // Get the size of the original image in kilobytes (KB)
    const inputSize = (Buffer.byteLength(inputBuffer) / 1024).toFixed(2);
    // Get the dimensions of the input image
    const inputMetadata = await sharp(inputBuffer).metadata();
    const { width: originalWidth, height: originalHeight } = inputMetadata;

    let scaleFactor = 1;
    if (originalWidth >= originalHeight) {
      scaleFactor = (maxWidth / originalWidth).toPrecision(4);
    } else {
      scaleFactor = (maxWidth / originalHeight).toPrecision(4);
    }

    scaleFactor = Math.min(scaleFactor, 0.75);
    const width = Math.floor(originalWidth * scaleFactor);
    const height = Math.floor(originalHeight * scaleFactor);

    let compressedResizedBuffer = await sharp(inputBuffer)
      .resize({ width, height })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Get the size of the resized image in kilobytes (KB)
    let outputSize = (
      Buffer.byteLength(compressedResizedBuffer) / 1024
    ).toFixed(2);
    // Write the compressed and resized image to the output file
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    if (parseInt(inputSize) <= parseInt(outputSize)) {
      await fs.promises.writeFile(outputPath, inputBuffer);
    } else {
      await fs.promises.writeFile(outputPath, compressedResizedBuffer);
    }
    console.log(`Image compression and resizing successful for ${inputPath}`);
    console.log(`initial size: ${inputSize} KB`);
    console.log(
      `Resized Size: ${
        parseInt(inputSize) > parseInt(outputSize) ? outputSize : inputSize
      } KB`
    );
  } catch (error) {
    console.error(
      `An error occurred during image compression and resizing for ${inputPath}:`,
      error
    );
  }
};

// Function to recursively process files in a directory
const processFilesRecursively = async (
  inputDirectory,
  outputDirectory,
  maxWidth
) => {
  try {
    const files = await fs.promises.readdir(inputDirectory);

    for (const file of files) {
      const inputPath = path.join(inputDirectory, file);
      const outputPath = path.join(outputDirectory, file);

      const stats = await fs.promises.stat(inputPath);
      if (stats.isDirectory()) {
        // Create a subdirectory in the output directory
        const subOutputDirectory = path.join(outputDirectory, file);
        await fs.promises.mkdir(subOutputDirectory, { recursive: true });

        // Recursively process files in the subdirectory
        await processFilesRecursively(inputPath, subOutputDirectory, maxWidth);
      } else {
        // Compress and resize the image
        await compressAndResizeImage(inputPath, outputPath, maxWidth);
      }
    }
  } catch (error) {
    console.error("An error occurred while processing files:", error);
  }
};

// Specify the input and output directories
const inputDirectory = "inputDirectory";
const outputDirectory = "outputDirectory";

// Set the maximum width for resizing
let maxWidth = 1000; // Adjust as needed

// Ensure the output directory exists
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}


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


//http endpoints
app.get("/download-zip", async(req, res) => {
  const zipFilePath = path.join(__dirname, "output.zip");
  const zipFileStream = fs.createReadStream(zipFilePath);

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=output.zip");

  zipFileStream.pipe(res);
});

app.post("/upload", upload.single("zipFile"), async(req, res) => {
  const uploadedZipFile = req.file;

  if (!uploadedZipFile) {
    return res.status(400).send("No zip file selected.");
  }

  const uploadPath = path.join(__dirname, "uploads");

  fs.mkdirSync(uploadPath, { recursive: true });

  const zipFilePath = path.join(uploadPath, uploadedZipFile.originalname);

  fs.writeFileSync(zipFilePath, uploadedZipFile.buffer);

  extractZipFile();
  await processFilesRecursively(inputDirectory, outputDirectory, maxWidth);
  await archiveFile()
  res
    .status(200)
    .json({ message: "Zip file uploaded and stored successfully." });
});

app.post('/cleanup', async (req, res) => {
  try {
      // Delete the output.zip file
      await fsP.unlink(path.join(__dirname, 'output.zip'));

      // Delete the outputFolder, inputFolder, and uploads folders
      await fsP.rmdir(path.join(__dirname, 'outputDirectory'), { recursive: true });
      await fsP.rmdir(path.join(__dirname, 'inputDirectory'), { recursive: true });
      await fsP.rmdir(path.join(__dirname, 'uploads'), { recursive: true });

      console.log('Cleanup completed successfully.');
      res.status(200).send({message: 'Cleanup completed successfully'});
  } catch (error) {
      console.error('An error occurred during cleanup:', error);
      res.status(500).send({message: 'Cleanup failed'});
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
