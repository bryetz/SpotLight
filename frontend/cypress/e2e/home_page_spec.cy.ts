describe('Home Page', () => {
	beforeEach(() => {
	  // Mock API
	  cy.window().then((win) => {
		cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
		  return cb({
			coords: {
			  latitude: 37.7749,
			  longitude: -122.4194
			}
		  });
		});
	  });
  
	  // Mock the API response for posts
	  cy.intercept('GET', '/api/posts*', {
		statusCode: 200,
		body: [
		  {
			post_id: 1,
			username: 'testuser1',
			content: 'This is a test post 1',
			latitude: 37.7749,
			longitude: -122.4194,
			created_at: '2023-01-01T12:00:00Z'
		  },
		  {
			post_id: 2,
			username: 'testuser2',
			content: 'This is a test post 2',
			latitude: 37.7749,
			longitude: -122.4194,
			created_at: '2023-01-02T12:00:00Z'
		  }
		]
	  }).as('getPosts');
  
	  // Visit the home page
	  cy.visit('/');
	});
  
	it('should load the home page and display posts', () => {
	  // Wait for the API call to complete
	  cy.wait('@getPosts');
  
	  // Check if the page title is visible
	  cy.contains('h1', 'Feed').should('be.visible');
  
	  // Check if the filter button is visible
	  cy.contains('button', 'Filter').should('be.visible');
  
	  // Check if posts are displayed
	  cy.contains('This is a test post 1').should('be.visible');
	  cy.contains('This is a test post 2').should('be.visible');
  
	  // Check if usernames are displayed
	  cy.contains('testuser1').should('be.visible');
	  cy.contains('testuser2').should('be.visible');
	});
  
	it('should show loading state before posts are loaded', () => {
	  // Create a delayed intercept to see loading state
	  cy.intercept('GET', '/api/posts*', {
		statusCode: 200,
		body: [
		  {
			post_id: 1,
			username: 'testuser1',
			content: 'This is a test post 1',
			latitude: 37.7749,
			longitude: -122.4194,
			created_at: '2023-01-01T12:00:00Z'
		  }
		],
		delay: 1000 // Add a 1-second delay
	  }).as('getPostsDelayed');
  
	  // Reload the page to trigger the delayed intercept
	  cy.visit('/');
  
	  // Check if loading indicator is visible
	  cy.get('[data-testid="loader-icon"]').should('be.visible');
  
	  // Wait for the API call to complete
	  cy.wait('@getPostsDelayed');
  
	  // Check if posts are displayed after loading
	  cy.contains('This is a test post 1').should('be.visible');
	});
  
  });