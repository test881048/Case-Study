const express = require("express");
const app = express();
const multer = require("multer");
const aws = require("aws-sdk");

aws.config.update({
  accessKeyId: "AKIAV52OWJCDRJ5PHKEA",
  secretAccessKey: "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",
  region: "us-east-1",
});

const s3 = new aws.S3();
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send(`
          <h2>RE: File Upload with <code>"Node.js"</code></h2>
          <form action="/api/upload" enctype="multipart/form-data" method="post">
              <div>Select a file:
                  <input type="file" name="file"  multiple="multiple" />
              </div>
              <input type="submit" value="upload" />
          </form>
      `);
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const s3Key = file.originalname;
  const params = {
    Bucket: "bhasker-ki-bucket",
    Key: s3Key,
    Body: file.buffer,
  };

  // Upload the file to S3
  s3.upload(params, (err, data) => {
    if (err) {
      res.status(500).send("Error uploading file to S3");
    } else {
      res.send("File Uploaded to S3.");
    }
  });
});

app.listen(3000, () => {
  console.log("server running on http://localhost:3000/");
});
