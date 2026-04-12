const { OAuth2Client } = require('google-auth-library');

const verifyGoogleToken = async (idToken) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    return ticket.getPayload(); // { email, name, picture, sub, etc. }
  } catch (error) {
    console.error('Error verifying Google Token:', error);
    throw new Error('Invalid Google Token');
  }
};

module.exports = { verifyGoogleToken };
