function convertDDMMtoDD(ddmm) {
  const degrees = Math.floor(ddmm / 100);
  const minutes = ddmm % 100;
  return degrees + minutes / 60;
}
module.exports = {
  convertDDMMtoDD,
};
