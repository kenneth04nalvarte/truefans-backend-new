// generatePass.js
// Script to generate an Apple Wallet pass using passkit-generator
// Fill in your own identifiers, certificate password, and asset paths as needed.

const { PKPass } = require('passkit-generator');
const fs = require('fs');
const path = require('path');

// Update these with your actual values
const PASS_TYPE_IDENTIFIER = 'pass.com.id.gettruefans'; // Your Pass Type ID
const TEAM_IDENTIFIER = 'H26G36V292'; // Your Apple Developer Team ID
const ORG_NAME = 'GetTrueFans';

// Paths to your new PEM files
const CERT_PATH = path.join(__dirname, 'mynewpass.pem');
const KEY_PATH = path.join(__dirname, 'mynewpass.key.pem');
const WWDR_PATH = path.join(__dirname, 'certs', 'wwdr.pem');

// Function to generate a pass using the folder model
async function generatePass({
  serialNumber,
  restaurantName,
  description = 'Restaurant Loyalty Pass',
  modelFolder = path.join(__dirname, 'passModels', 'myModel.pass'),
}) {
  try {
    // Validate required files exist
    if (!fs.existsSync(modelFolder)) {
      throw new Error(`Pass model folder not found: ${modelFolder}`);
    }
    if (!fs.existsSync(CERT_PATH)) {
      throw new Error(`Certificate PEM not found: ${CERT_PATH}`);
    }
    if (!fs.existsSync(KEY_PATH)) {
      throw new Error(`Private key PEM not found: ${KEY_PATH}`);
    }
    if (!fs.existsSync(WWDR_PATH)) {
      throw new Error(`WWDR PEM not found: ${WWDR_PATH}`);
    }

    // Prepare certificates
    const certificates = {
      wwdr: fs.readFileSync(WWDR_PATH),
      signerCert: fs.readFileSync(CERT_PATH),
      signerKey: fs.readFileSync(KEY_PATH),
      signerKeyPassphrase: undefined // If your key is password protected, set the password here
    };

    // Dynamic fields for the pass
    const overrides = {
      serialNumber,
      description,
      organizationName: restaurantName,
      logoText: restaurantName,
    };

    // Generate the pass
    const pass = await PKPass.from({
      model: modelFolder,
      certificates,
    }, overrides);

    // Output path
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const outputPath = path.join(outputDir, `${serialNumber}.pkpass`);
    const stream = pass.getAsStream();
    await new Promise((resolve, reject) => {
      stream.pipe(fs.createWriteStream(outputPath))
        .on('finish', resolve)
        .on('error', reject);
    });
    console.log(`Pass generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating pass:', error);
    throw error;
  }
}

// Example usage:
/*
generatePass({
  serialNumber: '1234567890',
  restaurantName: 'Sample Restaurant',
  iconPath: '/path/to/restaurant/icon.png',
  logoPath: '/path/to/restaurant/logo.png',
  description: 'Sample Restaurant Loyalty Pass'
}).catch(console.error);
*/

module.exports = generatePass; 