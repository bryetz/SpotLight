describe('Authentication Page', () => {
  beforeEach(() => {
    // Visit the login page before each test
    cy.visit('/login');
  });

  describe('Login Mode', () => {
    it('should display the login form by default', () => {
      // Check if the page title is visible
      cy.contains('h1', 'Login').should('be.visible');
      
      // Check if form elements exist
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').contains('Login').should('be.visible');
      
      // Check if the register link exists
      cy.contains('a', 'Register').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      // Submit the form without filling in any fields
      cy.get('button[type="submit"]').click();
      
      // Check if validation errors are displayed
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show error message for invalid credentials', () => {
      // Mock the API response for failed login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid email or password' }
      }).as('loginFailure');
      
      // Fill in the form with invalid credentials
      cy.get('input[type="email"]').type('invalid@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Wait for the API call to complete
      cy.wait('@loginFailure');
      
      // Check if error message is displayed
      cy.contains('Invalid email or password').should('be.visible');
    });

    it('should successfully log in with valid credentials', () => {
      // Mock the API response for successful login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: '123',
            username: 'testuser',
            email: 'test@example.com',
            profile_picture: null,
            bio: null,
            created_at: '2023-01-01T12:00:00Z',
            updated_at: '2023-01-01T12:00:00Z'
          },
          token: 'fake-jwt-token'
        }
      }).as('loginSuccess');
      
      // Fill in the form with valid credentials
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Wait for the API call to complete
      cy.wait('@loginSuccess');
      
      // Check if we're redirected to the home page
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Check if the token is stored in localStorage
      cy.window().its('localStorage.token').should('exist');
    });
  });

  describe('Register Mode', () => {
    beforeEach(() => {
      // Switch to register mode
      cy.contains('a', 'Register').click();
    });

    it('should display the register form', () => {
      // Check if the page title is visible
      cy.contains('h1', 'Register').should('be.visible');
      
      // Check if form elements exist
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').contains('Register').should('be.visible');
      
      // Check if the login link exists
      cy.contains('a', 'Login').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      // Submit the form without filling in any fields
      cy.get('button[type="submit"]').click();
      
      // Check if validation errors are displayed
      cy.contains('Username is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show error message for existing email', () => {
      // Mock the API response for registration failure
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 400,
        body: { message: 'Email already in use' }
      }).as('registerFailure');
      
      // Fill in the form with an existing email
      cy.get('input[name="username"]').type('newuser');
      cy.get('input[type="email"]').type('existing@example.com');
      cy.get('input[type="password"]').type('password123');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Wait for the API call to complete
      cy.wait('@registerFailure');
      
      // Check if error message is displayed
      cy.contains('Email already in use').should('be.visible');
    });

    it('should successfully register a new user', () => {
      // Mock the API response for successful registration
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 201,
        body: {
          user: {
            id: '456',
            username: 'newuser',
            email: 'new@example.com',
            profile_picture: null,
            bio: null,
            created_at: '2023-01-01T12:00:00Z',
            updated_at: '2023-01-01T12:00:00Z'
          },
          token: 'fake-jwt-token'
        }
      }).as('registerSuccess');
      
      // Fill in the form with new user details
      cy.get('input[name="username"]').type('newuser');
      cy.get('input[type="email"]').type('new@example.com');
      cy.get('input[type="password"]').type('password123');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Wait for the API call to complete
      cy.wait('@registerSuccess');
      
      // Check if we're redirected to the home page
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Check if the token is stored in localStorage
      cy.window().its('localStorage.token').should('exist');
    });
  });

  describe('Form Toggle', () => {
    it('should toggle between login and register forms', () => {
      // Initially in login mode
      cy.contains('h1', 'Login').should('be.visible');
      
      // Switch to register mode
      cy.contains('a', 'Register').click();
      cy.contains('h1', 'Register').should('be.visible');
      
      // Switch back to login mode
      cy.contains('a', 'Login').click();
      cy.contains('h1', 'Login').should('be.visible');
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', () => {
      // Password should be hidden by default
      cy.get('input[type="password"]').should('exist');
      
      // Click the eye icon to show password
      cy.get('button[aria-label="Toggle password visibility"]').click();
      
      // Password should now be visible
      cy.get('input[type="text"]').should('exist');
      
      // Click the eye icon again to hide password
      cy.get('button[aria-label="Toggle password visibility"]').click();
      
      // Password should be hidden again
      cy.get('input[type="password"]').should('exist');
    });
  });
}); 