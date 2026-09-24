import { NativeModules } from 'react-native';

export interface DocumentPickerResult {
  cancelled: boolean;
  uri?: string;
  name?: string;
  size?: number;
}

export const pickDocumentAsync = async (): Promise<DocumentPickerResult> => {
  try {
    const { NativeDocumentPicker } = NativeModules;
    if (NativeDocumentPicker && typeof NativeDocumentPicker.pickDocument === 'function') {
      const res = await NativeDocumentPicker.pickDocument();
      if (res && !res.cancelled && res.name) {
        return {
          cancelled: false,
          uri: res.uri,
          name: res.name,
          size: res.size,
        };
      }
      return { cancelled: true };
    }
  } catch (e: any) {
    if (e?.code === 'CANCELLED') {
      return { cancelled: true };
    }
    console.warn('NativeDocumentPicker error:', e);
  }

  return {
    cancelled: true,
  };
};

export default pickDocumentAsync;
