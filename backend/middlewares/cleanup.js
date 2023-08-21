const path = require("path");
const fsPromises = require("fs").promises;

const FORCE_CLEANUP = true; // Set to true to force cleanup even with permission errors
async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function directoryExists(dirPath) {
  try {
    const stats = await fsPromises.stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

async function deleteFile(filePath) {
  try {
    if (FORCE_CLEANUP) {
      await fsPromises.unlink(filePath);
    } else {
      console.log("Permission denied to delete file:", filePath);
    }
  } catch (error) {
    console.log(error);
  }
}

async function deleteDirectoryRecursive(directoryPath) {
  try {
    const items = await fsPromises.readdir(directoryPath);

    for (const item of items) {
      const itemPath = path.join(directoryPath, item);
      const itemStats = await fsPromises.stat(itemPath);

      if (itemStats.isDirectory()) {
        await deleteDirectoryRecursive(itemPath);
      } else {
        await deleteFile(itemPath);
      }
    }

    if (FORCE_CLEANUP) {
      await fsPromises.rmdir(directoryPath);
    } else {
      console.log("Permission denied to delete directory:", directoryPath);
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  fileExists,
  directoryExists,
  deleteFile,
  deleteDirectoryRecursive,
};
