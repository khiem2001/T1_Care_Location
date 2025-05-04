const axios = require('axios');

const updateFirebaseData = async (code, data) => {
  try {
    const url = `https://test-7b6bf-default-rtdb.asia-southeast1.firebasedatabase.app/${code}.json`;

    // Perform the PATCH request
    const response = await axios.patch(url, data);

    console.log('Data updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating Firebase data:', error.message);
    throw new Error('Failed to update Firebase data.');
  }
};

module.exports = { updateFirebaseData };
