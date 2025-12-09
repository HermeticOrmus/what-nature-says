#!/usr/bin/env python3
"""
Simple server for What Nature Says app
Serves static files and proxies ElevenLabs TTS requests
"""

import os
import json
import http.server
import socketserver
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import ssl

PORT = 3333
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY', '')

# ElevenLabs voice IDs - these are good for children's content
VOICES = {
    'rachel': '21m00Tcm4TlvDq8ikWAM',      # Warm, clear female
    'charlotte': 'XB0fDUnXU5powFXDhCwa',   # British, warm
    'alice': 'Xb7hH8MSUJpSbSDYk0k2',       # British, gentle
    'matilda': 'XrExE9yKIg1WjnnlVkGX',     # American, warm
}

# Default voice for narration
DEFAULT_VOICE = 'rachel'


class TTSHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/tts':
            self.handle_tts()
        else:
            self.send_error(404)

    def handle_tts(self):
        if not ELEVENLABS_API_KEY:
            self.send_error(500, 'ElevenLabs API key not configured')
            return

        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body)
            text = data.get('text', '')
            voice = data.get('voice', DEFAULT_VOICE)

            if not text:
                self.send_error(400, 'Missing text parameter')
                return

            voice_id = VOICES.get(voice, VOICES[DEFAULT_VOICE])

            # Call ElevenLabs API
            url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}'

            payload = json.dumps({
                'text': text,
                'model_id': 'eleven_monolingual_v1',
                'voice_settings': {
                    'stability': 0.75,
                    'similarity_boost': 0.75,
                    'style': 0.5,
                    'use_speaker_boost': True
                }
            }).encode('utf-8')

            req = Request(url, data=payload, method='POST')
            req.add_header('Accept', 'audio/mpeg')
            req.add_header('Content-Type', 'application/json')
            req.add_header('xi-api-key', ELEVENLABS_API_KEY)

            # Make request to ElevenLabs
            context = ssl.create_default_context()
            response = urlopen(req, context=context)
            audio_data = response.read()

            # Send audio back to client
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', len(audio_data))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(audio_data)

        except HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f'ElevenLabs API error: {e.code} - {error_body}')
            self.send_error(e.code, f'ElevenLabs API error: {error_body}')
        except Exception as e:
            print(f'TTS error: {e}')
            self.send_error(500, str(e))

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        # Add CORS headers to all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


if __name__ == '__main__':
    if not ELEVENLABS_API_KEY:
        print('\n' + '='*60)
        print('WARNING: ELEVENLABS_API_KEY not set!')
        print('TTS will not work. Set it with:')
        print('  export ELEVENLABS_API_KEY="your-api-key"')
        print('='*60 + '\n')
    else:
        print(f'ElevenLabs API key configured (ends with ...{ELEVENLABS_API_KEY[-4:]})')

    with socketserver.TCPServer(('', PORT), TTSHandler) as httpd:
        print(f'Server running at http://localhost:{PORT}/')
        print('Press Ctrl+C to stop')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nShutting down...')
