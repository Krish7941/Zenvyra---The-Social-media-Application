# 🌐 Zenvyra — The Social Media Application

> A full-stack social media web application built with Node.js, Express, MongoDB, and EJS — enabling users to register, log in, create posts, like/unlike content, and edit their work. Built as a hands-on learning project covering authentication, database modeling, and server-side rendering.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Pages & Views](#-pages--views)
- [Database Models](#-database-models)
- [Authentication Flow](#-authentication-flow)
- [API Routes Reference](#-api-routes-reference)
- [Feature Walkthroughs](#-feature-walkthroughs)
- [Getting Started](#-getting-started)
- [Security Notes](#-security-notes)
- [Dependencies](#-dependencies)
- [Planned Features](#-planned-features)
- [Author](#-author)

---

## 🔭 Overview

**Zenvyra** is a mini social media platform where authenticated users can:

- Register and log in securely
- Create text-based posts visible on their profile
- Like or unlike posts interactively
- Edit their existing posts
- Log out safely with session clearing

The app follows a classic **MVC (Model-View-Controller)** pattern — models live in `/models`, views in `/views`, and all controller logic is handled inside `app.js`.

---

## 🛠️ Tech Stack

| Layer              | Technology              | Purpose                                           |
|--------------------|-------------------------|---------------------------------------------------|
| **Runtime**        | Node.js (v18+)          | JavaScript server-side execution environment      |
| **Framework**      | Express.js v5           | HTTP server, routing, and middleware management   |
| **Database**       | MongoDB (local)         | NoSQL document-oriented database                  |
| **ODM**            | Mongoose                | Schema modeling, validation, and MongoDB queries  |
| **Templating**     | EJS (Embedded JS) v5    | Dynamic server-side HTML rendering                |
| **Authentication** | JWT (jsonwebtoken)      | Stateless, cookie-based user session management   |
| **Password Hash**  | bcrypt v6               | Secure hashing and comparison of passwords        |
| **Cookie Parsing** | cookie-parser           | Reading and writing HTTP cookies in Express       |
| **Styling**        | Tailwind CSS (CDN)      | Utility-first CSS framework for responsive UI     |
| **Dev Tool**       | nodemon                 | Auto-restart server on file changes during dev    |

---

## 📁 Project Structure

```
Zenvyra---The-Social-media-Application/
│
├── app.js                        # Main entry point: Express server, all routes & middleware
│
├── models/
│   ├── user.js                   # Mongoose schema & model for User
│   └── post.js                   # Mongoose schema & model for Post
│
├── views/
│   ├── index.ejs                 # Registration page (sign-up form)
│   ├── login.ejs                 # Login page (sign-in form)
│   ├── profile.ejs               # User dashboard (view posts, create post)
│   └── edit.ejs                  # Edit a specific post
│
├── public/
│   └── images/
│       └── uploads/              # Directory for uploaded image assets
│
├── utils/                        # Utility/helper functions (e.g., token helpers)
│
├── tasks.txt                     # Developer notes & feature checklist
├── package.json                  # Project metadata and npm dependencies
├── package-lock.json             # Locked dependency versions
└── .gitignore                    # Files/folders excluded from Git
```

---

## 🖥️ Pages & Views

### 1. `index.ejs` — Registration Page

**Route:** `GET /register`

This is the **entry page** for new users who want to create an account on Zenvyra.

**What it contains:**
- A registration form with the following input fields:
  - **Full Name** — The user's display name shown across the platform
  - **Username** — A unique handle for the account
  - **Age** — Stored as a numeric value in the database
  - **Email** — Used for login authentication (must be unique)
  - **Password** — Entered in plaintext, hashed before storage
- A submit button that sends a `POST` request to `/register`
- A link redirecting existing users to the login page

**What happens on submit:**
1. The server checks if a user with that email already exists.
2. If duplicate email → an error is returned.
3. If new → the password is hashed with bcrypt, a User document is saved, a JWT is issued, and the user is redirected to `/profile`.

---

### 2. `login.ejs` — Login Page

**Route:** `GET /login`

The **sign-in page** for returning users to access their account.

**What it contains:**
- A login form with:
  - **Email** — The registered email address
  - **Password** — The account password
- A submit button sending a `POST` request to `/login`
- A link to register a new account

**What happens on submit:**
1. The server looks up the user by email.
2. If not found → error message is shown.
3. If found → bcrypt compares the submitted password against the stored hash.
4. On success → a JWT is created and stored as a cookie (`token`), and the user is redirected to `/profile`.
5. On failure → an "incorrect password" error is returned.

---

### 3. `profile.ejs` — User Dashboard

**Route:** `GET /profile` *(Protected — requires login)*

This is the **main hub** of the application — the page users see after logging in.

**What it contains:**

- **Welcome Banner:** Displays the logged-in user's name (e.g., "Welcome, Krish!")
- **Post Creation Form:**
  - A `<textarea>` where users can write a new post
  - A "Post" button that sends a `POST` request to `/post`
- **Post Feed:**
  - All posts created by the user, displayed in reverse chronological order (newest first)
  - Each post card shows:
    - **Author username**
    - **Date & time** the post was created
    - **Post content** (the text body)
    - **Like count** — total number of users who liked the post
    - **Like / Unlike button** — toggles dynamically based on whether the current user has liked the post
    - **Edit button** — links to `GET /edit/:id` for that specific post

**Key logic in this view:**
- EJS conditionally renders "Like" or "Unlike" by checking if the current user's ID exists in the post's `likes` array.
- Posts are populated with the author's user data using Mongoose's `.populate()`.

---

### 4. `edit.ejs` — Edit Post Page

**Route:** `GET /edit/:id` *(Protected — requires login)*

A focused, single-purpose page that lets users **modify an existing post**.

**What it contains:**
- A `<textarea>` pre-filled with the current content of the selected post
- A "Save" / "Update" button that submits a `POST` request to `/update/:id`
- A cancel option to return to the profile without saving

**What happens on submit:**
1. The server receives the updated content via `POST /update/:id`.
2. The post document is fetched by its `_id` from MongoDB.
3. The `content` field is updated and saved.
4. The user is redirected back to `/profile`.

---

## 🗄️ Database Models

### User Model (`models/user.js`)

Represents a registered user account.

```js
{
  username: String,          // Unique handle (e.g., "@krish")
  name:     String,          // Display name (e.g., "Krish Patel")
  age:      Number,          // User's age
  email:    String,          // Login email (must be unique)
  password: String,          // bcrypt-hashed password
  posts:    [ObjectId]       // Array of references to Post documents
}
```

- The `posts` array stores `ObjectId` references to all posts created by this user.
- When rendering the profile, these are **populated** using `User.findOne(...).populate('posts')` to retrieve full post details.

---

### Post Model (`models/post.js`)

Represents a single social post.

```js
{
  user:    ObjectId,         // Reference to the User who created this post
  date:    Date,             // Automatically set to Date.now() on creation
  content: String,           // The text body of the post
  likes:   [ObjectId]        // Array of User IDs who have liked this post
}
```

- The `likes` array is a collection of `ObjectId` references to users who liked the post.
- Like/Unlike toggling is done by checking whether the current user's ID is already in this array.
- The `user` field enables reverse lookup — which user authored which post.

---

## 🔐 Authentication Flow

Zenvyra uses **JWT (JSON Web Token)** stored in an HTTP cookie for stateless session management.

### Registration Flow

```
Client fills form → POST /register
  → Check if email exists (if yes: return error)
  → Hash password with bcrypt
  → Create User in MongoDB
  → Sign JWT { email, userid }
  → Set cookie: token = JWT
  → Redirect to /profile
```

### Login Flow

```
Client fills form → POST /login
  → Find user by email (if not found: return error)
  → bcrypt.compare(submittedPassword, storedHash)
  → If mismatch: return error
  → Sign new JWT { email, userid }
  → Set cookie: token = JWT
  → Redirect to /profile
```

### Logout Flow

```
GET /logout
  → Set cookie: token = "" (empty string)
  → Redirect to /login
```

### `isLoggedIn` Middleware

All protected routes pass through this middleware before their handler runs:

```js
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.redirect("/login");        // No token → force login
  } else {
    let data = jwt.verify(req.cookies.token, "shhh");
    req.user = data;               // Attach decoded payload to request
    next();                        // Proceed to route handler
  }
}
```

`req.user` will contain `{ email, userid }` — the userid is used throughout the app to identify the current user.

> ⚠️ **Note:** The JWT secret `"shhh"` is hardcoded for development. In production, always use `process.env.JWT_SECRET`.

---

## 📌 API Routes Reference

| Method | Route           | Auth Required | Description                                         |
|--------|-----------------|:-------------:|-----------------------------------------------------|
| GET    | `/register`     | ❌            | Renders the registration form (`index.ejs`)         |
| POST   | `/register`     | ❌            | Handles new user creation, hashing, and JWT issue   |
| GET    | `/login`        | ❌            | Renders the login form (`login.ejs`)                |
| POST   | `/login`        | ❌            | Verifies credentials, issues JWT cookie             |
| GET    | `/logout`       | ❌            | Clears JWT cookie, redirects to login               |
| GET    | `/profile`      | ✅            | Renders the user's dashboard with their posts       |
| POST   | `/post`         | ✅            | Creates a new Post document linked to the user      |
| GET    | `/like/:id`     | ✅            | Toggles like/unlike on a post by its ID             |
| GET    | `/edit/:id`     | ✅            | Renders the edit form pre-filled with post content  |
| POST   | `/update/:id`   | ✅            | Saves the updated post content to MongoDB           |

---

## ⚙️ Feature Walkthroughs

### ✏️ Creating a Post

1. User visits `/profile` (must be logged in).
2. Types content in the textarea and clicks "Post".
3. `POST /post` is triggered.
4. Server creates a new `Post` document with `{ user: req.user.userid, content: req.body.content }`.
5. The new post's `_id` is pushed into `user.posts`.
6. Both the post and user documents are saved.
7. User is redirected to `/profile` where the new post appears at the top.

---

### ❤️ Like / Unlike a Post

The `GET /like/:id` route implements a **toggle pattern**:

```js
if (post.likes.indexOf(req.user.userid) === -1) {
  post.likes.push(req.user.userid);   // User hasn't liked → Like it
} else {
  post.likes.splice(post.likes.indexOf(req.user.userid), 1);  // Already liked → Unlike it
}
await post.save();
```

- The profile view reflects this: if the current user's ID is in `post.likes`, the button shows "Unlike"; otherwise it shows "Like".
- The like count is simply `post.likes.length`.

---

### 🖊️ Editing a Post

1. User clicks "Edit" on a post on the profile page.
2. `GET /edit/:id` fetches the post by its `_id` and renders `edit.ejs` with the post content pre-filled.
3. User edits the content and submits.
4. `POST /update/:id` updates the post's `content` field in MongoDB and saves.
5. User is redirected to `/profile`.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) running locally on port `27017`
- npm (included with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Krish7941/Zenvyra---The-Social-media-Application.git
cd Zenvyra---The-Social-media-Application

# 2. Install all dependencies
npm install

# 3. Start MongoDB (if not already running)
# Linux/macOS:
sudo systemctl start mongod
# Windows:
net start MongoDB

# 4. Start the development server
node app.js
# OR with auto-reload:
npx nodemon app.js
```

### Access the App

Open your browser and visit:

```
http://localhost:3000
```

You'll land on the registration page. Create an account and start exploring!

---

## 🔒 Security Notes

This project is designed for **learning purposes**. Before deploying to production, consider the following improvements:

| Issue | Recommendation |
|-------|----------------|
| Hardcoded JWT secret (`"shhh"`) | Move to `process.env.JWT_SECRET` via a `.env` file |
| Plain HTTP cookies | Set `httpOnly: true` and `secure: true` on cookie options |
| No input validation | Add `express-validator` for sanitizing and validating all form inputs |
| No error handling for DB | Wrap Mongoose calls in `try/catch` and return proper error responses |
| No CSRF protection | Use `csurf` middleware for form submission protection |
| No post ownership check on edit | Verify `post.user === req.user.userid` before allowing edits |
| Password not rate-limited | Add `express-rate-limit` to `/login` to prevent brute-force attacks |

---

## 📦 Dependencies

```json
{
  "bcrypt": "^6.0.0",          // Secure password hashing
  "cookie-parser": "^1.4.7",   // Parse cookies from HTTP requests
  "ejs": "^5.0.1",             // EJS templating engine for server-side rendering
  "express": "^5.2.1",         // Web application framework
  "jsonwebtoken": "^9.0.3",    // JWT creation and verification
  "mongoose": "*",             // MongoDB object modeling (ODM)
  "nodemon": "^3.1.14"         // Dev tool: auto-restart on file changes
}
```

> **Note:** Tailwind CSS is loaded via CDN in EJS templates — no build step needed.

---

## 📋 Planned Features

From `tasks.txt`:

- [x] User Registration
- [x] User Login
- [x] User Logout
- [x] Create Posts
- [x] Like / Unlike Posts
- [x] Edit Posts
- [ ] **Delete Posts** *(not yet implemented)*
- [ ] User profile pictures / image uploads
- [ ] Comment on posts
- [ ] Follow / unfollow other users
- [ ] Public feed showing posts from followed users

---

## 🧑‍💻 Author

**Krish** — [@Krish7941](https://github.com/Krish7941)

Built as a full-stack mini project to practice:
- Node.js & Express.js server development
- MongoDB database design with Mongoose
- JWT-based authentication with cookie sessions
- EJS server-side templating
- Tailwind CSS for rapid UI styling

---

> ⭐ If you found this project helpful or interesting, consider starring the repo!