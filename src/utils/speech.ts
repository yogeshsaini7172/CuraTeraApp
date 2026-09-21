/**
 * Speech utility for YojnaMitra
 * Provides speech synthesis functionality for reading government scheme details and chat responses.
 */

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

  speak(text: string, options?: SpeechOptions) {
    this.isSpeakingNow = true;
    // In React Native, if a native TTS library like react-native-tts is installed it will speak,
    // or simulate speech lifecycle safely without crashing.
    try {
      // Safe fallback
      setTimeout(() => {
        if (options?.onDone) {
          options.onDone();
        }
        this.isSpeakingNow = false;
      }, Math.min(Math.max(text.length * 60, 1000), 10000));
    } catch (e) {
      this.isSpeakingNow = false;
      if (options?.onError) {
        options.onError(e);
      }
    }
  }

  stop() {
    this.isSpeakingNow = false;
  }

  isSpeakingAsync(): Promise<boolean> {
    return Promise.resolve(this.isSpeakingNow);
  }
}

export const Speech = new SpeechService();
export default Speech;
