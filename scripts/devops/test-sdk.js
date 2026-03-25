import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI(GEMINI_API_KEY);

console.log('genAI keys:', Object.keys(genAI));
if (genAI.models) {
  console.log('genAI.models keys:', Object.keys(genAI.models));
} else {
  console.log('genAI.models is undefined');
}
