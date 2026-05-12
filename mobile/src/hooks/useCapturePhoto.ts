// Wraps expo-image-picker for camera capture + library pick, with permission gates.
import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

export function useCapturePhoto() {
  const captureFromCamera = useCallback(async (): Promise<string | null> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      exif: true,
    });
    if (res.canceled) return null;
    return res.assets[0]?.uri ?? null;
  }, []);

  const pickFromLibrary = useCallback(async (): Promise<string | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (res.canceled) return null;
    return res.assets[0]?.uri ?? null;
  }, []);

  return { captureFromCamera, pickFromLibrary };
}
