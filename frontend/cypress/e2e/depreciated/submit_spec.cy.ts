describe('Post Submission', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login');
    
    // Fill in login credentials
    cy.get('input#username').type('cypresstest');
    cy.get('input#password').type('password');
    
    // Submit login form
    cy.contains('button', 'Sign In').click();
    
    // Wait for login to complete and redirect
    cy.url().should('not.include', '/login');
    
	cy.wait(5000);
    // Navigate to submit page
    cy.visit('/submit');
  });

  it('should display the post creation form when logged in', () => {
    // Check if the page title is visible
    cy.contains('h1', 'Create Post').should('be.visible');
    
    // Check if content textarea exists
    cy.get('textarea[placeholder="What\'s on your mind?"]').should('be.visible');
    
    // Check if character counter is visible
    cy.contains('span', '/500').should('be.visible');

	// Wait for location to load (important for submission)
    cy.get('[data-testid="location-coordinates"]', { timeout: 10000 })
      .should('exist');
    
    // Check if Post button exists
    cy.contains('button', 'Post').should('exist');
    cy.contains('button', 'Cancel').should('exist');
  });

  it('should create a new post', () => {
    // Wait for location to load (important for submission)
    cy.get('[data-testid="location-coordinates"]', { timeout: 10000 })
      .should('exist');
    
    // Type content
    cy.get('textarea[placeholder="What\'s on your mind?"]')
      .type('This is a test post created by Cypress automation');
    
    // Verify character count
    cy.contains('span', '47/500').should('exist');
    
    // Submit the form
    cy.contains('button', 'Post').click();
    
    // After submission, should redirect to home
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should show validation error for empty content', () => {
    // Wait for location to load
    cy.get('[class*="flex items-center text-sm text-white"]', { timeout: 10000 })
      .should('exist');
    
    // Leave textarea empty and try to submit
    cy.contains('button', 'Post').click();
    
    // Should show error message
    cy.contains('Please enter some content for your post').should('be.visible');
    
    // Still on the submit page
    cy.url().should('include', '/submit');
  });
}); 