export const patchClass = (el, value) => {
  if (value == null) {
    el.className = "";
  } else {
    el.className = value;
  }
};
