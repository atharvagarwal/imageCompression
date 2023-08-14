const express = require('express');
const multer = require('multer');
const app = express();
const path = require('path');
const PORT = 3000;
const cors=require('cors');
const fs=require('fs');
app.use(cors())
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

app.use(express.json());

app.post('/upload', upload.single('zipFile'), (req, res) => {
    const uploadedZipFile = req.file;
  
    if (!uploadedZipFile) {
      return res.status(400).send('No zip file selected.');
    }
  
    const uploadPath = path.join(__dirname, 'uploads');
  
    fs.mkdirSync(uploadPath, { recursive: true });
  
    const zipFilePath = path.join(uploadPath, uploadedZipFile.originalname);
  
    fs.writeFileSync(zipFilePath, uploadedZipFile.buffer);
  
    res.status(200).json({ message: 'Zip file uploaded and stored successfully.' });
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
