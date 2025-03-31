describe('Submit Post', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login');
    cy.wait(1000); // Wait for page to load

    cy.get('input#username').type('cypresstest');
    cy.wait(500); // Wait between inputs
    cy.get('input#password').type('password');
    cy.wait(500); // Wait before clicking

    cy.contains('button', 'Sign In').click();
    cy.wait(2000); // Wait for login to complete

    // Then visit submit page
    cy.visit('/submit');
    cy.wait(1000); // Wait for page to load
  });

  it('displays submit form elements', () => {
    cy.wait(1000); // Wait for elements to load
    // Check if textarea exists
    cy.get('textarea').should('exist');
  });

  it('allows text input', () => {
    cy.wait(1000); // Wait before typing
    // Simple input test
    cy.get('textarea').type('test', { delay: 100 }); // Slow down typing
    cy.wait(500); // Wait before checking value
    cy.get('textarea').should('have.value', 'test');
  });
}); 