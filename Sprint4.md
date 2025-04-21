# Sprint 4 Report

## Completed Work
- **STORY18: Profile pages** – Added user profile views and endpoint to retrieve user info + their posts.
- **STORY19: Sharing post links** – Implemented unique post retrieval via `/api/posts/{id}` for link sharing.
- **STORY20: Direct messaging** – Built DM system with REST + WebSocket support for sending/receiving messages.
- **STORY21: Various improvements** – Implemented Infinite Scroll, Search, and Advanced Filtering.

## Testing

### Frontend

#### Component Unit Tests:
- **TestLoginPage:** Verifies that the login form renders correctly and handles authentication responses.
- **TestSubmitPage:** Tests the post submission form functionality and validation.
- **TestFeed:** Validates the feed component's rendering, post loading/pagination, new filtering capabilities, and error handling states. Also tests image/media displaying, likes, and comments.
- **TestPostCard:** Ensures proper rendering of post content, interaction handling such as likes and comments and sharing, and date/location formatting.

#### Utility Unit Tests:
- **TestSliderFunctions:** Validates the utility functions for converting and formatting distance values used in the radius filter.
- **TestAPI:** Verifies API service functions, including endpoint calls and parameter handling.

#### Cypress End-to-End Tests:
- **AuthSpec:** Tests the authentication flow, including login, registration, and error handling.
- **HomePageSpec:** Verifies the home page functionality, including post loading and interaction with post content.
- **NewFeaturesSpecs:** Tests the functionality of the newly implemented features, including post sharing, infinite scrolling, searching, profiles, and DMs.
- **PostInteractionsSpec:** Verifies the feed displays posts and interaction buttons correctly.
- **SubmitPostSpec:** Tests the post submission flow, including logging in, adding text and media to a post, and submitting.

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
- **TestCreatePostFileEndpoint:** Tests the `/api/posts` endpoint for creating a post with media.
- **TestGetPostsEndpoint:** Tests the `/api/posts` endpoint for retrieving posts.
- **TestGetPostFileEndpoint:** Tests the `/api/file` endpoint for retrieving media content.
- **TestDeleteUserEndpoint:** Tests the `/api/delete-user` endpoint for deleting a user.
- **TestDeletePostEndpoint:** Tests the `/api/posts/{id}` endpoint for deleting a post.
- **TestLikePost:** Tests liking a post.
- **TestDoubleLikePost:** Tests trying to like a post twice.
- **TestUnlikePost:** Tests unliking a post.
- **TestDoubleUnlikePost:** Tests unliking a post that hasn't been liked.
- **TestCreateTopLevelComment:** Tests creating a top-level comment.
- **TestCreateReplyComment:** Tests replying to a comment.
- **TestGetNestedComments:** Tests retrieving nested comments.
- **TestDeleteCommentAndReplies:** Tests recursive deletion of a comment and its children.
- **TestGetPostByIdEndpoint:** Verifies retrieval of a specific post via `/api/posts/{id}`. Ensures correct post content, ID, and user metadata.
- **TestGetProfilePostsEndpoint:** Tests `/api/profile/{id}` to ensure the returned object includes user profile data and only their associated posts.
- **TestSendDMEndpoint:** Verifies that messages can be sent via the `/api/dm/send` endpoint with valid user IDs and content.
- **TestGetDMHistoryEndpoint:** Ensures `/api/dm/history` returns all messages between two users in correct order.
- **TestGetDMHistoryEndpointAdvanced:** Tests multi-directional DM conversations and validates message order, sender/receiver correctness, and persistence.

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

#### Create Post with Media
**Endpoint:** `POST /api/posts`  
**Request Body:**
```json
{  
  "user_id": 1,  
  "content": "This is a test post with file",  
  "file_name": "file.txt",  
  "media": "file content",  
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
[
  {  
    "post_id": 1,  
    "username": "exampleUser",  
    "content": "This is a test post",  
    "latitude": 37.7749,  
    "longitude": -122.4194,  
    "created_at": "2024-03-03T12:00:00Z",  
    "file_name": "file.txt",  
    "like_count": 0  
  }
]
```

#### Delete Post
**Endpoint:** `DELETE /api/posts/{id}`  
**Response:**
```json
{ "message": "Post deleted successfully" }
```

#### Get Specific Post
**Endpoint:** `GET /api/posts/{id}`  
**Response:**
```json
{
  "post_id": 1,
  "username": "exampleUser",
  "content": "This is a test post",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "created_at": "2024-03-03T12:00:00Z",
  "file_name": "file.txt",
  "like_count": 0
}
```

### Likes

#### Like a Post
**Endpoint:** `POST /api/posts/{id}/like`  
**Request Body:**
```json
{  
  "user_id": 1,  
  "post_id": 1  
}
```
**Response:**
```json
{ "message": "Post liked successfully" }
```

#### Unlike a Post
**Endpoint:** `POST /api/posts/{id}/unlike`  
**Request Body:**
```json
{  
  "user_id": 1,  
  "post_id": 1  
}
```
**Response:**
```json
{ "message": "Post unliked successfully" }
```

#### Get Post Likes
**Endpoint:** `GET /api/posts/{id}/likes`  
**Response:**
```json
{
  "post_id": 1,
  "usernames": ["exampleUser"]
}
```

#### Check if Post is Liked by User
**Endpoint:** `GET /api/posts/{id}/liked?userId={userId}`  
**Response:**
```json
{ "result": true }
```

### Comments

#### Create Comment
**Endpoint:** `POST /api/posts/{id}/comments`  
**Request Body (top-level comment):**
```json
{  
  "user_id": 1,  
  "content": "test comment"  
}
```
**Request Body (reply comment):**
```json
{  
  "user_id": 1,  
  "content": "reply to comment",  
  "parent_id": 10  
}
```
**Response:**
```json
{ "message": "Comment posted" }
```

#### Get Nested Comments
**Endpoint:** `GET /api/posts/{id}/comments`  
**Response:**
```json
  {
    "comment_id": 10,
    "username": "exampleUser",
    "content": "test comment",
    "created_at": "2024-03-03T12:00:00Z",
    "replies": [
      {
        "comment_id": 11,
        "username": "exampleUser",
        "content": "reply to comment",
        "created_at": "2024-03-03T12:01:00Z",
        "parent_id": 10
      }
    ]
  }
```

#### Delete Comment
**Endpoint:** `DELETE /api/comments/{id}`  
**Response:**
```json
{ "message": "Comment deleted" }
```

### Files

#### Get Post File
**Endpoint:** `GET /api/file?userId=1&postId=1&fileName=file.txt`  
**Response:** Binary file content served as file attachment with correct `Content-Type` and `Content-Disposition` headers.

### Profiles

#### Get Profile Page

**Endpoint:** `GET /api/profile/{id}`
**Response:**
```json
{
  "user": {
    "user_id": 1,
    "username": "exampleUser"
  },
  "posts": [
    {
      "post_id": 1,
      "content": "First post",
      "created_at": "2024-03-03T12:00:00Z",
      "file_name": null,
      "like_count": 3
    }
  ]
}


```

### Direct Messaging

#### Send Direct Message
**Endpoint:** `POST /api/dm/send`  
**Request Body:**  
```json
{  
    "sender_id": 1,  
    "receiver_id": 2,  
    "content": "Hey there!"  
}
```

**Response:**  
```json
{ "message": "Message sent" }
```

#### Get DM History
**Endpoint:** `GET /api/dm/history?sender_id=1&receiver_id=2`  
**Response:** 
```json
{  
    "message_id": 1,  
    "sender_id": 1,  
    "receiver_id": 2,  
    "content": "Hey there!",  
    "created_at": "2025-04-21T14:00:00Z"  
}
```

#### WebSocket Messaging
**Endpoint:** `GET /ws?user_id=1`  
**Client Payload:**  
```json
{  
    "from": 1,  
    "to": 2,  
    "content": "Live message!"  
}  
```
