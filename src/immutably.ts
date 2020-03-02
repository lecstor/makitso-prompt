function isFunction(v: unknown) {
  return Object.prototype.toString.call(v) === "[object Function]";
}

function isObject(v: unknown) {
  return Object.prototype.toString.call(v) === "[object Object]";
}

/**
 * immutably patch an object
 *
 * @param {Object} state - app state
 * @param {Object} patch - patch to apply
 * @returns {Object} updated state
 */
export function applyPatch(state: any, patch: any) {
  Object.keys(patch).forEach(key => {
    const value = patch[key];
    if (value === undefined) {
      return true;
    }
    if (isObject(value) && !isFunction(value) && !Array.isArray(value)) {
      if (state[key]) {
        state = {
          ...state,
          [key]: applyPatch(state[key], value)
        };
      } else {
        state[key] = value;
      }
    } else {
      state = { ...state, [key]: value };
    }
  });
  return { ...state };
}
