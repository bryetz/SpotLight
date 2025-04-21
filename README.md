# SpotLight

## Preview

![App in Action](Preview_Filter_Image.png "Filter Image")
![App in Action](Preview_Image.png "Preview Image")

## About

A geolocation-based platform for sharing and discovering posts tied to places around you. It's a social media app where users share updates, memes, and media to friends in their area!

## How to Build and Run

### Database Setup:

#### Defualt .env file:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
PORT=8080
```
Update the url according to your database name and password. Additionally, copy and place the .env file in `backend/`, `backend/testing/backend`, and `backend/testing/database`.

* Make sure you have PostgreSQL installed and in your path for linux/mac/windows
* Create all the PostgreSQL tables outlined later in this readme
* Put the .env file in the three locations to run the web app and test accordingly


### For the backend:
* ```cd backend```
* ```go build -o ./server.exe ./src```
* ```./server.exe```

### For the frontend:
* ```cd frontend```
* ```npm install```
* ```npm run dev```

## For Running Backend Tests:
#### All Unit Tests:
* ```cd backend/testing/backend```
* ```go test .```
* ```cd backend/testing/database```
* ```go test .```

## For running Frontend Tests:
#### Unit Tests:
* ```cd frontend```
* ```npm test```

#### Cypress Tests:
* ```cd frontend```
* ```npx cypress open```
* Select test to run in the GUI

## PostgreSQL Tables to Enable the Web App

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
### Posts Table
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_name VARCHAR(255) NOT NULL DEFAULT '',
    like_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Post likes Table
```sql
CREATE TABLE post_likes (
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);
```

### Comments Table
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Members

* Boris Russanov
* Bryan Etzine
* Kevin Wagner