function getNext12AM() {
  now = new Date();
  currentDay = now.getUTCDate();
  now.setUTCDate(currentDay + 1);
  now.setUTCHours(0);
  now.setUTCMinutes(30);
  return now;
}

module.exports = {
  getNext12AM,
};
