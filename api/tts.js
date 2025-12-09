// Vercel Serverless Function for ElevenLabs TTS
// POST /api/tts

const VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM',      // Warm, clear female
  charlotte: 'XB0fDUnXU5powFXDhCwa',   // British, warm
  alice: 'Xb7hH8MSUJpSbSDYk0k2',       // British, gentle
  matilda: 'XrExE9yKIg1WjnnlVkGX',     // American, warm
};

const DEFAULT_VOICE = 'rachel';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    const { text, voice = DEFAULT_VOICE } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const voiceId = VOICES[voice] || VOICES[DEFAULT_VOICE];

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({ error: `ElevenLabs API error: ${errorText}` });
    }

    const audioBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    return res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: error.message });
  }
}
