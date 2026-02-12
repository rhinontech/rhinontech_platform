require("dotenv").config();
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

// AWS S3 client setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// File naming helper
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  return `${timestamp}${ext}`;
};

// Multer S3 upload config
const s3Storage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    cb(
      null,
      `${process.env.S3_FOLDER_NAME}/${generateFileName(file.originalname)}`
    );
  },
});

const kbStorage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const uniqueName = generateFileName(file.originalname);
    // Store in a dedicated 'knowledge-base' folder
    cb(null, `${process.env.S3_FOLDER_NAME}/knowledge-base/${uniqueName}`);
  },
});

// Middleware for image upload (accepts image/* only)
const uploadSingleImage = multer({
  storage: s3Storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
}).single("image");

// Middleware for PDF/file upload
const uploadSingleFile = multer({
  storage: s3Storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only PDF, Word, Text, and PowerPoint files are allowed"),
        false
      );
    }
    cb(null, true);
  },
}).single("file");

// Controller: Upload image
const handleImageUpload = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  res.json({
    message: "Image uploaded successfully",
    key: req.file.key,
    url: req.file.location,
  });
};

const handleFileUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileName = path.basename(req.file.key);

  res.json({
    message: "File uploaded successfully",
    fileName, // Just the filename (e.g., "1752072941938.pdf")
  });
};

// Helper to stream file from S3
const streamFromS3 = async (key, res) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    res.set("Content-Type", data.ContentType || "application/octet-stream");
    data.Body.pipe(res);
  } catch (err) {
    console.error("S3 GetObject error:", err.message);
    res.status(404).json({ error: "File not found" });
  }
};

// Controller: Get image
const getImage = (req, res) => {
  const key = req.params.key;
  streamFromS3(key, res);
};

// Controller: Get file
const getFile = (req, res) => {
  const key = req.params.key;
  streamFromS3(key, res);
};

// File naming helper for conversation attachments
const generateConversationFileName = (originalName) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  return `${base}-${timestamp}${ext}`;
};

// Storage for conversation files (unique names in "attachments")
const conversationStorage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET_NAME,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const uniqueName = generateConversationFileName(file.originalname);
    cb(null, `${process.env.S3_FOLDER_NAME}/attachments/${uniqueName}`);
  },
});

const uploadConversationFile = multer({
  storage: conversationStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
}).single("file");

// Controller: Handle conversation file upload
const handleConversationFileUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileName = path.basename(req.file.key);

  res.json({
    message: "Conversation file uploaded successfully",
    fileName,
    key: req.file.key,
    mimeType: req.file.mimetype,
  });
};


// Middleware for KB file upload (images only - logo, favicon, background, etc.)
const uploadKBFile = multer({
  storage: kbStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed for KB"), false);
    }
    cb(null, true);
  },
}).single("file");

// Controller: Handle KB file upload
const handleKBFileUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Return the full URL and key
  res.json({
    message: "KB file uploaded successfully",
    fileName: path.basename(req.file.key),
    key: req.file.key,
    url: req.file.location,
    mimeType: req.file.mimetype,
  });
};




// Controller: Get Presigned Upload URL (PUT)
const getPresignedUploadUrl = async (req, res) => {
  const { fileName, fileType, folder } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "fileName and fileType are required" });
  }

  const uniqueFileName = generateFileName(fileName);
  const targetFolder = folder ? `${process.env.S3_FOLDER_NAME}/${folder}` : process.env.S3_FOLDER_NAME;
  const key = `${targetFolder}/${uniqueFileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    res.json({
      uploadUrl,
      key,
      fileName: uniqueFileName,
    });
  } catch (err) {
    console.error("Presigned Upload URL error:", err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

// Controller: Get Presigned Download URL (GET)
const getPresignedDownloadUrl = async (req, res) => {
  // Support both body (POST) and query (GET) for flexibility
  const key = req.query.key || (req.body && req.body.key);

  if (!key) {
    return res.status(400).json({ error: "File key is required" });
  }

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  try {
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
    res.json({ downloadUrl });
  } catch (err) {
    console.error("Presigned Download URL error:", err);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
};

module.exports = {
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
};
