import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const DEFAULT_ASPECT = 16 / 9;

/**
 * Full-width promotional image that keeps its natural aspect ratio
 * so the entire asset is visible.
 */
const FullWidthContainImage = ({ uri, style }) => {
  const imageUri = typeof uri === 'string' ? uri.trim() : '';
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUri) return undefined;

    let cancelled = false;
    setAspectRatio(DEFAULT_ASPECT);
    setHasError(false);

    Image.getSize(
      imageUri,
      (width, height) => {
        if (!cancelled && width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      },
      () => {},
    );

    return () => {
      cancelled = true;
    };
  }, [imageUri]);

  if (!imageUri || hasError) return null;

  return (
    <View style={[styles.wrap, style]}>
      <Image
        key={imageUri}
        source={{ uri: imageUri }}
        style={[styles.image, { aspectRatio }]}
        resizeMode="contain"
        onError={() => setHasError(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
});

export default FullWidthContainImage;
