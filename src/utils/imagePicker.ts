import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

export interface ImagePickerAsset {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string;
  type?: string;
}

export interface ImagePickerResult {
  canceled: boolean;
  assets?: ImagePickerAsset[];
}

export const requestMediaLibraryPermissionsAsync = async () => {
  return { status: 'granted', granted: true };
};

export const requestCameraPermissionsAsync = async () => {
  return { status: 'granted', granted: true };
};

export const launchImageLibraryAsync = async (
  options?: any
): Promise<ImagePickerResult> => {
  try {
    const config: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: options?.quality || 0.8,
      selectionLimit: 1,
    };
    const response: ImagePickerResponse = await launchImageLibrary(config);

    if (response.didCancel || !response.assets || response.assets.length === 0) {
      return { canceled: true, assets: [] };
    }

    const asset = response.assets[0];
    return {
      canceled: false,
      assets: [
        {
          uri: asset.uri || '',
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName,
          type: asset.type,
        },
      ],
    };
  } catch (err) {
    console.warn('Image picker error:', err);
    return { canceled: true, assets: [] };
  }
};

export const launchCameraAsync = async (
  options?: any
): Promise<ImagePickerResult> => {
  try {
    const config: CameraOptions = {
      mediaType: 'photo',
      quality: options?.quality || 0.8,
      saveToPhotos: true,
    };
    const response: ImagePickerResponse = await launchCamera(config);

    if (response.didCancel || !response.assets || response.assets.length === 0) {
      return { canceled: true, assets: [] };
    }

    const asset = response.assets[0];
    return {
      canceled: false,
      assets: [
        {
          uri: asset.uri || '',
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName,
          type: asset.type,
        },
      ],
    };
  } catch (err) {
    console.warn('Camera picker error:', err);
    return { canceled: true, assets: [] };
  }
};

export default {
  launchImageLibraryAsync,
  launchCameraAsync,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
};
