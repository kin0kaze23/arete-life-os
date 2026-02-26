import { YoutubeTranscript } from 'youtube-transcript';
import { modelRouter } from './_modelRouter.js';

export const extractUrls = (input: string): string[] => {
  const regex = /https?:\/\/[^\s]+/gim;
  return input.match(regex) || [];
};

export const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/i.test(url);
};

export const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/i);
  return match?.[1] ?? null;
};

export const fetchJinaReader = async (url: string): Promise<string> => {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

  const response = await fetch(jinaUrl, {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Jina Reader failed: ${response.status}`);
  }

  const text = await response.text();
  return text.substring(0, 8000);
};

export const analyzePhotoWithGemini = async (
  fileBuffer: Buffer,
  caption?: string
): Promise<string> => {
  const base64Image = fileBuffer.toString('base64');
  const prompt = `Describe what you see in this image in detail.\nWhat information does it contain?\nWhat life category does it relate to (health, nutrition, finance, relationships, spiritual, work, personal)?\n${caption ? `User caption: "${caption}"` : ''}\nBe specific and extractive — focus on facts that would be useful for a personal life log.`;

  return await modelRouter.generateText('telegramImageAnalysis', prompt, {
    files: [{ mimeType: 'image/jpeg', data: base64Image }],
  });
};

export const fetchYouTubeTranscript = async (videoId: string): Promise<string> => {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  return transcript
    .map((line) => line.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const processVideoUrl = async (url: string): Promise<string> => {
  try {
    const prompt = `Summarise this video for a personal life journal.\nExtract key facts, insights, and actionable takeaways.\nClassify likely life category (health, finance, spiritual, relationships, work, personal).\nVideo URL: ${url}`;

    return await modelRouter.generateText('telegramVideoAnalysis', prompt);
  } catch {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error('Cannot extract YouTube ID');
    const transcript = await fetchYouTubeTranscript(videoId);
    return `Video transcript: ${transcript.substring(0, 6000)}`;
  }
};
