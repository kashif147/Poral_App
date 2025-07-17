import React, { Fragment, useContext } from 'react';
import { StatusBar, View } from 'react-native';
import { getStyles } from './styles';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export const Wrapper = ({ noSafeArea, style, children, edges }) => {
  const styles = getStyles({ style });
  return (
    <Fragment>
      {noSafeArea ? (
        <View style={styles.container}>
          <StatusBar backgroundColor={'transparent'} translucent={true} />
          {children}
        </View>
      ) : (
        <SafeAreaProvider>
          <SafeAreaView
            edges={edges || ['right', 'left', 'top']}
            style={styles.safeAreaView}>
            <StatusBar backgroundColor={'transparent'} translucent={true} />
            <View style={styles.container}>{children}</View>
          </SafeAreaView>
        </SafeAreaProvider>
      )}
    </Fragment>
  );
};
