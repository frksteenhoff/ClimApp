const expert = require('../../helper_functions/expert_dashboard.js');
//const kb = require('../../index.js');

/* --------------------------------------------------------------------------
 * Test of function clothingIcon(clo) 
 * -------------------------------------------------------------------------- */
test('Set clothing icon to "./img/clothing/2.0clo.png" when value > 3', () => {
  expect(expert.clothingIcon(4)).toBe("./img/clothing/2.0clo.png");
});

test('Set clothing icon to "./img/clothing/2.0clo.png" when value > 2', () => {
  expect(expert.clothingIcon(2.2)).toBe("./img/clothing/2.0clo.png");
});

test('Set clothing icon to "./img/clothing/1.5clo_wind.png" when value > 1.5', () => {
  expect(expert.clothingIcon(1.6)).toBe("./img/clothing/1.5clo_wind.png");
});

test('Set clothing icon to "./img/clothing/1.0clo.png" when value > 1.1', () => {
  expect(expert.clothingIcon(1.3)).toBe("./img/clothing/1.0clo.png");
});

test('Set clothing icon to "./img/clothing/0.9clo.png" when value >= 0.7', () => {
  expect(expert.clothingIcon(0.7)).toBe("./img/clothing/0.9clo.png");
});

test('Set clothing icon to "./img/clothing/0.9clo.png" when value >= 0.7', () => {
    expect(expert.clothingIcon(0.8)).toBe("./img/clothing/0.9clo.png");
  });

test('Set clothing icon to "./img/clothing/0.5clo.png" when value is anything but above', () => {
  expect(expert.clothingIcon(0.5)).toBe("./img/clothing/0.5clo.png");
});