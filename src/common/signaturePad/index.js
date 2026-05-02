import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { Colors, hp, wp } from '../../utils/Styles';

const SignaturePad = ({
  label,
  onSignatureChange,
  value = null,
  required = false,
  showValidation = false,
  disabled = false,
  /** When the user starts/ends a stroke; use to set ScrollView scrollEnabled={false} while true. */
  onDrawingActiveChange,
}) => {
  const signatureRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(!!value);

  useEffect(() => {
    if (value && signatureRef.current) {
      setHasSignature(true);
    }
  }, [value]);

  const handleOK = (signature) => {
    if (signature) {
      setHasSignature(true);
      if (onSignatureChange) {
        onSignatureChange(signature);
      }
    }
  };

  const handleClear = () => {
    if (disabled) return;
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
      setHasSignature(false);
      if (onSignatureChange) {
        onSignatureChange(null);
      }
    }
  };

  const handleEnd = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const handleBegin = () => {
    if (!disabled) {
      onDrawingActiveChange?.(true);
    }
  };

  const handleEndStroke = () => {
    if (!disabled) {
      onDrawingActiveChange?.(false);
    }
    handleEnd();
  };

  const isEmpty = required && !hasSignature && showValidation;

  const style = `
    body,html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
    .m-signature-pad {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: #ffffff;
    }
    .m-signature-pad--body {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      border: none;
    }
    .m-signature-pad--body canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: 0;
    }
  `;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, isEmpty && styles.labelError]}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
          {isEmpty && <Text style={styles.requiredText}> (Required)</Text>}
        </Text>
      )}
      <View
        style={[
          styles.signatureContainer,
          isEmpty && styles.signatureContainerError,
          disabled && styles.signatureContainerDisabled,
        ]}
        collapsable={false}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleOK}
          onBegin={handleBegin}
          onEnd={handleEndStroke}
          descriptionText=""
          clearText="Clear"
          confirmText="Save"
          webStyle={style}
          imageDataURL={value}
          autoClear={false}
          backgroundColor="#ffffff"
          penColor="#000000"
        />
        {!hasSignature && (
          <View style={styles.placeholderContainer} pointerEvents="none">
            <Text style={styles.placeholderText}>Tap to sign</Text>
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleClear}
          disabled={disabled || !hasSignature}
          style={[
            styles.clearButton,
            (disabled || !hasSignature) && styles.clearButtonDisabled,
          ]}>
          <Text
            style={[
              styles.clearButtonText,
              (disabled || !hasSignature) && styles.clearButtonTextDisabled,
            ]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  labelError: {
    color: Colors.red,
  },
  requiredStar: {
    color: Colors.red,
  },
  requiredText: {
    color: Colors.red,
    fontSize: hp(1.4),
    fontWeight: '400',
  },
  signatureContainer: {
    width: '100%',
    height: 150,
    borderWidth: 2,
    borderColor: Colors.divider,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    position: 'relative',
  },
  signatureContainerError: {
    borderColor: Colors.red,
    borderWidth: 2,
  },
  signatureContainerDisabled: {
    opacity: 0.5,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  placeholderText: {
    fontSize: hp(1.6),
    color: Colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    fontSize: hp(1.6),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  clearButtonTextDisabled: {
    color: Colors.grey500,
  },
});

export default SignaturePad;
