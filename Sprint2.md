
# Sprint 2 Report

## Completed Work
- **STORY9:** Added filtering for posts based on geolocation.
- **STORY10:** Developed a UI feature for choosing geolocation radius.
- **STORY11:** Implemented frontend unit tests and a Cypress end-to-end test.
- **STORY12:** Created backend tests using the Go testing suite and refactored backend code for modularity and properly fetching user id from the database. Also added functionality to delete users and posts through the API.
- **STORY19:** Update radius filter component for better styling.

## Planned/Future Work
- **STORY13:** Add like/dislike functionality to posts if you are logged in, both front/backend.
- **STORY14:** Add comment functionality to posts if you are logged in, both front/backend.
- **STORY15:** Support other types of media on posts in the frontend (Images).
- **STORY16:** Add support for storing image/video for all users (backend).
- **STORY17:** Add page limit/loading for posts frontend.
- **STORY18:** Add page limit for posts backend.


## Testing

### Frontend

#### Component Unit Tests:
- **TestLoginPage:** Verifies that the login form renders correctly and handles authentication responses.
- **TestSubmitPage:** Tests the post submission form functionality and validation.
- **TestFeed:** Validates the feed component's rendering, post loading, filtering capabilities, and error handling states.
- **TestPostCard:** Ensures proper rendering of post content, interaction handling (likes), and date/location formatting.
- **TestRadiusFilter:** Checks the radius filter slider functionality, value conversions, and callback handling.

#### Utility Unit Tests:
- **TestSliderFunctions:** Validates the utility functions for converting and formatting distance values used in the radius filter.
- **TestAPI:** Verifies API service functions, including endpoint calls and parameter handling.

#### Cypress End-to-End Tests:
- **AuthSpec:** Tests the authentication flow, including login, registration, and error handling.
- **HomePageSpec:** Verifies the home page functionality, including post loading and interaction with post content.
- **RadiusFilterSpec:** Validates the radius filter component’s integration with the feed.

### Backend

#### Database Unit Tests:
- **TestNewDBInterface:** Verifies that the database connection initializes correctly.
- **TestRegister:** Tests user registration.
- **TestAuthenticate:** Tests user authentication and retrieval of `user_id`.
- **TestPost:** Tests that a logged-in user can create a post.
- **TestDeleteUser:** Tests user deletion and cleanup of associated posts.
- **TestCloseDB:** Ensures the database connection closes properly.

#### API Unit Tests:
- **TestRegisterEndpoint:** Tests the `/api/register` endpoint for user registration.
- **TestLoginEndpoint:** Tests the `/api/login` endpoint for user login.
- **TestCreatePostEndpoint:** Tests the `/api/posts` endpoint for creating a post.
- **TestGetPostsEndpoint:** Tests the `/api/posts` endpoint for retrieving posts.
- **TestDeleteUserEndpoint:** Tests the `/api/delete-user` endpoint for deleting a user.
- **TestDeletePostEndpoint:** Tests the `/api/posts/{id}` endpoint for deleting a post.

## API Documentation

### Authentication

#### Register User
**Endpoint:** `POST /api/register`  
**Request Body:**  
```json
{  
"username": "exampleUser",  
"password": "examplePass"  
}
```  
**Response:**
```json
{ "message": "User registered successfully" }
```

#### Login User
**Endpoint:** `POST /api/login`  
**Request Body:**  
```json
{  
"username": "exampleUser",  
"password": "examplePass"  
}
```  
**Response:**  
```json
{  
"message": "Login successful",  
"user_id": 1  
}
```
#### Delete User
**Endpoint:** `DELETE /api/delete-user`  
**Request Body:**  
```json
{ "username": "exampleUser" }  
```
**Response:**  
```json
{ "message": "User deleted successfully" }
```
### Posts

#### Create Post
**Endpoint:** `POST /api/posts`  
**Request Body:**  
```json
{  
"user_id": 1,  
"content": "This is a test post",  
"latitude": 37.7749,  
"longitude": -122.4194  
} 
``` 
**Response:**  
```json
{ "message": "Post created successfully" }
```
#### Get Posts (with filtering)
**Endpoint:** `GET /api/posts?latitude={reqLatitude}&longitude={reqLongitude}&distance={distance}`  
**Response:**  
```json
{  
"post_id": 1,  
"username": "exampleUser",  
"content": "This is a test post",  
"latitude": 37.7749,  
"longitude": -122.4194,  
"created_at": "2024-03-03T12:00:00Z"  
}  
```

#### Delete Post
**Endpoint:** `DELETE /api/posts/{id}`  
**Response:**  
```json
{ "message": "Post deleted successfully" }
```

