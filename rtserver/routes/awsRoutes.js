const express = require("express");
const {
  uploadSingleImage,
  uploadSingleFile,
  handleImageUpload,
  handleFileUpload,
  getImage,
  getFile,
  uploadConversationFile,
  handleConversationFileUpload,
  uploadKBFile,
  handleKBFileUpload,
  getPresignedUploadUrl,
  getPresignedDownloadUrl
} = require("../controllers/awsController");

const router = express.Router();

router.post(
  "/fileUploadForConversation",
  uploadConversationFile,
  handleConversationFileUpload
);
router.post("/uploadImg", uploadSingleImage, handleImageUpload);
router.post("/uploadPdf", uploadSingleFile, handleFileUpload);
router.post('/uploadKBFile', uploadKBFile, handleKBFileUpload);
router.get("/image/:key", getImage);
router.get("/file/:key", getFile);

// Secure Presigned URL Routes
router.post("/presigned-upload", getPresignedUploadUrl);
router.post("/presigned-url", getPresignedDownloadUrl); // For secure retrieval
router.get("/presigned-url", getPresignedDownloadUrl); // For easier testing/linking

module.exports = router;
