const axios = require('axios');

const PASS_NINJA_API_URL = 'https://api.passninja.com/v1';
const ACCOUNT_ID = process.env.PASS_NINJA_ACCOUNT_ID;
const API_KEY = process.env.PASS_NINJA_API_KEY;

/**
 * Create a digital pass for a user
 * @param {Object} user - User object
 * @param {Object} restaurant - Restaurant object
 * @param {Object} passData - Additional pass data
 * @returns {Promise<Object>} - Created pass
 */
const createPass = async (user, restaurant, passData) => {
    try {
        const response = await axios.post(
            `${PASS_NINJA_API_URL}/passes`,
            {
                passType: 'ptk_0x1d4',
                data: {
                    "icon-url": restaurant.logoUrl || "https://example.com/default-icon.png",
                    "altitude": "0",
                    "latitude": restaurant.location?.latitude || "0",
                    "longitude": restaurant.location?.longitude || "0",
                    "max-distance": "100",
                    "relevant-date": new Date().toISOString(),
                    "logo-url": restaurant.logoUrl || "https://example.com/default-logo.png",
                    "expiration-date": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    "barcode": {
                        "format": "PKBarcodeFormatQR",
                        "message": passData.passId,
                        "messageEncoding": "iso-8859-1"
                    },
                    "primaryFields": [
                        {
                            "key": "name",
                            "label": "Name",
                            "value": `${user.firstName} ${user.lastName}`
                        }
                    ],
                    "secondaryFields": [
                        {
                            "key": "points",
                            "label": "Points",
                            "value": passData.points?.toString() || "0"
                        }
                    ],
                    "auxiliaryFields": [
                        {
                            "key": "memberSince",
                            "label": "Member Since",
                            "value": new Date().toLocaleDateString()
                        }
                    ],
                    "backFields": [
                        {
                            "key": "terms",
                            "label": "Terms & Conditions",
                            "value": "This loyalty card is non-transferable and subject to terms and conditions."
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Account-ID': ACCOUNT_ID,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            id: response.data.serialNumber,
            downloadUrl: response.data.url,
            passType: response.data.passType
        };
    } catch (error) {
        console.error('Error creating pass:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update a digital pass
 * @param {string} passId - Pass identifier
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated pass
 */
const updatePass = async (passId, updateData) => {
    try {
        const response = await axios.put(
            `${PASS_NINJA_API_URL}/passes/${passId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Account-ID': ACCOUNT_ID,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating pass:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get pass details
 * @param {string} passId - Pass identifier
 * @returns {Promise<Object>} - Pass details
 */
const getPass = async (passId) => {
    try {
        const response = await axios.get(
            `${PASS_NINJA_API_URL}/passes/${passId}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Account-ID': ACCOUNT_ID
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error getting pass:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete a pass
 * @param {string} passId - Pass identifier
 * @returns {Promise<void>}
 */
const deletePass = async (passId) => {
    try {
        await axios.delete(
            `${PASS_NINJA_API_URL}/passes/${passId}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Account-ID': ACCOUNT_ID
                }
            }
        );
    } catch (error) {
        console.error('Error deleting pass:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = {
    createPass,
    updatePass,
    getPass,
    deletePass
}; 