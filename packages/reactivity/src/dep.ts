export const createDep = (effects?: any[]) => {
  const dep = new Set(effects);

  return dep;
};
