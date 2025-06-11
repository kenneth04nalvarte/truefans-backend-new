import admin from 'firebase-admin';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
const generatePass = require('../../generatePass');

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: 'your-firebase-storage-bucket.appspot.com' // Replace with your bucket name
  });
}

const bucket = admin.storage().bucket();

async function downloadAndResizeLogo(logoUrl) {
  const fileName = path.basename(logoUrl);
  const tempDir = '/tmp'; // Vercel and most serverless environments use /tmp for temp files
  const filePath = path.join(tempDir, fileName);
  const resizedPath = path.join(tempDir, `resized_${fileName}`);

  // Download the file from Firebase Storage
  await bucket.file(`logos/${fileName}`).download({ destination: filePath });

  // Resize the image
  await sharp(filePath)
    .resize(29, 29)
    .toFile(resizedPath);

  // Read the resized image
  const resizedImageBuffer = fs.readFileSync(resizedPath);

  // Clean up temporary files
  fs.unlinkSync(filePath);
  fs.unlinkSync(resizedPath);

  return resizedImageBuffer;
}

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://gettruefans.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { logoUrl, serialNumber, restaurantName, description } = req.body;
    if (!logoUrl || !serialNumber || !restaurantName) {
      return res.status(400).json({ error: 'logoUrl, serialNumber, and restaurantName are required' });
    }
    const resizedLogoBuffer = await downloadAndResizeLogo(logoUrl);
    // Save resizedLogoBuffer to a temp file to be used in the pass model if needed
    // ... (add logic if your pass model uses the logo file)

    // Generate the pass
    const passPath = await generatePass({
      serialNumber,
      restaurantName,
      description: description || 'Restaurant Loyalty Pass',
      // modelFolder: ... (add if you want to specify a custom model)
    });

    // Stream the .pkpass file to the client
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="pass.pkpass"`);
    const fileStream = fs.createReadStream(passPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error generating pass:', error);
    return res.status(500).json({ error: 'Error generating pass' });
  }
} 