/**
 * Standardizes the API response format.
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} status - Operation success status
 * @param {string} message - User-friendly message
 * @param {any} data - The actual data payload
 */
export const sendResponse = (res, statusCode, status, message, data = null) => {
    const response = {
        status,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};
