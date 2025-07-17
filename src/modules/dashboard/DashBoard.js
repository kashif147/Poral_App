import React from 'react';
import { Label } from '../../common/text/label';
import { Wrapper } from '../../common/wrapper';
import { commonStyles } from '../../utils/Styles';

const DashBoard = () => {
  return (
    <Wrapper style={commonStyles.screenContainer}>
      <Label>DashBoard</Label>
    </Wrapper>
  );
};

export default DashBoard;