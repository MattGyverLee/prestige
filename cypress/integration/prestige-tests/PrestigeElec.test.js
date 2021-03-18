/* eslint-disable jest/expect-expect */
/// <reference types="cypress" />

describe("Open App", () => {
  before(() => {
    cy.visit("../public/electron-debug.js:9223");
  });
  it("basic tests", () => {
    cy.contains("Prestige");
    cy.get("div.wave-table-container").should("exist");
    cy.get(".wave-table tbody").children().should("have.length", 6);
  });
});
