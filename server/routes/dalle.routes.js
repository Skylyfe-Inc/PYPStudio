import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import { randomUUID } from 'crypto';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_IMAGES = 6;
const MAX_IMAGE_RETRIES = 2;
const sessions = new Map();

const clampCount = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  if (parsed > MAX_IMAGES) return MAX_IMAGES;
  return parsed;
};

const imageUrlToBase64 = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] || 'image/png';
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to convert image URL to base64', error);
    return null;
  }
};

const broadcastEvent = (session, event, payload) => {
  if (!session || session.clients.size === 0) return;
  const message = `event:${event}\ndata:${JSON.stringify(payload)}\n\n`;
  session.clients.forEach((client) => client.write(message));
};

const finalizeSession = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.done = true;
  if (session.clients.size === 0) {
    sessions.delete(sessionId);
  }
};

const generateImagePayload = async ({ prompt, size, index }) => {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size,
    quality: 'standard',
    n: 1,
    response_format: 'b64_json',
  });

  const imagePayload = response.data?.[0];
  if (!imagePayload) {
    throw new Error('OpenAI did not return image data');
  }

  const url = imagePayload.url || null;
  const base64 = imagePayload.b64_json
    ? `data:image/png;base64,${imagePayload.b64_json}`
    : url
      ? await imageUrlToBase64(url)
      : null;

  if (!base64) {
    throw new Error('Unable to derive base64 image data');
  }

  return {
    id: randomUUID(),
    index,
    url,
    base64,
    revisedPrompt: imagePayload.revised_prompt || null,
  };
};

const generateImageWithRetry = async (params, attempt = 0) => {
  try {
    return await generateImagePayload(params);
  } catch (error) {
    if (attempt >= MAX_IMAGE_RETRIES) {
      throw error;
    }
    return generateImageWithRetry(params, attempt + 1);
  }
};

const streamRemainingImages = async (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return;

  try {
    let index = session.images.length;

    while (index < session.total) {
      const current = sessions.get(sessionId);
      if (!current) break;

      const image = await generateImageWithRetry({
        prompt: current.prompt,
        size: current.size,
        index,
      });

      const nextSession = sessions.get(sessionId);
      if (!nextSession) break;

      nextSession.images.push(image);
      broadcastEvent(nextSession, 'image', { image, index });
      index += 1;
    }

    const finalSession = sessions.get(sessionId);
    if (!finalSession) return;

    finalizeSession(sessionId);
    broadcastEvent(finalSession, 'done', {
      sessionId,
      total: finalSession.images.length,
    });
  } catch (error) {
    console.error('Failed to generate remaining images', error);
    const erroredSession = sessions.get(sessionId);
    if (!erroredSession) return;

    finalizeSession(sessionId);
    broadcastEvent(erroredSession, 'error', {
      sessionId,
      message: 'Failed to generate remaining images',
    });
  }
};

router.get('/stream/:sessionId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (res.flushHeaders) {
    res.flushHeaders();
  }

  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.write(
      `event:error\ndata:${JSON.stringify({
        sessionId,
        message: 'Session not found',
      })}\n\n`,
    );
    return res.end();
  }

  session.images.forEach((image, index) => {
    res.write(
      `event:image\ndata:${JSON.stringify({
        image,
        index,
      })}\n\n`,
    );
  });

  if (session.done) {
    res.write(
      `event:done\ndata:${JSON.stringify({
        sessionId,
        total: session.images.length,
      })}\n\n`,
    );
    return res.end();
  }

  session.clients.add(res);

  req.on('close', () => {
    const currentSession = sessions.get(sessionId);
    if (!currentSession) return;
    currentSession.clients.delete(res);
    if (currentSession.done && currentSession.clients.size === 0) {
      sessions.delete(sessionId);
    }
  });
});

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL·E Routes' });
});

router.route('/').post(async (req, res) => {
  const { prompt, count = MAX_IMAGES, size = '1024x1024' } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  const total = clampCount(count);
  const sessionId = randomUUID();

  try {
    const firstImage = await generateImageWithRetry({
      prompt,
      size,
      index: 0,
    });

    const session = {
      id: sessionId,
      prompt,
      size,
      total,
      images: [firstImage],
      clients: new Set(),
      done: total === 1,
    };

    sessions.set(sessionId, session);

    if (total > 1) {
      setImmediate(() => streamRemainingImages(sessionId));
    } else {
      broadcastEvent(session, 'done', { sessionId, total: 1 });
      finalizeSession(sessionId);
    }

    return res.status(200).json({
      requestId: sessionId,
      total,
      image: firstImage,
    });
  } catch (error) {
    console.error('Failed to generate images', error);
    sessions.delete(sessionId);
    return res
      .status(500)
      .json({ message: 'Something went wrong while generating images' });
  }
});

export default router;
