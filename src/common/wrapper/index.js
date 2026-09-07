import React, { Fragment } from 'react';
import { View } from 'react-native';
import { getStyles } from './styles';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../header';

export const Wrapper = ({ noSafeArea, style, children, edges, showHeader = true, title = '' , showBack = false, onBellPress, onProfilePress }) => {
  const styles = getStyles({ style });
  return (
    <Fragment>
      {noSafeArea ? (
        <View style={styles.container}>
          {showHeader ? (
            <Header title={title} showBack={showBack} onBellPress={onBellPress} onProfilePress={onProfilePress} />
          ) : null}
          {children}
        </View>
      ) : (
        <SafeAreaProvider>
          <SafeAreaView
            edges={edges || ['top']}
            style={styles.safeAreaView}>
            <View style={styles.container}>
              {showHeader ? (
                <Header title={title} showBack={showBack} onBellPress={onBellPress} onProfilePress={onProfilePress} />
              ) : null}
              {children}
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      )}
    </Fragment>
  );
};
