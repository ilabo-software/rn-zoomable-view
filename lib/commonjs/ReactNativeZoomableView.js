"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _components = require("./components");
var _debugHelper = require("./debugHelper");
var _helper = require("./helper");
var _applyPanBoundariesToOffset = require("./helper/applyPanBoundariesToOffset");
var _animations = require("./animations");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const initialState = {
  originalWidth: null,
  originalHeight: null,
  originalPageX: null,
  originalPageY: null
};
class ReactNativeZoomableView extends _react.Component {
  /**
   * Last press time (used to evaluate whether user double tapped)
   * @type {number}
   */

  constructor(props) {
    super(props);
    _defineProperty(this, "zoomSubjectWrapperRef", void 0);
    _defineProperty(this, "gestureHandlers", void 0);
    _defineProperty(this, "doubleTapFirstTapReleaseTimestamp", void 0);
    _defineProperty(this, "panAnim", new _reactNative.Animated.ValueXY({
      x: 0,
      y: 0
    }));
    _defineProperty(this, "zoomAnim", new _reactNative.Animated.Value(1));
    _defineProperty(this, "__offsets", {
      x: {
        value: 0,
        boundaryCrossedAnimInEffect: false
      },
      y: {
        value: 0,
        boundaryCrossedAnimInEffect: false
      }
    });
    _defineProperty(this, "zoomLevel", 1);
    _defineProperty(this, "lastGestureCenterPosition", null);
    _defineProperty(this, "lastGestureTouchDistance", void 0);
    _defineProperty(this, "gestureType", void 0);
    _defineProperty(this, "gestureStarted", false);
    _defineProperty(this, "longPressTimeout", null);
    _defineProperty(this, "onTransformInvocationInitialized", void 0);
    _defineProperty(this, "singleTapTimeoutId", void 0);
    _defineProperty(this, "touches", []);
    _defineProperty(this, "doubleTapFirstTap", void 0);
    _defineProperty(this, "measureZoomSubjectInterval", void 0);
    _defineProperty(this, "grabZoomSubjectOriginalMeasurements", () => {
      // make sure we measure after animations are complete
      _reactNative.InteractionManager.runAfterInteractions(() => {
        // this setTimeout is here to fix a weird issue on iOS where the measurements are all `0`
        // when navigating back (react-navigation stack) from another view
        // while closing the keyboard at the same time
        setTimeout(() => {
          var _zoomSubjectWrapperRe;
          // In normal conditions, we're supposed to measure zoomSubject instead of its wrapper.
          // However, our zoomSubject may have been transformed by an initial zoomLevel or offset,
          // in which case these measurements will not represent the true "original" measurements.
          // We just need to make sure the zoomSubjectWrapper perfectly aligns with the zoomSubject
          // (no border, space, or anything between them)
          const zoomSubjectWrapperRef = this.zoomSubjectWrapperRef;
          // we don't wanna measure when zoomSubjectWrapperRef is not yet available or has been unmounted
          (_zoomSubjectWrapperRe = zoomSubjectWrapperRef.current) === null || _zoomSubjectWrapperRe === void 0 ? void 0 : _zoomSubjectWrapperRe.measureInWindow((x, y, width, height) => {
            this.setState({
              originalWidth: width,
              originalHeight: height,
              originalPageX: x,
              originalPageY: y
            });
          });
        });
      });
    });
    _defineProperty(this, "_handleStartShouldSetPanResponder", (e, gestureState) => {
      if (this.props.onStartShouldSetPanResponder) {
        this.props.onStartShouldSetPanResponder(e, gestureState, this._getZoomableViewEventObject(), false);
      }
      if (gestureState.numberActiveTouches == 2) {
        return true;
      }

      // Always set pan responder on start
      // of gesture so we can handle tap.
      // "Pan threshold validation" will be handled
      // in `onPanResponderMove` instead of in `onMoveShouldSetPanResponder`
      return false;
    });
    _defineProperty(this, "_handlePanResponderGrant", (e, gestureState) => {
      var _this$props$onPanResp, _this$props2;
      if (this.props.onLongPress) {
        this.longPressTimeout = setTimeout(() => {
          var _this$props$onLongPre, _this$props;
          (_this$props$onLongPre = (_this$props = this.props).onLongPress) === null || _this$props$onLongPre === void 0 ? void 0 : _this$props$onLongPre.call(_this$props, e, gestureState, this._getZoomableViewEventObject());
          this.longPressTimeout = null;
        }, this.props.longPressDuration);
      }
      (_this$props$onPanResp = (_this$props2 = this.props).onPanResponderGrant) === null || _this$props$onPanResp === void 0 ? void 0 : _this$props$onPanResp.call(_this$props2, e, gestureState, this._getZoomableViewEventObject());
      this.panAnim.stopAnimation();
      this.zoomAnim.stopAnimation();
      this.gestureStarted = true;
    });
    _defineProperty(this, "_handlePanResponderEnd", (e, gestureState) => {
      var _this$props$onPanResp2, _this$props3;
      if (!this.gestureType && gestureState.numberActiveTouches != 1) {
        console.log('_resolveAndHandleTap-----');
        this._resolveAndHandleTap(e);
      }
      this.setState({
        debugPoints: []
      });
      this.lastGestureCenterPosition = null;

      // Trigger final shift animation unless disablePanOnInitialZoom is set and we're on the initial zoom level
      if (gestureState.numberActiveTouches == 1 || !(this.gestureType === 'shift' && this.props.disablePanOnInitialZoom && this.zoomLevel === this.props.initialZoom)) {
        (0, _animations.getPanMomentumDecayAnim)(this.panAnim, {
          x: gestureState.vx / this.zoomLevel,
          y: gestureState.vy / this.zoomLevel
        }).start();
      }
      if (this.longPressTimeout) {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;
      }
      (_this$props$onPanResp2 = (_this$props3 = this.props).onPanResponderEnd) === null || _this$props$onPanResp2 === void 0 ? void 0 : _this$props$onPanResp2.call(_this$props3, e, gestureState, this._getZoomableViewEventObject());
      if (this.gestureType === 'pinch') {
        var _this$props$onZoomEnd, _this$props4;
        (_this$props$onZoomEnd = (_this$props4 = this.props).onZoomEnd) === null || _this$props$onZoomEnd === void 0 ? void 0 : _this$props$onZoomEnd.call(_this$props4, e, gestureState, this._getZoomableViewEventObject());
      } else if (this.gestureType === 'shift') {
        var _this$props$onShiftin, _this$props5;
        (_this$props$onShiftin = (_this$props5 = this.props).onShiftingEnd) === null || _this$props$onShiftin === void 0 ? void 0 : _this$props$onShiftin.call(_this$props5, e, gestureState, this._getZoomableViewEventObject());
      }
      this.gestureType = null;
      this.gestureStarted = false;
    });
    _defineProperty(this, "_handlePanResponderMove", (e, gestureState) => {
      if (this.props.onPanResponderMove) {
        if (this.props.onPanResponderMove(e, gestureState, this._getZoomableViewEventObject())) {
          return false;
        }
      }

      // Only supports 2 touches and below,
      // any invalid number will cause the gesture to end.
      if (gestureState.numberActiveTouches <= 2) {
        if (!this.gestureStarted) {
          this._handlePanResponderGrant(e, gestureState);
        }
      } else {
        if (this.gestureStarted) {
          this._handlePanResponderEnd(e, gestureState);
        }
        return true;
      }
      if (gestureState.numberActiveTouches === 2) {
        if (this.longPressTimeout) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
        }

        // change some measurement states when switching gesture to ensure a smooth transition
        if (this.gestureType !== 'pinch') {
          this.lastGestureCenterPosition = (0, _helper.calcGestureCenterPoint)(e, gestureState);
          this.lastGestureTouchDistance = (0, _helper.calcGestureTouchDistance)(e, gestureState);
        }
        this.gestureType = 'pinch';
        this._handlePinching(e, gestureState);
      } else if (gestureState.numberActiveTouches === 1) {
        if (this.longPressTimeout && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5)) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
        }
        // change some measurement states when switching gesture to ensure a smooth transition
        if (this.gestureType !== 'shift') {
          this.lastGestureCenterPosition = (0, _helper.calcGestureCenterPoint)(e, gestureState);
        }
        const {
          dx,
          dy
        } = gestureState;
        const isShiftGesture = Math.abs(dx) > 2 || Math.abs(dy) > 2;
        if (isShiftGesture) {
          this.gestureType = 'shift';
          this._handleShifting(gestureState);
        }
      }
    });
    _defineProperty(this, "_resolveAndHandleTap", e => {
      const now = Date.now();
      if (this.doubleTapFirstTapReleaseTimestamp && now - this.doubleTapFirstTapReleaseTimestamp < this.props.doubleTapDelay) {
        this._addTouch({
          ...this.doubleTapFirstTap,
          id: now.toString(),
          isSecondTap: true
        });
        clearTimeout(this.singleTapTimeoutId);
        delete this.doubleTapFirstTapReleaseTimestamp;
        delete this.singleTapTimeoutId;
        delete this.doubleTapFirstTap;
        this._handleDoubleTap(e);
      } else {
        this.doubleTapFirstTapReleaseTimestamp = now;
        this.doubleTapFirstTap = {
          id: now.toString(),
          x: e.nativeEvent.pageX - this.state.originalPageX,
          y: e.nativeEvent.pageY - this.state.originalPageY
        };
        this._addTouch(this.doubleTapFirstTap);

        // persist event so e.nativeEvent is preserved after a timeout delay
        e.persist();
        this.singleTapTimeoutId = setTimeout(() => {
          var _this$props$onSingleT, _this$props6;
          delete this.doubleTapFirstTapReleaseTimestamp;
          delete this.singleTapTimeoutId;
          (_this$props$onSingleT = (_this$props6 = this.props).onSingleTap) === null || _this$props$onSingleT === void 0 ? void 0 : _this$props$onSingleT.call(_this$props6, e, this._getZoomableViewEventObject());
        }, this.props.doubleTapDelay);
      }
    });
    this.gestureHandlers = _reactNative.PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: (evt, gestureState) => {
        var _this$props$onPanResp3, _this$props7;
        // We should also call _handlePanResponderEnd
        // to properly perform cleanups when the gesture is terminated
        // (aka gesture handling responsibility is taken over by another component).
        // This also fixes a weird issue where
        // on real device, sometimes onPanResponderRelease is not called when you lift 2 fingers up,
        // but onPanResponderTerminate is called instead for no apparent reason.
        this._handlePanResponderEnd(evt, gestureState);
        (_this$props$onPanResp3 = (_this$props7 = this.props).onPanResponderTerminate) === null || _this$props$onPanResp3 === void 0 ? void 0 : _this$props$onPanResp3.call(_this$props7, evt, gestureState, this._getZoomableViewEventObject());
      },
      onPanResponderTerminationRequest: (evt, gestureState) => {
        var _this$props$onPanResp4, _this$props8;
        return !!((_this$props$onPanResp4 = (_this$props8 = this.props).onPanResponderTerminationRequest) !== null && _this$props$onPanResp4 !== void 0 && _this$props$onPanResp4.call(_this$props8, evt, gestureState, this._getZoomableViewEventObject()));
      },
      onShouldBlockNativeResponder: () => false
    });
    this.zoomSubjectWrapperRef = /*#__PURE__*/(0, _react.createRef)();
    if (this.props.zoomAnimatedValue) this.zoomAnim = this.props.zoomAnimatedValue;
    if (this.props.panAnimatedValueXY) this.panAnim = this.props.panAnimatedValueXY;
    this.zoomLevel = props.initialZoom;
    this.offsetX = props.initialOffsetX;
    this.offsetY = props.initialOffsetY;
    this.panAnim.setValue({
      x: this.offsetX,
      y: this.offsetY
    });
    this.zoomAnim.setValue(this.zoomLevel);
    this.panAnim.addListener(_ref => {
      let {
        x,
        y
      } = _ref;
      this.offsetX = x;
      this.offsetY = y;
    });
    this.zoomAnim.addListener(_ref2 => {
      let {
        value
      } = _ref2;
      this.zoomLevel = value;
    });
    this.state = {
      ...initialState
    };
    this.lastGestureTouchDistance = 150;
    this.gestureType = null;
  }
  set offsetX(x) {
    this.__setOffset('x', x);
  }
  set offsetY(y) {
    this.__setOffset('y', y);
  }
  get offsetX() {
    return this.__getOffset('x');
  }
  get offsetY() {
    return this.__getOffset('y');
  }
  __setOffset(axis, offset) {
    var _this$panAnim;
    const offsetState = this.__offsets[axis];
    const animValue = (_this$panAnim = this.panAnim) === null || _this$panAnim === void 0 ? void 0 : _this$panAnim[axis];
    if (this.props.bindToBorders) {
      var _this$state, _this$state2, _this$state3, _this$state4;
      const containerSize = axis === 'x' ? (_this$state = this.state) === null || _this$state === void 0 ? void 0 : _this$state.originalWidth : (_this$state2 = this.state) === null || _this$state2 === void 0 ? void 0 : _this$state2.originalHeight;
      const contentSize = axis === 'x' ? this.props.contentWidth || ((_this$state3 = this.state) === null || _this$state3 === void 0 ? void 0 : _this$state3.originalWidth) : this.props.contentHeight || ((_this$state4 = this.state) === null || _this$state4 === void 0 ? void 0 : _this$state4.originalHeight);
      const boundOffset = contentSize && containerSize ? (0, _applyPanBoundariesToOffset.applyPanBoundariesToOffset)(offset, containerSize, contentSize, this.zoomLevel, this.props.panBoundaryPadding) : offset;
      if (animValue && !this.gestureType && !offsetState.boundaryCrossedAnimInEffect) {
        const boundariesApplied = boundOffset !== offset && boundOffset.toFixed(3) !== offset.toFixed(3);
        if (boundariesApplied) {
          offsetState.boundaryCrossedAnimInEffect = true;
          (0, _animations.getBoundaryCrossedAnim)(this.panAnim[axis], boundOffset).start(() => {
            offsetState.boundaryCrossedAnimInEffect = false;
          });
          return;
        }
      }
    }
    offsetState.value = offset;
  }
  __getOffset(axis) {
    return this.__offsets[axis].value;
  }
  componentDidUpdate(prevProps, prevState) {
    const {
      zoomEnabled,
      initialZoom
    } = this.props;
    if (prevProps.zoomEnabled && !zoomEnabled) {
      this.zoomLevel = initialZoom;
      this.zoomAnim.setValue(this.zoomLevel);
    }
    if (!this.onTransformInvocationInitialized && this._invokeOnTransform().successful) {
      this.panAnim.addListener(() => this._invokeOnTransform());
      this.zoomAnim.addListener(() => this._invokeOnTransform());
      this.onTransformInvocationInitialized = true;
    }
    const currState = this.state;
    const originalMeasurementsChanged = currState.originalHeight !== prevState.originalHeight || currState.originalWidth !== prevState.originalWidth || currState.originalPageX !== prevState.originalPageX || currState.originalPageY !== prevState.originalPageY;
    if (this.onTransformInvocationInitialized && originalMeasurementsChanged) {
      this._invokeOnTransform();
    }
  }
  componentDidMount() {
    this.grabZoomSubjectOriginalMeasurements();
    // We've already run `grabZoomSubjectOriginalMeasurements` at various events
    // to make sure the measurements are promptly updated.
    // However, there might be cases we haven't accounted for, especially when
    // native processes are involved. To account for those cases,
    // we'll use an interval here to ensure we're always up-to-date.
    // The `setState` in `grabZoomSubjectOriginalMeasurements` won't trigger a rerender
    // if the values given haven't changed, so we're not running performance risk here.
    this.measureZoomSubjectInterval = setInterval(this.grabZoomSubjectOriginalMeasurements, 1e3);
  }
  componentWillUnmount() {
    clearInterval(this.measureZoomSubjectInterval);
  }

  /**
   * try to invoke onTransform
   * @private
   */
  _invokeOnTransform() {
    var _this$props$onTransfo, _this$props9;
    const zoomableViewEvent = this._getZoomableViewEventObject();
    if (!zoomableViewEvent.originalWidth || !zoomableViewEvent.originalHeight) return {
      successful: false
    };
    (_this$props$onTransfo = (_this$props9 = this.props).onTransform) === null || _this$props$onTransfo === void 0 ? void 0 : _this$props$onTransfo.call(_this$props9, zoomableViewEvent);
    return {
      successful: true
    };
  }

  /**
   * Returns additional information about components current state for external event hooks
   *
   * @returns {{}}
   * @private
   */
  _getZoomableViewEventObject() {
    let overwriteObj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return {
      zoomLevel: this.zoomLevel,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      originalHeight: this.state.originalHeight,
      originalWidth: this.state.originalWidth,
      originalPageX: this.state.originalPageX,
      originalPageY: this.state.originalPageY,
      ...overwriteObj
    };
  }

  /**
   * Get the original box dimensions and save them for later use.
   * (They will be used to calculate boxBorders)
   *
   * @private
   */

  /**
   * Handles the pinch movement and zooming
   *
   * @param e
   * @param gestureState
   *
   * @private
   */
  _handlePinching(e, gestureState) {
    var _this$props$onZoomAft, _this$props10;
    if (!this.props.zoomEnabled) return;
    const {
      maxZoom,
      minZoom,
      pinchToZoomInSensitivity,
      pinchToZoomOutSensitivity
    } = this.props;
    const distance = (0, _helper.calcGestureTouchDistance)(e, gestureState);
    if (this.props.onZoomBefore && this.props.onZoomBefore(e, gestureState, this._getZoomableViewEventObject())) {
      return;
    }

    // define the new zoom level and take zoom level sensitivity into consideration
    const zoomGrowthFromLastGestureState = distance / this.lastGestureTouchDistance;
    this.lastGestureTouchDistance = distance;
    const pinchToZoomSensitivity = zoomGrowthFromLastGestureState < 1 ? pinchToZoomOutSensitivity : pinchToZoomInSensitivity;
    const deltaGrowth = zoomGrowthFromLastGestureState - 1;
    // 0 - no resistance
    // 10 - 90% resistance
    const deltaGrowthAdjustedBySensitivity = deltaGrowth * (1 - pinchToZoomSensitivity * 9 / 100);
    let newZoomLevel = this.zoomLevel * (1 + deltaGrowthAdjustedBySensitivity);

    // make sure max and min zoom levels are respected
    if (maxZoom !== null && newZoomLevel > maxZoom) {
      newZoomLevel = maxZoom;
    }
    if (newZoomLevel < minZoom) {
      newZoomLevel = minZoom;
    }
    const gestureCenterPoint = (0, _helper.calcGestureCenterPoint)(e, gestureState);
    const zoomCenter = {
      x: gestureCenterPoint.x - this.state.originalPageX,
      y: gestureCenterPoint.y - this.state.originalPageY
    };

    // Uncomment to debug
    this.props.debug && this._setPinchDebugPoints(e, zoomCenter);
    const {
      originalHeight,
      originalWidth
    } = this.state;
    const oldOffsetX = this.offsetX;
    const oldOffsetY = this.offsetY;
    const oldScale = this.zoomLevel;
    const newScale = newZoomLevel;
    let offsetY = (0, _helper.calcNewScaledOffsetForZoomCentering)(oldOffsetY, originalHeight, oldScale, newScale, zoomCenter.y);
    let offsetX = (0, _helper.calcNewScaledOffsetForZoomCentering)(oldOffsetX, originalWidth, oldScale, newScale, zoomCenter.x);
    const offsetShift = this._calcOffsetShiftSinceLastGestureState(gestureCenterPoint);
    if (offsetShift) {
      offsetX += offsetShift.x;
      offsetY += offsetShift.y;
    }
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.zoomLevel = newScale;
    this.panAnim.setValue({
      x: this.offsetX,
      y: this.offsetY
    });
    this.zoomAnim.setValue(this.zoomLevel);
    (_this$props$onZoomAft = (_this$props10 = this.props).onZoomAfter) === null || _this$props$onZoomAft === void 0 ? void 0 : _this$props$onZoomAft.call(_this$props10, e, gestureState, this._getZoomableViewEventObject());
  }

  /**
   * Used to debug pinch events
   * @param gestureResponderEvent
   * @param zoomCenter
   * @param points
   */
  _setPinchDebugPoints(gestureResponderEvent, zoomCenter) {
    const {
      touches
    } = gestureResponderEvent.nativeEvent;
    const {
      originalPageY,
      originalPageX
    } = this.state;
    for (var _len = arguments.length, points = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      points[_key - 2] = arguments[_key];
    }
    this.setState({
      debugPoints: [{
        x: touches[0].pageX - originalPageX,
        y: touches[0].pageY - originalPageY
      }, {
        x: touches[1].pageX - originalPageX,
        y: touches[1].pageY - originalPageY
      }, zoomCenter, ...points]
    });
  }

  /**
   * Calculates the amount the offset should shift since the last position during panning
   *
   * @param {Vec2D} gestureCenterPoint
   *
   * @private
   */
  _calcOffsetShiftSinceLastGestureState(gestureCenterPoint) {
    const {
      movementSensibility
    } = this.props;
    let shift = null;
    if (this.lastGestureCenterPosition) {
      const dx = gestureCenterPoint.x - this.lastGestureCenterPosition.x;
      const dy = gestureCenterPoint.y - this.lastGestureCenterPosition.y;
      const shiftX = dx / this.zoomLevel / movementSensibility;
      const shiftY = dy / this.zoomLevel / movementSensibility;
      shift = {
        x: shiftX,
        y: shiftY
      };
    }
    this.lastGestureCenterPosition = gestureCenterPoint;
    return shift;
  }

  /**
   * Handles movement by tap and move
   *
   * @param gestureState
   *
   * @private
   */
  _handleShifting(gestureState) {
    // Skips shifting if disablePanOnInitialZoom is set and we're on the initial zoom level
    if (gestureState.numberActiveTouches == 1 || this.props.disablePanOnInitialZoom && this.zoomLevel === this.props.initialZoom) {
      return;
    }
    const shift = this._calcOffsetShiftSinceLastGestureState({
      x: gestureState.moveX,
      y: gestureState.moveY
    });
    if (!shift) return;
    const offsetX = this.offsetX + shift.x;
    const offsetY = this.offsetY + shift.y;
    if (this.props.debug) {
      const x = gestureState.moveX - this.state.originalPageX;
      const y = gestureState.moveY - this.state.originalPageY;
      this.setState({
        debugPoints: [{
          x,
          y
        }]
      });
    }
    this._setNewOffsetPosition(offsetX, offsetY);
  }

  /**
   * Set the state to offset moved
   *
   * @param {number} newOffsetX
   * @param {number} newOffsetY
   * @returns
   */
  async _setNewOffsetPosition(newOffsetX, newOffsetY) {
    const {
      onShiftingBefore,
      onShiftingAfter
    } = this.props;
    if (onShiftingBefore !== null && onShiftingBefore !== void 0 && onShiftingBefore(null, null, this._getZoomableViewEventObject())) {
      return;
    }
    this.offsetX = newOffsetX;
    this.offsetY = newOffsetY;
    this.panAnim.setValue({
      x: this.offsetX,
      y: this.offsetY
    });
    this.zoomAnim.setValue(this.zoomLevel);
    onShiftingAfter === null || onShiftingAfter === void 0 ? void 0 : onShiftingAfter(null, null, this._getZoomableViewEventObject());
  }

  /**
   * Check whether the press event is double tap
   * or single tap and handle the event accordingly
   *
   * @param e
   *
   * @private
   */

  _addTouch(touch) {
    this.touches.push(touch);
    this.setState({
      touches: [...this.touches]
    });
  }
  _removeTouch(touch) {
    this.touches.splice(this.touches.indexOf(touch), 1);
    this.setState({
      touches: [...this.touches]
    });
  }

  /**
   * Handles the double tap event
   *
   * @param e
   *
   * @private
   */
  _handleDoubleTap(e) {
    const {
      onDoubleTapBefore,
      onDoubleTapAfter,
      doubleTapZoomToCenter
    } = this.props;
    onDoubleTapBefore === null || onDoubleTapBefore === void 0 ? void 0 : onDoubleTapBefore(e, this._getZoomableViewEventObject());
    const nextZoomStep = this._getNextZoomStep();
    const {
      originalPageX,
      originalPageY
    } = this.state;

    // define new zoom position coordinates
    const zoomPositionCoordinates = {
      x: e.nativeEvent.pageX - originalPageX,
      y: e.nativeEvent.pageY - originalPageY
    };

    // if doubleTapZoomToCenter enabled -> always zoom to center instead
    if (doubleTapZoomToCenter) {
      zoomPositionCoordinates.x = 0;
      zoomPositionCoordinates.y = 0;
    }
    this._zoomToLocation(zoomPositionCoordinates.x, zoomPositionCoordinates.y, nextZoomStep).then(() => {
      onDoubleTapAfter === null || onDoubleTapAfter === void 0 ? void 0 : onDoubleTapAfter(e, this._getZoomableViewEventObject({
        zoomLevel: nextZoomStep
      }));
    });
  }

  /**
   * Returns the next zoom step based on current step and zoomStep property.
   * If we are zoomed all the way in -> return to initialzoom
   *
   * @returns {*}
   */
  _getNextZoomStep() {
    const {
      zoomStep,
      maxZoom,
      initialZoom
    } = this.props;
    const {
      zoomLevel
    } = this;
    if (zoomLevel.toFixed(2) === maxZoom.toFixed(2)) {
      return initialZoom;
    }
    const nextZoomStep = zoomLevel * (1 + zoomStep);
    if (nextZoomStep > maxZoom) {
      return maxZoom;
    }
    return nextZoomStep;
  }

  /**
   * Zooms to a specific location in our view
   *
   * @param x
   * @param y
   * @param newZoomLevel
   *
   * @private
   */
  async _zoomToLocation(x, y, newZoomLevel) {
    var _this$props$onZoomBef, _this$props11, _this$props$onZoomAft2, _this$props12;
    if (!this.props.zoomEnabled) return;
    (_this$props$onZoomBef = (_this$props11 = this.props).onZoomBefore) === null || _this$props$onZoomBef === void 0 ? void 0 : _this$props$onZoomBef.call(_this$props11, null, null, this._getZoomableViewEventObject());

    // == Perform Zoom Animation ==
    // Calculates panAnim values based on changes in zoomAnim.
    let prevScale = this.zoomLevel;
    // Since zoomAnim is calculated in native driver,
    //  it will jitter panAnim once in a while,
    //  because here panAnim is being calculated in js.
    // However the jittering should mostly occur in simulator.
    const listenerId = this.zoomAnim.addListener(_ref3 => {
      let {
        value: newScale
      } = _ref3;
      this.panAnim.setValue({
        x: (0, _helper.calcNewScaledOffsetForZoomCentering)(this.offsetX, this.state.originalWidth, prevScale, newScale, x),
        y: (0, _helper.calcNewScaledOffsetForZoomCentering)(this.offsetY, this.state.originalHeight, prevScale, newScale, y)
      });
      prevScale = newScale;
    });
    (0, _animations.getZoomToAnimation)(this.zoomAnim, newZoomLevel).start(() => {
      this.zoomAnim.removeListener(listenerId);
    });
    // == Zoom Animation Ends ==

    (_this$props$onZoomAft2 = (_this$props12 = this.props).onZoomAfter) === null || _this$props$onZoomAft2 === void 0 ? void 0 : _this$props$onZoomAft2.call(_this$props12, null, null, this._getZoomableViewEventObject());
  }

  /**
   * Zooms to a specificied zoom level.
   * Returns a promise if everything was updated and a boolean, whether it could be updated or if it exceeded the min/max zoom limits.
   *
   * @param {number} newZoomLevel
   *
   * @return {Promise<bool>}
   */
  async zoomTo(newZoomLevel) {
    if (
    // if we would go out of our min/max limits -> abort
    newZoomLevel > this.props.maxZoom || newZoomLevel < this.props.minZoom) return false;
    await this._zoomToLocation(0, 0, newZoomLevel);
    return true;
  }

  /**
   * Zooms in or out by a specified change level
   * Use a positive number for `zoomLevelChange` to zoom in
   * Use a negative number for `zoomLevelChange` to zoom out
   *
   * Returns a promise if everything was updated and a boolean, whether it could be updated or if it exceeded the min/max zoom limits.
   *
   * @param {number | null} zoomLevelChange
   *
   * @return {Promise<bool>}
   */
  zoomBy() {
    let zoomLevelChange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    // if no zoom level Change given -> just use zoom step
    if (!zoomLevelChange) {
      zoomLevelChange = this.props.zoomStep;
    }
    return this.zoomTo(this.zoomLevel + zoomLevelChange);
  }

  /**
   * Moves the zoomed view to a specified position
   * Returns a promise when finished
   *
   * @param {number} newOffsetX the new position we want to move it to (x-axis)
   * @param {number} newOffsetY the new position we want to move it to (y-axis)
   *
   * @return {Promise<bool>}
   */
  moveTo(newOffsetX, newOffsetY) {
    const {
      originalWidth,
      originalHeight
    } = this.state;
    const offsetX = (newOffsetX - originalWidth / 2) / this.zoomLevel;
    const offsetY = (newOffsetY - originalHeight / 2) / this.zoomLevel;
    return this._setNewOffsetPosition(-offsetX, -offsetY);
  }

  /**
   * Moves the zoomed view by a certain amount.
   *
   * Returns a promise when finished
   *
   * @param {number} offsetChangeX the amount we want to move the offset by (x-axis)
   * @param {number} offsetChangeY the amount we want to move the offset by (y-axis)
   *
   * @return {Promise<bool>}
   */
  moveBy(offsetChangeX, offsetChangeY) {
    const offsetX = (this.offsetX * this.zoomLevel - offsetChangeX) / this.zoomLevel;
    const offsetY = (this.offsetY * this.zoomLevel - offsetChangeY) / this.zoomLevel;
    return this._setNewOffsetPosition(offsetX, offsetY);
  }
  render() {
    var _this$state$touches;
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, _extends({
      style: styles.container
    }, this.gestureHandlers.panHandlers, {
      ref: this.zoomSubjectWrapperRef,
      onLayout: this.grabZoomSubjectOriginalMeasurements
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
      style: [styles.zoomSubject, this.props.style, {
        transform: [{
          scale: this.zoomAnim
        }, ...this.panAnim.getTranslateTransform()]
      }]
    }, this.props.children), this.props.visualTouchFeedbackEnabled && ((_this$state$touches = this.state.touches) === null || _this$state$touches === void 0 ? void 0 : _this$state$touches.map(touch => {
      const animationDuration = this.props.doubleTapDelay;
      return /*#__PURE__*/_react.default.createElement(_components.AnimatedTouchFeedback, {
        x: touch.x,
        y: touch.y,
        key: touch.id,
        animationDuration: animationDuration,
        onAnimationDone: () => this._removeTouch(touch)
      });
    })), (this.state.debugPoints || []).map((_ref4, index) => {
      let {
        x,
        y
      } = _ref4;
      return /*#__PURE__*/_react.default.createElement(_debugHelper.DebugTouchPoint, {
        key: index,
        x: x,
        y: y
      });
    }));
  }
}
_defineProperty(ReactNativeZoomableView, "defaultProps", {
  zoomEnabled: true,
  initialZoom: 1,
  initialOffsetX: 0,
  initialOffsetY: 0,
  maxZoom: 1.5,
  minZoom: 0.5,
  pinchToZoomInSensitivity: 1,
  pinchToZoomOutSensitivity: 1,
  movementSensibility: 1,
  doubleTapDelay: 300,
  bindToBorders: true,
  zoomStep: 0.5,
  onLongPress: null,
  longPressDuration: 700,
  contentWidth: undefined,
  contentHeight: undefined,
  panBoundaryPadding: 0,
  visualTouchFeedbackEnabled: true,
  disablePanOnInitialZoom: false
});
const styles = _reactNative.StyleSheet.create({
  zoomSubject: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  }
});
var _default = ReactNativeZoomableView;
exports.default = _default;
//# sourceMappingURL=ReactNativeZoomableView.js.map