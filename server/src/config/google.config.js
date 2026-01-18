import dotenv from "dotenv";

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_MODEL || "gemini-2.5-flash";

// Validate that the model is a string
if (!MODEL_NAME || typeof MODEL_NAME !== "string") {
  throw new Error(
    `Invalid model name: ${MODEL_NAME}. Please check your .env file.`
  );
}

export const googleConfig = {
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  model: MODEL_NAME,
};
