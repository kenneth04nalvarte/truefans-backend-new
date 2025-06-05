import admin from 'firebase-admin';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { logoUrl } = req.body;
    if (!logoUrl) {
      return res.status(400).json({ error: 'logoUrl is required' });
    }
    const resizedLogoBuffer = await downloadAndResizeLogo(logoUrl);
    // Use resizedLogoBuffer in your pass generation logic
    // ...
    return res.status(200).json({ message: 'Pass generated successfully' });
  } catch (error) {
    console.error('Error generating pass:', error);
    return res.status(500).json({ error: 'Error generating pass' });
  }
} 