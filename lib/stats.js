/*global module*/

function mean (numbers) {
  var sum = 0;
  var length = numbers.length;
  for (var i = 0; i < length; i++) {
    sum += numbers[i];
  }
  return sum / length;
}

module.exports = {
  mean: mean
};
