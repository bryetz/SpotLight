describe('Radius Filter Interaction', () => {
  beforeEach(() => {
    // Mock the geolocation API
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

    // Mock the initial API response for posts with default radius
    cy.intercept('GET', '/api/posts*', {
      statusCode: 200,
      body: [
        {
          post_id: 1,
          username: 'testuser1',
          content: 'This is a post within default radius',
          latitude: 37.7749,
          longitude: -122.4194,
          created_at: '2023-01-01T12:00:00Z'
        },
        {
          post_id: 2,
          username: 'testuser2',
          content: 'This is another post within default radius',
          latitude: 37.7749,
          longitude: -122.4194,
          created_at: '2023-01-02T12:00:00Z'
        }
      ]
    }).as('getPostsDefaultRadius');

    // Visit the home page
    cy.visit('/');
    
    // Wait for the initial API call to complete
    cy.wait('@getPostsDefaultRadius');
  });

  it('should update posts when radius filter is changed', () => {
    // Open the filter panel
    cy.contains('button', 'Filter').click();
    
    // Verify the radius filter is visible
    cy.get('[data-testid="radius-filter"]').should('be.visible');
    
    // Verify the default radius is displayed (25km)
    cy.get('[data-testid="radius-filter"]').contains('25.0km');
    
    // Mock the API response for posts with a smaller radius
    cy.intercept('GET', '/api/posts*', {
      statusCode: 200,
      body: [
        {
          post_id: 3,
          username: 'nearbyuser',
          content: 'This is a post within smaller radius',
          latitude: 37.7749,
          longitude: -122.4194,
          created_at: '2023-01-03T12:00:00Z'
        }
      ]
    }).as('getPostsSmallerRadius');
    
    // Move the slider to change the radius
    // We need to target the actual slider element
    cy.get('[data-testid="radius-filter"] [role="slider"]')
      .focus()
      .type('{leftarrow}'.repeat(10)); // Move slider to the left to decrease radius
    
    // Wait for the API call with the new radius
    cy.wait('@getPostsSmallerRadius');
    
    // Verify the new posts are displayed
    cy.contains('This is a post within smaller radius').should('be.visible');
    cy.contains('nearbyuser').should('be.visible');
    
    // The old posts should not be visible anymore
    cy.contains('This is a post within default radius').should('not.exist');
    
    // Mock the API response for posts with a larger radius
    cy.intercept('GET', '/api/posts*', {
      statusCode: 200,
      body: [
        {
          post_id: 1,
          username: 'testuser1',
          content: 'This is a post within default radius',
          latitude: 37.7749,
          longitude: -122.4194,
          created_at: '2023-01-01T12:00:00Z'
        },
        {
          post_id: 2,
          username: 'testuser2',
          content: 'This is another post within default radius',
          latitude: 37.7749,
          longitude: -122.4194,
          created_at: '2023-01-02T12:00:00Z'
        },
        {
          post_id: 3,
          username: 'nearbyuser',
          content: 'This is a post within smaller radius',
          latitude: 37.7749,
          longitude: -122.4194,
          created_at: '2023-01-03T12:00:00Z'
        },
        {
          post_id: 4,
          username: 'faruser',
          content: 'This is a post only visible with larger radius',
          latitude: 37.8, // Slightly different location
          longitude: -122.5,
          created_at: '2023-01-04T12:00:00Z'
        }
      ]
    }).as('getPostsLargerRadius');
    
    // Move the slider to increase the radius
    cy.get('[data-testid="radius-filter"] [role="slider"]')
      .focus()
      .type('{rightarrow}'.repeat(20)); // Move slider to the right to increase radius
    
    // Wait for the API call with the new radius
    cy.wait('@getPostsLargerRadius');
    
    // Verify all posts are now visible
    cy.contains('This is a post within default radius').should('be.visible');
    cy.contains('This is another post within default radius').should('be.visible');
    cy.contains('This is a post within smaller radius').should('be.visible');
    cy.contains('This is a post only visible with larger radius').should('be.visible');
  });

  it('should handle empty results when radius is too small', () => {
    // Open the filter panel
    cy.contains('button', 'Filter').click();
    
    // Mock the API response for posts with a very small radius (no results)
    cy.intercept('GET', '/api/posts*', {
      statusCode: 200,
      body: [] // Empty array - no posts found
    }).as('getPostsNoResults');
    
    // Move the slider to set a very small radius
    cy.get('[data-testid="radius-filter"] [role="slider"]')
      .focus()
      .type('{leftarrow}'.repeat(30)); // Move slider all the way to the left
    
    // Wait for the API call with the new radius
    cy.wait('@getPostsNoResults');
    
    // Verify the "No posts yet" message is displayed
    cy.contains('No posts yet').should('be.visible');
  });

  it('should handle API errors when changing radius', () => {
    // Open the filter panel
    cy.contains('button', 'Filter').click();
    
    // Mock an API error response
    cy.intercept('GET', '/api/posts*', {
      statusCode: 500,
      body: { message: 'Internal server error' }
    }).as('getPostsError');
    
    // Move the slider to change the radius
    cy.get('[data-testid="radius-filter"] [role="slider"]')
      .focus()
      .type('{leftarrow}'.repeat(10));
    
    // Wait for the API call to fail
    cy.wait('@getPostsError');
    
    // Verify the error message is displayed
    cy.contains('Failed to fetch posts').should('be.visible');
  });
}); 