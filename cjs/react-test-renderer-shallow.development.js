/** @license React v16.3.1
 * react-test-renderer-shallow.development.js
 *
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';



if (process.env.NODE_ENV !== "production") {
  (function() {
'use strict';

var _assign = require('object-assign');
var React = require('react');
var reactIs = require('react-is');
var emptyObject = require('fbjs/lib/emptyObject');
var invariant = require('fbjs/lib/invariant');
var shallowEqual = require('fbjs/lib/shallowEqual');
var checkPropTypes = require('prop-types/checkPropTypes');

/**
 * WARNING: DO NOT manually require this module.
 * This is a replacement for `invariant(...)` used by the error code system
 * and will _only_ be required by the corresponding babel pass.
 * It always throws.
 */

var describeComponentFrame = function (name, source, ownerName) {
  return '\n    in ' + (name || 'Unknown') + (source ? ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' + source.lineNumber + ')' : ownerName ? ' (created by ' + ownerName + ')' : '');
};

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol['for'];


var REACT_CALL_TYPE = hasSymbol ? Symbol['for']('react.call') : 0xeac8;
var REACT_RETURN_TYPE = hasSymbol ? Symbol['for']('react.return') : 0xeac9;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol['for']('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol['for']('react.fragment') : 0xeacb;

function getComponentName(fiber) {
  var type = fiber.type;

  if (typeof type === 'function') {
    return type.displayName || type.name;
  }
  if (typeof type === 'string') {
    return type;
  }
  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return 'ReactFragment';
    case REACT_PORTAL_TYPE:
      return 'ReactPortal';
    case REACT_CALL_TYPE:
      return 'ReactCall';
    case REACT_RETURN_TYPE:
      return 'ReactReturn';
  }
  return null;
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReactShallowRenderer = function () {
  function ReactShallowRenderer() {
    _classCallCheck(this, ReactShallowRenderer);

    this._context = null;
    this._element = null;
    this._instance = null;
    this._newState = null;
    this._rendered = null;
    this._rendering = false;
    this._forcedUpdate = false;
    this._updater = new Updater(this);
  }

  ReactShallowRenderer.prototype.getMountedInstance = function getMountedInstance() {
    return this._instance;
  };

  ReactShallowRenderer.prototype.getRenderOutput = function getRenderOutput() {
    return this._rendered;
  };

  ReactShallowRenderer.prototype.render = function render(element) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyObject;

    !React.isValidElement(element) ? invariant(false, 'ReactShallowRenderer render(): Invalid component element.%s', typeof element === 'function' ? ' Instead of passing a component class, make sure to instantiate ' + 'it by passing it to React.createElement.' : '') : void 0;
    // Show a special message for host elements since it's a common case.
    !(typeof element.type !== 'string') ? invariant(false, 'ReactShallowRenderer render(): Shallow rendering works only with custom components, not primitives (%s). Instead of calling `.render(el)` and inspecting the rendered output, look at `el.props` directly instead.', element.type) : void 0;
    !(reactIs.isForwardRef(element) || typeof element.type === 'function') ? invariant(false, 'ReactShallowRenderer render(): Shallow rendering works only with custom components, but the provided element type was `%s`.', Array.isArray(element.type) ? 'array' : element.type === null ? 'null' : typeof element.type) : void 0;

    if (this._rendering) {
      return;
    }

    this._rendering = true;
    this._element = element;
    this._context = getMaskedContext(element.type.contextTypes, context);

    if (this._instance) {
      this._updateClassComponent(element, this._context);
    } else {
      if (reactIs.isForwardRef(element)) {
        this._rendered = element.type.render(element.props, element.ref);
      } else if (shouldConstruct(element.type)) {
        this._instance = new element.type(element.props, this._context, this._updater);

        this._updateStateFromStaticLifecycle(element.props);

        if (element.type.hasOwnProperty('contextTypes')) {
          currentlyValidatingElement = element;

          checkPropTypes(element.type.contextTypes, this._context, 'context', getName(element.type, this._instance), getStackAddendum);

          currentlyValidatingElement = null;
        }

        this._mountClassComponent(element, this._context);
      } else {
        this._rendered = element.type(element.props, this._context);
      }
    }

    this._rendering = false;
    this._updater._invokeCallbacks();

    return this.getRenderOutput();
  };

  ReactShallowRenderer.prototype.unmount = function unmount() {
    if (this._instance) {
      if (typeof this._instance.componentWillUnmount === 'function') {
        this._instance.componentWillUnmount();
      }
    }

    this._context = null;
    this._element = null;
    this._newState = null;
    this._rendered = null;
    this._instance = null;
  };

  ReactShallowRenderer.prototype._mountClassComponent = function _mountClassComponent(element, context) {
    this._instance.context = context;
    this._instance.props = element.props;
    this._instance.state = this._instance.state || null;
    this._instance.updater = this._updater;

    if (typeof this._instance.UNSAFE_componentWillMount === 'function' || typeof this._instance.componentWillMount === 'function') {
      var beforeState = this._newState;

      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (typeof element.type.getDerivedStateFromProps !== 'function' && typeof this._instance.getSnapshotBeforeUpdate !== 'function') {
        if (typeof this._instance.componentWillMount === 'function') {
          this._instance.componentWillMount();
        }
        if (typeof this._instance.UNSAFE_componentWillMount === 'function') {
          this._instance.UNSAFE_componentWillMount();
        }
      }

      // setState may have been called during cWM
      if (beforeState !== this._newState) {
        this._instance.state = this._newState || emptyObject;
      }
    }

    this._rendered = this._instance.render();
    // Intentionally do not call componentDidMount()
    // because DOM refs are not available.
  };

  ReactShallowRenderer.prototype._updateClassComponent = function _updateClassComponent(element, context) {
    var props = element.props,
        type = element.type;


    var oldState = this._instance.state || emptyObject;
    var oldProps = this._instance.props;

    if (oldProps !== props) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (typeof element.type.getDerivedStateFromProps !== 'function' && typeof this._instance.getSnapshotBeforeUpdate !== 'function') {
        if (typeof this._instance.componentWillReceiveProps === 'function') {
          this._instance.componentWillReceiveProps(props, context);
        }
        if (typeof this._instance.UNSAFE_componentWillReceiveProps === 'function') {
          this._instance.UNSAFE_componentWillReceiveProps(props, context);
        }
      }

      this._updateStateFromStaticLifecycle(props);
    }

    // Read state after cWRP in case it calls setState
    var state = this._newState || oldState;

    var shouldUpdate = true;
    if (this._forcedUpdate) {
      shouldUpdate = true;
      this._forcedUpdate = false;
    } else if (typeof this._instance.shouldComponentUpdate === 'function') {
      shouldUpdate = !!this._instance.shouldComponentUpdate(props, state, context);
    } else if (type.prototype && type.prototype.isPureReactComponent) {
      shouldUpdate = !shallowEqual(oldProps, props) || !shallowEqual(oldState, state);
    }

    if (shouldUpdate) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (typeof element.type.getDerivedStateFromProps !== 'function' && typeof this._instance.getSnapshotBeforeUpdate !== 'function') {
        if (typeof this._instance.componentWillUpdate === 'function') {
          this._instance.componentWillUpdate(props, state, context);
        }
        if (typeof this._instance.UNSAFE_componentWillUpdate === 'function') {
          this._instance.UNSAFE_componentWillUpdate(props, state, context);
        }
      }
    }

    this._instance.context = context;
    this._instance.props = props;
    this._instance.state = state;

    if (shouldUpdate) {
      this._rendered = this._instance.render();
    }
    // Intentionally do not call componentDidUpdate()
    // because DOM refs are not available.
  };

  ReactShallowRenderer.prototype._updateStateFromStaticLifecycle = function _updateStateFromStaticLifecycle(props) {
    var type = this._element.type;


    if (typeof type.getDerivedStateFromProps === 'function') {
      var partialState = type.getDerivedStateFromProps.call(null, props, this._instance.state);

      if (partialState != null) {
        var oldState = this._newState || this._instance.state;
        var newState = _assign({}, oldState, partialState);
        this._instance.state = this._newState = newState;
      }
    }
  };

  return ReactShallowRenderer;
}();

ReactShallowRenderer.createRenderer = function () {
  return new ReactShallowRenderer();
};

var Updater = function () {
  function Updater(renderer) {
    _classCallCheck(this, Updater);

    this._renderer = renderer;
    this._callbacks = [];
  }

  Updater.prototype._enqueueCallback = function _enqueueCallback(callback, publicInstance) {
    if (typeof callback === 'function' && publicInstance) {
      this._callbacks.push({
        callback: callback,
        publicInstance: publicInstance
      });
    }
  };

  Updater.prototype._invokeCallbacks = function _invokeCallbacks() {
    var callbacks = this._callbacks;
    this._callbacks = [];

    callbacks.forEach(function (_ref) {
      var callback = _ref.callback,
          publicInstance = _ref.publicInstance;

      callback.call(publicInstance);
    });
  };

  Updater.prototype.isMounted = function isMounted(publicInstance) {
    return !!this._renderer._element;
  };

  Updater.prototype.enqueueForceUpdate = function enqueueForceUpdate(publicInstance, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    this._renderer._forcedUpdate = true;
    this._renderer.render(this._renderer._element, this._renderer._context);
  };

  Updater.prototype.enqueueReplaceState = function enqueueReplaceState(publicInstance, completeState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    this._renderer._newState = completeState;
    this._renderer.render(this._renderer._element, this._renderer._context);
  };

  Updater.prototype.enqueueSetState = function enqueueSetState(publicInstance, partialState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    var currentState = this._renderer._newState || publicInstance.state;

    if (typeof partialState === 'function') {
      partialState = partialState(currentState, publicInstance.props);
    }

    this._renderer._newState = _assign({}, currentState, partialState);

    this._renderer.render(this._renderer._element, this._renderer._context);
  };

  return Updater;
}();

var currentlyValidatingElement = null;

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function getStackAddendum() {
  var stack = '';
  if (currentlyValidatingElement) {
    var name = getDisplayName(currentlyValidatingElement);
    var owner = currentlyValidatingElement._owner;
    stack += describeComponentFrame(name, currentlyValidatingElement._source, owner && getComponentName(owner));
  }
  return stack;
}

function getName(type, instance) {
  var constructor = instance && instance.constructor;
  return type.displayName || constructor && constructor.displayName || type.name || constructor && constructor.name || null;
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

function getMaskedContext(contextTypes, unmaskedContext) {
  if (!contextTypes) {
    return emptyObject;
  }
  var context = {};
  for (var key in contextTypes) {
    context[key] = unmaskedContext[key];
  }
  return context;
}



var ReactShallowRenderer$2 = Object.freeze({
	default: ReactShallowRenderer
});

var ReactShallowRenderer$3 = ( ReactShallowRenderer$2 && ReactShallowRenderer ) || ReactShallowRenderer$2;

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.
var shallow = ReactShallowRenderer$3['default'] ? ReactShallowRenderer$3['default'] : ReactShallowRenderer$3;

module.exports = shallow;
  })();
}
