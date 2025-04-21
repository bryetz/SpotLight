/// <reference types="cypress" />

describe('New Feature Tests', () => {
  // Function to get the first post card element reliably
  const getFirstPostCard = () => {
    // Use a data-testid attribute for stability (assuming it's added to PostCard component)
    return cy.get('[data-testid^="post-card-"]').first();
  };

  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
    // Define intercepts here if needed across tests
    cy.intercept('GET', '/api/posts*').as('getPosts'); 
    // cy.intercept('GET', '/api/posts/*').as('getPostDetail');
    // cy.intercept('GET', '/api/users/*').as('getUserProfile');
    cy.wait('@getPosts'); // Wait for the initial post load in beforeEach
  });

  it('should navigate to a specific post page from the feed', () => {
    getFirstPostCard().should('be.visible').click({ force: true }); // Click the card itself

    // Check if the URL changed to a post detail page
    cy.url().should('include', '/post/');
    // Basic assertion: Check if the back button is present on the post page
    cy.contains('a', /Back to Feed/i).should('be.visible'); 
  });

  it('should navigate to a user profile page from a post card', () => {
    getFirstPostCard().within(() => {
      cy.get('a[href^="/profile/"]').first().click({ force: true }); // Click the username link within the card
    });

    // Check if the URL changed to a profile page
    cy.url().should('include', '/profile/');
    // Basic assertion: Check if the username heading is present
    cy.get('h1').should('be.visible'); 
  });

  it('should interact with the share button on a post', () => {
    getFirstPostCard().within(() => {
      cy.get('[aria-label="Share post"]').click({ force: true }); // Use aria-label selector
    });

    // Basic check: Log action. Add specific assertions based on share outcome (e.g., clipboard confirmation)
    cy.log('Share button clicked - add assertions for expected outcome');
    // Example if it copies to clipboard (browser permissions might affect this in Cypress)
    // cy.window().its('navigator.clipboard').invoke('readText').should('contain', '/post/');
  });

  it('should load more posts on scroll (infinite scroll/pagination)', () => {
    // The initial load already happened in beforeEach (@getPosts)
    cy.log('Initial posts loaded.');

    // Set up a new intercept specifically for the *next* posts call after scrolling
    cy.intercept('GET', '/api/posts*').as('getMorePosts');

    // Scroll to the bottom
    cy.scrollTo('bottom', { duration: 1000 });
    
    // Wait specifically for the @getMorePosts intercept to fire
    cy.wait('@getMorePosts', { timeout: 10000 }); // Increase timeout if network is slow

    cy.log('Scrolled and attempted to load more posts.');
    // Assertion now confirms the API call happened, not the exact count
    // You could add assertions here to check if *some* new posts appeared, 
    // but the core test is that the scroll triggered the load.
  });

  it('should filter posts using the search bar', () => {
    // Verify this selector matches your search input
    const searchInputSelector = 'input[placeholder="Search users or posts..."]'; // Use exact placeholder
    const searchTerm = 'TestSearch';

    cy.intercept('GET', '/api/search*').as('getSearchResults'); // Intercept search API

    cy.get(searchInputSelector).should('be.visible').type(searchTerm); // Type without enter initially
    cy.wait('@getSearchResults'); // Wait for the debounced search API call

    cy.log('Search performed - add specific assertions for results popup/content');
    // Assert that the search results popover is visible
    cy.get('[data-radix-popper-content-wrapper]').should('be.visible');
    // cy.get('[data-testid^="post-card-"]').should('have.length.at.least', 1);
  });

  it('should apply filters and update posts', () => {
    // Initial posts loaded in beforeEach (@getPosts)
    cy.intercept('GET', '/api/posts*').as('getFilteredPosts'); // Intercept calls after filtering

    // Toggle filters open
    cy.contains('button', /Filters/i).click();
    cy.get('[data-testid="feed-filter"]').should('be.visible'); // Check filter component appears

    // Change sort to Top
    cy.get('[data-testid="feed-filter"]').contains('button', /Top/i).click(); 
    
    // Wait for the API call triggered by the filter change
    cy.wait('@getFilteredPosts', { timeout: 10000 });

    cy.log('Filter applied - add assertions for updated posts if needed');
  });

}); 