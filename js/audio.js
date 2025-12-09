/**
 * What Nature Says - Audio Module
 * Handles narration with ElevenLabs TTS, word highlighting, and tap-to-pronounce
 */

class AudioManager {
  constructor() {
    // ElevenLabs TTS
    this.ttsEndpoint = '/api/tts';
    this.ttsVoice = 'rachel';  // Warm, clear female voice
    this.audioElement = null;
    this.audioCache = new Map();  // Cache generated audio

    // Fallback: Web Speech API
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.preferredVoice = null;

    // State
    this.isNarrating = false;
    this.isPaused = false;
    this.useElevenLabs = true;  // Try ElevenLabs first

    // Voice settings for Web Speech fallback
    this.voiceSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0
    };

    // Word highlighting
    this.onWordHighlight = null;
    this.onNarrationEnd = null;
    this.highlightInterval = null;

    // Initialize
    this.init();
  }

  init() {
    // Create audio element for ElevenLabs playback
    this.audioElement = new Audio();
    this.audioElement.addEventListener('ended', () => {
      this.isNarrating = false;
      if (this.onNarrationEnd) this.onNarrationEnd();
    });

    // Load Web Speech voices as fallback
    if (this.synth) {
      this.loadVoices();
      this.synth.onvoiceschanged = () => this.loadVoices();
    }

    // Test ElevenLabs availability
    this.testElevenLabs();
  }

  async testElevenLabs() {
    try {
      // Quick test with minimal text
      const response = await fetch(this.ttsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test', voice: this.ttsVoice })
      });

      if (response.ok) {
        console.log('ElevenLabs TTS available');
        this.useElevenLabs = true;
      } else {
        console.warn('ElevenLabs not available, using Web Speech fallback');
        this.useElevenLabs = false;
      }
    } catch (e) {
      console.warn('ElevenLabs not available:', e.message);
      this.useElevenLabs = false;
    }
  }

  loadVoices() {
    const voices = this.synth.getVoices();

    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));

    // Prefer these voices - prioritize natural-sounding ones
    // Google voices tend to be the most natural on Chrome
    const preferredVoices = [
      'Google US English',      // Chrome - most natural
      'Google UK English Female', // Chrome alternative
      'Microsoft Aria',         // Windows 11 - very natural
      'Microsoft Jenny',        // Windows 11 - natural
      'Samantha',               // macOS/iOS - clear, friendly
      'Microsoft Zira',         // Windows - clear
      'Karen',                  // Australian - clear
      'Moira',                  // Irish - warm
      'English United States',  // Generic fallback
    ];

    // Find best available voice
    for (const name of preferredVoices) {
      const voice = voices.find(v => v.name.includes(name));
      if (voice) {
        this.preferredVoice = voice;
        console.log('Selected voice:', voice.name);
        break;
      }
    }

    // Fallback: prefer female English voices (usually warmer for children's content)
    if (!this.preferredVoice) {
      // Try to find any Google voice first (they're more natural)
      const googleVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
      if (googleVoice) {
        this.preferredVoice = googleVoice;
      } else {
        // Fall back to any English voice
        this.preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
      if (this.preferredVoice) {
        console.log('Fallback voice:', this.preferredVoice.name);
      }
    }
  }

  // ==================== NATURE SOUNDS ====================

  preloadNatureSounds() {
    // Define ambient sounds for each element
    const soundMap = {
      dragonfly: 'meadow',
      river: 'river',
      mushroom: 'forest',
      frog: 'pond',
      ocean: 'ocean',
      hummingbird: 'garden',
      sun: 'morning',
      waterfall: 'waterfall',
      dolphin: 'underwater',
      star: 'night',
      tree: 'forest',
      you: 'nature'
    };

    // Create Audio elements (we'll use Web Audio API for better control)
    this.soundMap = soundMap;

    // We'll generate sounds using Web Audio API oscillators for a lightweight solution
    // In production, you'd load actual sound files
    this.audioContext = null;
  }

  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play ambient nature sound for an element
  // DISABLED: Synthetic noise doesn't sound good enough
  // TODO: Replace with real nature sound files or remove entirely
  playAmbientSound(elementId) {
    // Disabled - synthetic noise is distracting, not immersive
    // Will need actual audio files for proper nature sounds
    return;

    /*
    this.stopAmbientSound();

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create ambient sound based on element
    const soundType = this.soundMap[elementId] || 'nature';
    this.currentAmbientSound = this.createAmbientSound(ctx, soundType);
    */
  }

  createAmbientSound(ctx, type) {
    const gainNode = ctx.createGain();
    gainNode.gain.value = this.ambientVolume;
    gainNode.connect(ctx.destination);

    const nodes = [];

    // Create different ambient textures based on type
    switch (type) {
      case 'river':
      case 'waterfall':
        // Water sound - filtered noise
        nodes.push(this.createNoiseSource(ctx, gainNode, 'water'));
        break;

      case 'ocean':
      case 'underwater':
        // Ocean waves - low frequency modulated noise
        nodes.push(this.createNoiseSource(ctx, gainNode, 'ocean'));
        break;

      case 'forest':
      case 'meadow':
      case 'garden':
        // Birds/nature - gentle high frequencies
        nodes.push(this.createNoiseSource(ctx, gainNode, 'forest'));
        break;

      case 'pond':
        // Pond ambience
        nodes.push(this.createNoiseSource(ctx, gainNode, 'pond'));
        break;

      case 'night':
        // Night crickets
        nodes.push(this.createNoiseSource(ctx, gainNode, 'night'));
        break;

      case 'morning':
        // Morning birds
        nodes.push(this.createNoiseSource(ctx, gainNode, 'morning'));
        break;

      default:
        // Generic nature
        nodes.push(this.createNoiseSource(ctx, gainNode, 'nature'));
    }

    return { nodes, gainNode };
  }

  createNoiseSource(ctx, gainNode, type) {
    // Create noise buffer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill with noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Create source
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Create filter for different textures
    const filter = ctx.createBiquadFilter();

    switch (type) {
      case 'water':
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        break;

      case 'ocean':
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;
        break;

      case 'forest':
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.3;
        break;

      case 'pond':
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 0.8;
        break;

      case 'night':
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        filter.Q.value = 0.5;
        break;

      case 'morning':
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        filter.Q.value = 0.4;
        break;

      default:
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;
    }

    // Connect: source -> filter -> gain -> destination
    source.connect(filter);
    filter.connect(gainNode);

    source.start();

    return source;
  }

  stopAmbientSound() {
    if (this.currentAmbientSound) {
      try {
        this.currentAmbientSound.nodes.forEach(node => {
          try { node.stop(); } catch (e) {}
        });
        this.currentAmbientSound.gainNode.disconnect();
      } catch (e) {}
      this.currentAmbientSound = null;
    }
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.currentAmbientSound) {
      this.currentAmbientSound.gainNode.gain.value = this.ambientVolume;
    }
  }

  // ==================== TEXT-TO-SPEECH NARRATION ====================

  // Narrate text with word-by-word highlighting
  async narrateWithHighlight(text, wordElements, onComplete) {
    // Stop any current narration
    this.stopNarration();

    // Clean text for speech
    const cleanText = text.replace(/<[^>]*>/g, '').trim();

    if (this.useElevenLabs) {
      await this.narrateWithElevenLabs(cleanText, wordElements, onComplete);
    } else {
      this.narrateWithWebSpeech(cleanText, wordElements, onComplete);
    }
  }

  // ElevenLabs narration with simulated word highlighting
  async narrateWithElevenLabs(text, wordElements, onComplete) {
    try {
      // Check cache first
      let audioUrl = this.audioCache.get(text);

      if (!audioUrl) {
        // Fetch from ElevenLabs
        const response = await fetch(this.ttsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: this.ttsVoice })
        });

        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`);
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        this.audioCache.set(text, audioUrl);
      }

      // Play audio
      this.audioElement.src = audioUrl;
      this.isNarrating = true;
      this.isPaused = false;

      // Estimate word timing for highlighting
      if (wordElements && wordElements.length > 0) {
        this.startWordHighlighting(text, wordElements);
      }

      // Set up completion handler
      this.audioElement.onended = () => {
        this.stopWordHighlighting();
        this.isNarrating = false;
        if (wordElements) {
          wordElements.forEach(el => el.classList.remove('word-highlight'));
        }
        if (onComplete) onComplete();
      };

      await this.audioElement.play();

    } catch (e) {
      console.error('ElevenLabs narration failed:', e);
      // Fall back to Web Speech
      this.narrateWithWebSpeech(text, wordElements, onComplete);
    }
  }

  // Estimate word timing and highlight words during playback
  startWordHighlighting(text, wordElements) {
    const words = text.split(/\s+/);
    const totalDuration = this.estimateDuration(text);
    const avgWordDuration = totalDuration / words.length;

    let wordIndex = 0;

    this.highlightInterval = setInterval(() => {
      if (wordIndex < wordElements.length) {
        // Remove previous highlights
        wordElements.forEach(el => el.classList.remove('word-highlight'));

        // Highlight current word
        if (wordElements[wordIndex]) {
          wordElements[wordIndex].classList.add('word-highlight');
        }

        wordIndex++;
      } else {
        this.stopWordHighlighting();
      }
    }, avgWordDuration * 1000);
  }

  stopWordHighlighting() {
    if (this.highlightInterval) {
      clearInterval(this.highlightInterval);
      this.highlightInterval = null;
    }
  }

  // Estimate speech duration (rough approximation)
  estimateDuration(text) {
    // Average speaking rate: ~150 words per minute for natural reading
    // ElevenLabs tends to be around 140-160 wpm
    const words = text.split(/\s+/).length;
    return (words / 150) * 60; // Duration in seconds
  }

  // Web Speech API fallback
  narrateWithWebSpeech(text, wordElements, onComplete) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported');
      if (onComplete) onComplete();
      return;
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);

    if (this.preferredVoice) {
      this.currentUtterance.voice = this.preferredVoice;
    }
    this.currentUtterance.rate = this.voiceSettings.rate;
    this.currentUtterance.pitch = this.voiceSettings.pitch;
    this.currentUtterance.volume = this.voiceSettings.volume;

    let wordIndex = 0;

    this.currentUtterance.onboundary = (event) => {
      if (event.name === 'word' && wordElements && wordIndex < wordElements.length) {
        wordElements.forEach(el => el.classList.remove('word-highlight'));
        if (wordElements[wordIndex]) {
          wordElements[wordIndex].classList.add('word-highlight');
        }
        wordIndex++;
      }
    };

    this.currentUtterance.onend = () => {
      this.isNarrating = false;
      if (wordElements) {
        wordElements.forEach(el => el.classList.remove('word-highlight'));
      }
      if (onComplete) onComplete();
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      this.isNarrating = false;
    };

    this.isNarrating = true;
    this.isPaused = false;
    this.synth.speak(this.currentUtterance);
  }

  // Simple narration without highlighting
  async narrate(text, onComplete) {
    await this.narrateWithHighlight(text, null, onComplete);
  }

  // Speak a single word (for tap-to-pronounce)
  async speakWord(word, onComplete) {
    // Don't interrupt full narration for single words
    if (this.isNarrating && !this.isPaused) {
      return;
    }

    if (this.useElevenLabs) {
      try {
        let audioUrl = this.audioCache.get(`word:${word}`);

        if (!audioUrl) {
          const response = await fetch(this.ttsEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: word, voice: this.ttsVoice })
          });

          if (response.ok) {
            const audioBlob = await response.blob();
            audioUrl = URL.createObjectURL(audioBlob);
            this.audioCache.set(`word:${word}`, audioUrl);
          }
        }

        if (audioUrl) {
          const wordAudio = new Audio(audioUrl);
          wordAudio.onended = () => {
            if (onComplete) onComplete();
          };
          await wordAudio.play();
          return;
        }
      } catch (e) {
        console.warn('ElevenLabs word speech failed:', e);
      }
    }

    // Fallback to Web Speech
    if (this.synth) {
      const utterance = new SpeechSynthesisUtterance(word);
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      utterance.rate = 0.8;
      utterance.pitch = this.voiceSettings.pitch;
      utterance.volume = this.voiceSettings.volume;
      utterance.onend = () => {
        if (onComplete) onComplete();
      };
      this.synth.speak(utterance);
    }
  }

  pauseNarration() {
    if (this.useElevenLabs && this.audioElement) {
      this.audioElement.pause();
      this.isPaused = true;
      this.stopWordHighlighting();
    } else if (this.synth && this.isNarrating) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  resumeNarration() {
    if (this.useElevenLabs && this.audioElement && this.isPaused) {
      this.audioElement.play();
      this.isPaused = false;
    } else if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  stopNarration() {
    this.stopWordHighlighting();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    if (this.synth) {
      this.synth.cancel();
    }

    this.isNarrating = false;
    this.isPaused = false;
  }

  // ==================== CLEANUP ====================

  destroy() {
    this.stopNarration();
    this.stopAmbientSound();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Export for use in main app
window.AudioManager = AudioManager;
