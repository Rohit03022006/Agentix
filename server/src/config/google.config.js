import dotenv from 'dotenv';

dotenv.config();

export const googleConfig = {
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  model: process.env.AI_Agent_CLI || 'gemini-2.5-flash',
};
