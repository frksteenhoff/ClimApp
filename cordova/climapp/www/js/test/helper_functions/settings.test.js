const settings = require('../../helper_functions/settings.js');

/* --------------------------------------------------------------------------
 * Test of function getCalculatedHeightValue(unit, height) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test('Set value of height to 180 when unit is "SI" and height is "180cm"', () => {
  expect(settings.getCalculatedHeightValue("SI", 180)).toBe(180);
});

test('Set value of height to 6ft when unit is "UK" and height is "180cm"', () => {
    expect(settings.getCalculatedHeightValue("UK", 180)).toBe(6);
});

test('Set value of height to 6ft when unit is "US" and height is "180cm"', () => {
    expect(settings.getCalculatedHeightValue("US", 180)).toBe(6);
});

/* --------------------------------------------------------------------------
 * Test of function getHeightUnit(unit) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test('Get height unit "cm" when unit is "SI"', () => {
  expect(settings.getHeightUnit("SI")).toBe("cm");
});

test('Get height unit "feet" when unit is "UK"', () => {
  expect(settings.getHeightUnit("UK")).toBe("feet");
});

test('Get height unit "feet" when unit is "US"', () => {
  expect(settings.getHeightUnit("US")).toBe("feet");
});
  
test('Get "Wrong unit" when unit not in [SI, UK, US]', () => {
    expect(settings.getHeightUnit("USS")).toBe("Wrong unit");
});
  

/* --------------------------------------------------------------------------
 * Test of function getCalculatedWeightValue(unit, height) 
 * The input param "weight" will always be in SI units
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test('Set value of weight to 80 when unit is "SI" and weight is 80', () => {
  expect(settings.getCalculatedWeightValue("SI", 80)).toBe(80);
});

test('Set value of weight to 13 when unit is "UK" and weight is 80', () => {
    expect(settings.getCalculatedWeightValue("UK", 80)).toBe(13);
});

test('Set value of weight to 167 when unit is "US" and weight is 80', () => {
    expect(settings.getCalculatedWeightValue("US", 80)).toBe(176);
});  

/* --------------------------------------------------------------------------
 * Test of function getWeightUnit(unit) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test('Get weight unit "kg" when unit is "SI"', () => {
    expect(settings.getWeightUnit("SI")).toBe("kg");
});

test('Get weight unit "stones" when unit is "UK"', () => {
    expect(settings.getWeightUnit("UK")).toBe("stones");
});

test('Get weight unit "lbs" when unit is "US"', () => {
    expect(settings.getWeightUnit("US")).toBe("lbs");
});

/* --------------------------------------------------------------------------
 * Test of function deviceID(unit) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock a device', () => {
    expect(settings.deviceID()).toBe("");
});

/* --------------------------------------------------------------------------
 * Test of function deviceID(unit) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock the knowledgebase', () => {
    expect(settings.getGenderAsInteger(kb)).toBe("");
});

