# 📝 Mini Blog / Social Post App

A full-stack Node.js mini social media application where users can register, log in, create posts, like/unlike posts, and edit their content. Built as a learning project to understand authentication, database modeling, and server-side rendering.

---

## 📁 Project Structure

```
project-root/
├── app.js                  # Main Express server & all route definitions
├── models/
│   ├── user.js             # Mongoose User schema & model
│   └── post.js             # Mongoose Post schema & model
├── views/
│   ├── index.ejs           # Register page
│   ├── login.ejs           # Login page
│   ├── profile.ejs         # User dashboard (view & create posts)
│   └── edit.ejs            # Edit a specific post
├── package.json            # Project metadata & dependencies
└── .gitignore
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js | JavaScript server-side runtime |
| Framework | Express.js v5 | HTTP server, routing, middleware |
| Database | MongoDB | NoSQL document store |
| ODM | Mongoose | MongoDB schema modeling & queries |
| Templating | EJS | Server-side HTML rendering |
| Auth | JSON Web Token (JWT) | Stateless authentication via cookies |
| Password Hashing | bcrypt | Secure password storage |
| Cookie Parsing | cookie-parser | Read cookies from incoming requests |
| Dev Tool | nodemon | Auto-restart server on file changes |
| Styling | Tailwind CSS (CDN) | Utility-first styling in views |

---

## 🚀 Project Setup from Scratch

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running locally on port 27017)
- npm (comes with Node.js)

### Step 1 — Initialize the Project

```bash
mkdir mini-blog-app
cd mini-blog-app
npm init -y
```

This creates a `package.json` file with default settings.

### Step 2 — Install Dependencies

```bash
npm install express ejs mongoose jsonwebtoken bcrypt cookie-parser nodemon
```

### Step 3 — Set Up MongoDB Connection

MongoDB is connected inside `models/user.js`:

```javascript
mongoose.connect("mongodb://127.0.0.1:27017/miniproject");
```

Make sure your local MongoDB service is running before starting the app:

```bash
# On Linux/macOS
sudo systemctl start mongod
# or
mongod

# On Windows
net start MongoDB
```

### Step 4 — Start the Server

```bash
node app.js
# or with nodemon for auto-reload:
npx nodemon app.js
```

The server will start on **http://localhost:3000**

---

## 🗄️ Database Models

### User Model (`models/user.js`)

```
User {
  username: String,
  name:     String,
  age:      Number,
  email:    String,
  password: String (hashed),
  posts:    [ObjectId → Post]   ← references all posts by this user
}
```

### Post Model (`models/post.js`)

```
Post {
  user:    ObjectId → User      ← who created it
  date:    Date (default: now)
  content: String
  likes:   [ObjectId → User]    ← array of users who liked
}
```

The two models are related via MongoDB ObjectId references and use Mongoose's `.populate()` to hydrate the full documents when needed.

---

## 🔐 Authentication Flow

This app uses **JWT (JSON Web Token)** stored in an HTTP cookie for authentication.

### Registration (`POST /register`)

1. User submits name, username, age, email, and password.
2. Server checks if the email already exists — returns an error if so.
3. Password is hashed using `bcrypt.genSalt` + `bcrypt.hash`.
4. A new User document is created in MongoDB.
5. A JWT is signed with `{ email, userid }` and saved as a cookie named `token`.

### Login (`POST /login`)

1. User submits email and password.
2. Server finds the user by email — returns error if not found.
3. `bcrypt.compare` checks the submitted password against the stored hash.
4. If valid, a new JWT is signed and saved as the `token` cookie.
5. User is redirected to `/profile`.

### Logout (`GET /logout`)

Sets the `token` cookie to an empty string and redirects to `/login`.

### Protected Routes — `isLoggedIn` Middleware

```javascript
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.redirect("/login");
  } else {
    let data = jwt.verify(req.cookies.token, "shhh");
    req.user = data;
    next();
  }
}
```

Any route that requires a logged-in user passes through this middleware. It decodes the JWT and attaches the user payload (`email`, `userid`) to `req.user`.

> ⚠️ Note: The JWT secret `"shhh"` is hardcoded for development. In production, use an environment variable.

---

## 📌 Routes Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/register` | ❌ | Render registration form |
| POST | `/register` | ❌ | Create a new user account |
| GET | `/login` | ❌ | Render login form |
| POST | `/login` | ❌ | Authenticate user, set JWT cookie |
| GET | `/logout` | ❌ | Clear cookie, redirect to login |
| GET | `/profile` | ✅ | Show user profile and all their posts |
| POST | `/post` | ✅ | Create a new post |
| GET | `/like/:id` | ✅ | Toggle like/unlike on a post |
| GET | `/edit/:id` | ✅ | Render post edit form |
| POST | `/update/:id` | ✅ | Save updated post content |

---

## ⚙️ Feature Walkthrough

### Creating a Post

1. Authenticated user visits `/profile`.
2. Submits the textarea form — triggers `POST /post`.
3. Server creates a new `Post` document linked to the user's `_id`.
4. The post's `_id` is pushed into the `user.posts` array.
5. User is redirected back to `/profile`.

### Liking / Unliking a Post

Handled by `GET /like/:id` — a toggle mechanism:

```javascript
if (post.likes.indexOf(req.user.userid) === -1) {
  post.likes.push(req.user.userid);   // like it
} else {
  post.likes.splice(post.likes.indexOf(req.user.userid), 1);  // unlike it
}
```

The profile view checks this same condition to display "Like" or "Unlike" dynamically.

### Editing a Post

1. User clicks "Edit" on a post → `GET /edit/:id` renders the edit form pre-filled with existing content.
2. User submits → `POST /update/:id` saves the new content.
3. User is redirected to `/profile`.

### Post Deletion

Listed as a planned feature in `tasks.txt` but not yet implemented in the routes.

---

## 🖼️ Views (EJS Templates)

### `index.ejs` — Register Page
Form with fields: name, username, age, email, password. Posts to `/register`.

### `login.ejs` — Login Page
Form with email and password. Posts to `/login`.

### `profile.ejs` — User Dashboard
- Displays welcome message with the user's name.
- Textarea form to create new posts.
- Lists all posts in reverse chronological order (newest first).
- Each post shows: username, date, content, like count, and Like/Unlike + Edit buttons.

### `edit.ejs` — Edit Post
A single textarea pre-filled with the post's existing content. Posts to `/update/:id`.

---

## 📋 Tasks Checklist

From `tasks.txt` (original Hindi + English):

- [x] Users can write posts (`users post likh paaenge`)
- [x] Login and Register
- [x] Logout
- [x] Post creation
- [x] Post like / unlike
- [ ] Post delete ← not yet implemented

---

## 🔒 Security Notes

This is a learning/development project. For production use, consider:

- Store the JWT secret in an environment variable (`process.env.JWT_SECRET`).
- Use `httpOnly: true` and `secure: true` flags on cookies.
- Add input validation and sanitization (e.g., with `express-validator`).
- Handle MongoDB connection errors gracefully.
- Add CSRF protection for form submissions.
- Implement post delete with ownership verification.

---

## 📦 Dependencies Summary

```json
{
  "bcrypt": "^6.0.0",         // Password hashing
  "cookie-parser": "^1.4.7",  // Parse cookies from requests
  "ejs": "^5.0.1",            // Templating engine
  "express": "^5.2.1",        // Web framework
  "jsonwebtoken": "^9.0.3",   // JWT auth
  "nodemon": "^3.1.14"        // Dev auto-reload
}
```

> Note: `mongoose` is used in the models but should be added to `package.json` dependencies if not already present.

---

## 🧑‍💻 Author

Built as a mini full-stack project to practice Node.js, Express, MongoDB, JWT authentication, and EJS templating.
