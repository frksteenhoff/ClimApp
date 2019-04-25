const dtu_db = require('../../helper_functions/dtu_database.js');

/* --------------------------------------------------------------------------
 * Test of function addFeedbackToDB(knowledgebase) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test, skipping', () => {
    expect(dtu_db.addFeedbackToDB("")).toBe("");
  });

 /* --------------------------------------------------------------------------
 * Test of function createUserRecord(knowledgebase) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
    expect(dtu_db.createUserRecord("")).toBe("");
  });

 /* --------------------------------------------------------------------------
 * Test of function updateDBparam(knowledgebase, param) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
    expect(dtu_db.updateDBParam("", "")).toBe("");
  });

 /* --------------------------------------------------------------------------
 * Test of function addWeatherDataToD(knowledgebase) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
    expect(dtu_db.addWeatherDataToDB("")).toBe("");
  });

/* --------------------------------------------------------------------------
 * Test of function getAppIDFromDB(knowledgebase) 
 * -------------------------------------------------------------------------- */
// Currently untestable, need to mock kb
test.skip('Need to be able to mock knowledgebase to implement test', () => {
    expect(dtu_db.getAppIDFromDB("")).toBe("");
  });
 