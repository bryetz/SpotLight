describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Login Form', () => {
    it('should display the login form by default', () => {
      // Check if the page title is visible
      cy.contains('h1', 'Welcome Back').should('be.visible');
      
      // Check if form elements exist
      cy.get('input#username').should('exist');
      cy.get('input#password').should('exist');
      cy.get('button[type="submit"]').should('exist');
      
      // Check if the register option exists
      cy.contains('button', 'Sign up').should('exist');
    });

    it('should switch to register mode when register button is clicked', () => {
      cy.contains('button', 'Sign up').click();
      cy.contains('h1', 'Create Account').should('be.visible');
      cy.contains('button', 'Sign in').should('exist');
    });

    it('should attempt to submit login form', () => {
      cy.get('input#username').type('testuser');
      cy.get('input#password').type('password123');
      cy.get('button[type="submit"]').click();
    });
  });

}); 