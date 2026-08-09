import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_2026',
  jwtExpiresIn: '7d',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock',
  },
};
