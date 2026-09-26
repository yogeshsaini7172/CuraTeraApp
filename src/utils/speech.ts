import { NativeModules } from 'react-native';
import { BASE_URL } from '../api/client';

const { NativeTts } = NativeModules;

type SpeechOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
};

class SpeechService {
  private isSpeakingNow: boolean = false;

  async speak(text: string, options?: SpeechOptions) {
    this.isSpeakingNow = true;
    try {
      const nativeTts = NativeModules.NativeTts;
      const lang = options?.language || 'auto';
      
      try {
        const url = `${BASE_URL}/api/chat/tts?text=${encodeURIComponent(text)}&lang=${lang}`;
        await nativeTts.playAudioUrl(url);
        
        // Exact completion from Promise!
        if (this.isSpeakingNow) {
          this.isSpeakingNow = false;
          options?.onDone?.();
        }
      } catch (_e) {
        // Fallback to local device TTS if playAudioUrl fails
        const rate = options?.rate || 0.95;
        const pitch = options?.pitch || 1.0;
        nativeTts.speak(text, lang === 'auto' ? 'hi' : lang, rate, pitch);
        
        const estimatedDuration = Math.min(Math.max(text.length * 60, 1000), 12000);
        setTimeout(() => {
          if (this.isSpeakingNow) {
            this.isSpeakingNow = false;
            options?.onDone?.();
          }
        }, estimatedDuration);
      }
    } catch (e) {
      this.isSpeakingNow = false;
      options?.onError?.(e);
    }
  }

  stop() {
    this.isSpeakingNow = false;
    try {
      if (NativeTts && typeof NativeTts.stop === 'function') {
        NativeTts.stop();
      }
    } catch (e) {
      console.warn('TTS stop error:', e);
    }
  }

  isSpeakingAsync(): Promise<boolean> {
    return Promise.resolve(this.isSpeakingNow);
  }
}

export const Speech = new SpeechService();
export default Speech;
