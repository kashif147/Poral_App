import React from 'react';
import { View, Text } from 'react-native';
import { Wrapper } from '../../common/wrapper';
import { commonStyles } from '../../utils/Styles';


const Application = () => {

  return (
    <Wrapper style={commonStyles.screenContainer}>
      <Text>Application</Text>
    </Wrapper>
  );
};

export default Application;