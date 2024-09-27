import { NextApiRequest, NextApiResponse } from 'next';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY
  });

  const model = groq('llama3-8b-8192');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { prompt } = req.body;
    try {
      const { text } = await generateText({
        model,
        prompt,
      });
      res.status(200).json({ text });
    } catch (error) {
      res.status(500).json({ error: 'Error generating text' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}