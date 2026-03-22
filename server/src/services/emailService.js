const { sendVerificationEmail, sendPasswordResetEmail } = require("../config/email");

const emailService = {
  sendVerification: async (to, token) => {
    try {
      await sendVerificationEmail(to, token);
      console.log(`Verification email sent to ${to}`);
    } catch (err) {
      console.error(`Failed to send verification email to ${to}:`, err.message);
    }
  },

  sendPasswordReset: async (to, token) => {
    try {
      await sendPasswordResetEmail(to, token);
      console.log(`Password reset email sent to ${to}`);
    } catch (err) {
      console.error(`Failed to send password reset email to ${to}:`, err.message);
    }
  },
};

module.exports = emailService;
