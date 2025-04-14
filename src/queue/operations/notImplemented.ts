export const nonImplemented = () => {
  return new Promise<void>((resolve) => {
    console.log("Not implemented");
    resolve();
  });
};
