import { pick } from 'lodash';
import { Dimensions } from 'react-native';

const { height, width } = pick(Dimensions.get('window'), ['height', 'width']);

const deviceUtils = {};

deviceUtils.iPhoneXHeight = 812;
deviceUtils.iPhoneXWidth = 375;
deviceUtils.iPhone6Height = 667;


deviceUtils.isNarrowPhone = width < deviceUtils.iPhoneXWidth;
deviceUtils.isSmallPhone = height <= deviceUtils.iPhone6Height;
deviceUtils.isLargePhone = width >= deviceUtils.iPhoneXWidth;

deviceUtils.isTallPhone = height >= deviceUtils.iPhoneXHeight;

deviceUtils.dimensions = {
  height,
  width,
};

export default deviceUtils;
