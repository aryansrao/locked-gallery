require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { secretPassword } = require("./config");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;
const host = "0.0.0.0";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gallery-app", // Folder name in your Cloudinary account
    allowed_formats: ["jpg", "png", "jpeg"], // Allowed file formats
  },
});
const upload = multer({ storage });

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.json()); // Ensure bodyParser is set up to parse JSON data

// Function to get the local IP address
function getLocalIP() {
  const os = require("os");
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Routes

// Login endpoint
app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === secretPassword) {
    return res.status(200).json({ message: "Success" });
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// Upload image to Cloudinary
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }
  
  res.status(200).send({
    message: "Image uploaded successfully",
    url: req.file.path, // URL of the uploaded image
    public_id: req.file.public_id, // Cloudinary public_id for the uploaded image
  });
});

// Get all images from Cloudinary
app.get("/images", async (req, res) => {
  try {
    const { resources } = await cloudinary.search
      .expression("folder:gallery-app") // Search images in the "gallery-app" folder
      .sort_by("public_id", "desc") // Sort by newest first
      .max_results(30) // Maximum 30 results
      .execute();

    const imageUrls = resources.map((file) => ({
      url: file.secure_url, // Secure URL for image
      public_id: file.public_id, // Cloudinary public ID for deleting later
    }));

    res.status(200).json(imageUrls);
  } catch (err) {
    console.error("Error fetching images:", err);
    res.status(500).json({ message: "Error fetching images", error: err.message });
  }
});

// Delete an image from Cloudinary
app.delete("/delete", async (req, res) => {
  const { public_id } = req.body; // Public ID of the image
  
  if (!public_id) {
    return res.status(400).json({ message: "Public ID is required to delete image" });
  }

  try {
    await cloudinary.uploader.destroy(public_id);
    res.status(200).send({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ message: "Error deleting image", error: err.message });
  }
});

// Start server
app.listen(port, host, () => {
  const localIP = getLocalIP();
  console.log(`Gallery app running at:`);
  console.log(`- Local:   http://localhost:${port}`);
  console.log(`- Network: http://${localIP}:${port}`);
});