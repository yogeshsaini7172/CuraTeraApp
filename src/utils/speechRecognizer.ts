import { NativeModules, Platform } from 'react-native';

const { NativeSpeechRecognizer } = NativeModules;

export async function recognizeSpeech(language: 'hi' | 'en' = 'hi'): Promise<string> {
  if (NativeSpeechRecognizer && typeof NativeSpeechRecognizer.startSpeech === 'function') {
    return await NativeSpeechRecognizer.startSpeech(language);
  }

  // Graceful fallback simulation if native APK is not re-built yet:
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        language === 'en'
          ? 'Tell me about PM Kisan Yojana'
          : 'पीएम किसान योजना के बारे में बताइए'
      );
    }, 1500);
  });
}
