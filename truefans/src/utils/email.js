const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send a digital pass to a user via email
 * @param {string} to - Recipient email address
 * @param {string} restaurantName - Name of the restaurant
 * @param {string} passId - Unique pass identifier
 * @param {string} qrCodeUrl - URL of the QR code image
 * @returns {Promise} - Promise resolving to email send result
 */
const sendDigitalPass = async (to, restaurantName, passId, qrCodeUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Your Digital Pass for ${restaurantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Digital Pass is Ready!</h2>
        <p>Thank you for joining ${restaurantName}'s loyalty program.</p>
        <p>Here is your digital pass QR code:</p>
        <img src="${qrCodeUrl}" alt="Digital Pass QR Code" style="max-width: 200px; margin: 20px 0;">
        <p>Pass ID: ${passId}</p>
        <p>Please show this QR code to the restaurant staff when you visit.</p>
        <p>Happy dining!</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendDigitalPass
}; 