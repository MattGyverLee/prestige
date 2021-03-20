/* eslint-disable jest/expect-expect */
/// <reference types="cypress" />

describe("Open App", () => {
  before(() => {
    cy.visit("http://localhost:3000/");
  });
  it("Web tests", () => {
    cy.contains("Prestige");
    cy.get("div.wave-table-container").should("exist");
    cy.get(".wave-table tbody").children().should("have.length", 6);
  });
  it("Load Sample Project", () => {
    cy.get(".mediaTest").click();
    cy.wait(3000);
    cy.get(".play-pause-button").click();
    cy.get(".subReal").contains("Salut");
  });
  it("Plays Intro", () => {
    cy.wait(2000);
    cy.get(":nth-child(2) > :nth-child(1) > span > button").click();
    cy.wait(500);
    cy.get("#client-snackbar").contains("0.863");
  });
  it("Plays 'Il s'agit'", () => {
    cy.wait(2000);
    cy.get(":nth-child(3) > :nth-child(1) > span > button").click();
    cy.wait(500);
    cy.get("#client-snackbar").contains(`7.491`);
  });
});
/*
#client-snackbar
cy.get(".subReal").contains("Salut");

 it("Media Loaded", () => {
    cy.get('.subReal').contains('Salut')
  })
*/
