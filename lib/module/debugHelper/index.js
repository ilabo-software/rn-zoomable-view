import { View, StyleSheet } from 'react-native';
import React from 'react';
export const DebugTouchPoint = _ref => {
  let {
    diameter = 20,
    x = 0,
    y = 0,
    color = 'yellow'
  } = _ref;
  const radius = diameter / 2;
  return /*#__PURE__*/React.createElement(View, {
    style: [styles.debugPoint, {
      width: diameter,
      height: diameter,
      borderRadius: diameter,
      backgroundColor: color,
      left: x - radius,
      top: y - radius
    }],
    pointerEvents: "none"
  });
};
export const DebugRect = _ref2 => {
  let {
    height,
    x = 0,
    y = 0,
    color = 'yellow'
  } = _ref2;
  const width = 5;
  return /*#__PURE__*/React.createElement(View, {
    style: [styles.debugRect, {
      width,
      height,
      backgroundColor: color,
      left: x - width / 2,
      top: y
    }],
    pointerEvents: "none"
  });
};
const styles = StyleSheet.create({
  debugPoint: {
    position: 'absolute',
    opacity: 0.7
  },
  debugRect: {
    position: 'absolute',
    opacity: 0.5
  }
});
//# sourceMappingURL=index.js.map