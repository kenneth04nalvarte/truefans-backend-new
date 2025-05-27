const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a unique pass ID
 * @returns {string} - Unique pass identifier
 */
const generatePassId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate a QR code for a digital pass
 * @param {string} passId - Unique pass identifier
 * @param {string} restaurantId - Restaurant identifier
 * @returns {Promise<string>} - Promise resolving to QR code data URL
 */
const generateQRCode = async (passId, restaurantId) => {
  try {
    // Create a data object containing pass information
    const passData = {
      passId,
      restaurantId,
      timestamp: Date.now()
    };

    // Convert data to string and generate QR code
    const dataString = JSON.stringify(passData);
    const qrCodeUrl = await QRCode.toDataURL(dataString);
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

module.exports = {
  generatePassId,
  generateQRCode
}; 