import ImagePicker, { Options as CropPickerOptions } from 'react-native-image-crop-picker';

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

export interface PickerOptions {
  cropping?: boolean;
  freeStyleCropEnabled?: boolean;
  cropperCircleOverlay?: boolean;
  quality?: number;
  isEn?: boolean;
  toolbarTitle?: string;
  mediaTypes?: any;
  [key: string]: any;
}

export const requestMediaLibraryPermissionsAsync = async () => {
  return { status: 'granted', granted: true };
};

export const requestCameraPermissionsAsync = async () => {
  return { status: 'granted', granted: true };
};

export const launchImageLibraryAsync = async (
  options?: PickerOptions
): Promise<ImagePickerResult> => {
  try {
    const isEn = options?.isEn ?? false;
    const cropConfig: CropPickerOptions = {
      mediaType: 'photo',
      cropping: options?.cropping ?? false,
      freeStyleCropEnabled: options?.freeStyleCropEnabled ?? true,
      cropperCircleOverlay: options?.cropperCircleOverlay ?? false,
      showCropGuidelines: true,
      hideBottomControls: false,
      enableRotationGesture: true,
      cropperToolbarTitle:
        options?.toolbarTitle || (isEn ? 'Crop Photo' : 'फ़ोटो क्रॉप करें'),
      cropperToolbarColor: '#0A2540',
      cropperStatusBarLight: false,
      cropperToolbarWidgetColor: '#FFFFFF',
      cropperActiveWidgetColor: '#0066FF',
      compressImageQuality: options?.quality || 0.9,
    };

    const image = await ImagePicker.openPicker(cropConfig);

    if (!image || !image.path) {
      return { canceled: true, assets: [] };
    }

    return {
      canceled: false,
      assets: [
        {
          uri: image.path,
          width: image.width,
          height: image.height,
          fileName: image.filename || 'photo.jpg',
          type: image.mime || 'image/jpeg',
        },
      ],
    };
  } catch (err: any) {
    if (
      err?.code === 'E_PICKER_CANCELLED' ||
      err?.message?.includes('User cancelled') ||
      err?.message?.includes('cancelled')
    ) {
      return { canceled: true, assets: [] };
    }
    console.warn('Image picker error:', err);
    return { canceled: true, assets: [] };
  }
};

export const launchCameraAsync = async (
  options?: PickerOptions
): Promise<ImagePickerResult> => {
  try {
    const isEn = options?.isEn ?? false;
    const cropConfig: CropPickerOptions = {
      mediaType: 'photo',
      cropping: options?.cropping ?? false,
      freeStyleCropEnabled: options?.freeStyleCropEnabled ?? true,
      cropperCircleOverlay: options?.cropperCircleOverlay ?? false,
      showCropGuidelines: true,
      hideBottomControls: false,
      enableRotationGesture: true,
      cropperToolbarTitle:
        options?.toolbarTitle || (isEn ? 'Crop Photo' : 'फ़ोटो क्रॉप करें'),
      cropperToolbarColor: '#0A2540',
      cropperStatusBarLight: false,
      cropperToolbarWidgetColor: '#FFFFFF',
      cropperActiveWidgetColor: '#0066FF',
      compressImageQuality: options?.quality || 0.9,
    };

    const image = await ImagePicker.openCamera(cropConfig);

    if (!image || !image.path) {
      return { canceled: true, assets: [] };
    }

    return {
      canceled: false,
      assets: [
        {
          uri: image.path,
          width: image.width,
          height: image.height,
          fileName: image.filename || 'photo.jpg',
          type: image.mime || 'image/jpeg',
        },
      ],
    };
  } catch (err: any) {
    if (
      err?.code === 'E_PICKER_CANCELLED' ||
      err?.message?.includes('User cancelled') ||
      err?.message?.includes('cancelled')
    ) {
      return { canceled: true, assets: [] };
    }
    console.warn('Camera picker error:', err);
    return { canceled: true, assets: [] };
  }
};

export const cleanTmpImages = async () => {
  try {
    await ImagePicker.clean();
  } catch (e) {
    // Ignore cleanup error
  }
};

export default {
  launchImageLibraryAsync,
  launchCameraAsync,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  cleanTmpImages,
};
