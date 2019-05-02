const dash = require('../../helper_functions/dashboard.js');
//const kb = require('../../index.js');

/* --------------------------------------------------------------------------
 * Test of function gaugetitleCold(value) 
 * -------------------------------------------------------------------------- */
test('Set gauge title (cold) to "no thermal stress" when value <= 1', () => {
  expect(dash.gaugeTitleCold(0)).toBe("no thermal stress");
});

test('Set gauge title (cold) to "minor cold stress" when value < 2', () => {
  expect(dash.gaugeTitleCold(1.4)).toBe("minor cold stress");
});

test('Set gauge title (cold) to "significant cold stress" when value < 3', () => {
  expect(dash.gaugeTitleCold(2.3)).toBe("significant cold stress");
});

test('Set gauge title (cold) to "high cold stress" when value < 4', () => {
  expect(dash.gaugeTitleCold(3.1)).toBe("high cold stress");
});

test('Set gauge title (cold) to "severe cold stress" when value < 5', () => {
  expect(dash.gaugeTitleCold(4.8)).toBe("severe cold stress");
});

test('Set gauge title (cold) to "extreme cold stress" when value > 5', () => {
  expect(dash.gaugeTitleCold(5.3)).toBe("extreme cold stress");
});

/* --------------------------------------------------------------------------
 * Test of function gaugetitleHeat(value) 
 * -------------------------------------------------------------------------- */
test('Set gauge title (heat) to "no thermal stress" when value < 1', () => {
  expect(dash.gaugeTitleHeat(0)).toBe("no thermal stress");
});

test('Set gauge title (heat) to "minor heat stress" when value < 2', () => {
  expect(dash.gaugeTitleHeat(1.4)).toBe("minor heat stress");
});

test('Set gauge title (heat) to "significant heat stress" when value < 3', () => {
  expect(dash.gaugeTitleHeat(2.3)).toBe("significant heat stress");
});

test('Set gauge title (heat) to "high heat stress" when value < 4', () => {
  expect(dash.gaugeTitleHeat(3.1)).toBe("high heat stress");
});

test('Set gauge title (heat) to "severe heat stress" when value < 5', () => {
  expect(dash.gaugeTitleHeat(4.8)).toBe("severe heat stress");
});

test('Set gauge title (heat) to "extreme heat stress" when value > 5', () => {
  expect(dash.gaugeTitleHeat(5.3)).toBe("extreme heat stress");
});

/* --------------------------------------------------------------------------
 * Test of function getTemperatureUnit(value) 
 * -------------------------------------------------------------------------- */
test('Temperature unit is "Fahrenheit" when unit is "US"', () => {
  expect(dash.getTemperatureUnit("US")).toBe("Fahrenheit");
});

test('Temperature unit is "Celcius" when unit is "UK"', () => {
  expect(dash.getTemperatureUnit("UK")).toBe("Celcius");
});

test('Temperature unit is "Celcius" when unit is "SI"', () => {
  expect(dash.getTemperatureUnit("SI")).toBe("Celcius");
});

// default
test('Temperature unit is "Celcius" when unit is "" (something other than expected)', () => {
  expect(dash.getTemperatureUnit(" ")).toBe("Celcius");
});

/* --------------------------------------------------------------------------
 * Test of function getTemperatureValueInPreferredUnit(unit, temp) 
 * Value of temperatue is always given in celcius
 * -------------------------------------------------------------------------- */
test('Temperature is 12 degrees celcius when input unit is "SI" and temperature is 12 degrees', () => {
  expect(dash.getTemperatureValueInPreferredUnit(12, "SI")).toBe(12);
});

test('Temperature is 12 degrees celcius when input unit is "UK" and temperature is 12 degrees', () => {
  expect(dash.getTemperatureValueInPreferredUnit(12, "UK")).toBe(12);
});

test('Temperature is 54 degrees fahrenheit when input unit is "US" and temperature is 12 degrees', () => {
  expect(dash.getTemperatureValueInPreferredUnit(12, "US")).toBe(53.6);
});

/* --------------------------------------------------------------------------
 * Test of function windchillRisk(value) 
 * -------------------------------------------------------------------------- */
test('Windchill risk is 2 when windchill is -55', () => {
  expect(dash.windchillRisk(-55)).toBe(2);
});

test('Windchill risk is 10 when windchill is -45', () => {
  expect(dash.windchillRisk(-45)).toBe(10);
});

test('Windchill risk is 30 when windchill is -34', () => {
  expect(dash.windchillRisk(-34)).toBe(30);
});

test('Windchill risk is 60 when windchill is -19', () => {
  expect(dash.windchillRisk(-19)).toBe(60);
});

test('Windchill risk is false when windchill -14 (greater than -15)', () => {
  expect(dash.windchillRisk(-14)).toBe(false);
});

/* --------------------------------------------------------------------------
 * Test of function BSA(value) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb 
test.skip('Need to be able to mock knowledgebase to implement test', () => {
  expect(dash.BSA("")).toBe("");
});

/* --------------------------------------------------------------------------
 * Test of function M(value) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
  expect(dash.M("")).toBe("");
});

/* --------------------------------------------------------------------------
 * Test of function RAL(value) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
  expect(dash.RAL("")).toBe("");
});

/* --------------------------------------------------------------------------
 * Test of function WBGTrisk(value, knowledgebase) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
  expect(dash.WBGTrisk("", "")).toBe("");
});

/* --------------------------------------------------------------------------
 * Test of function windchillTips(value) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
  expect(dash.windchillTips("")).toBe("");
});

/* --------------------------------------------------------------------------
 * Test of function phsTips(value) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
  expect(dash.phsTips("")).toBe("");
});

/* --------------------------------------------------------------------------
 * Test of function neutralTips(value) 
 * -------------------------------------------------------------------------- */
// Choses a response at random, no need for testing?
test.skip('Need to be able to mock knowledgebase to implement test', () => {
  expect(dash.neutralTips("")).toBe("");
});