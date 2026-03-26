const express = require('express');
const app = express();
const userModel = require('./models/user');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const postModel = require('./models/post');
const user = require('./models/user');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/register', (req, res) => {
    res.render("index.ejs");
});
app.get('/login', async (req, res) => {
    let totalPosts = await postModel.countDocuments();
    let activeWriters = await userModel.countDocuments({posts: {$exists: true, $not: {$size: 0}}});
    res.render("login.ejs", { totalPosts, activeWriters });
});

app.get('/feed', isLoggedIn, async (req, res) => {
    let posts = await postModel.find()
        .populate("user")   // kisne post kiya
        .sort({ _id: -1 }); // latest first

    let user = await userModel.findOne({ email: req.user.email });
    res.render("feed", { posts, user, activePage: "feed" });
});

app.get('/profile', isLoggedIn , async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile", {user, activePage: "profile"});
});

app.get('/like/:id', isLoggedIn , async (req, res) => {
    let post = await postModel.findById(req.params.id).populate("user");
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect("/profile");    
});

app.get('/edit/:id', isLoggedIn , async (req, res) => {
    let post = await postModel.findById(req.params.id).populate("user");
    
    res.render("edit", {post});
});
    
app.post('/update/:id', isLoggedIn , async (req, res) => {
    let post = await postModel.findById(req.params.id).populate("user");
    post.content = req.body.content;
    await post.save();
    res.redirect("/profile");
});
app.post('/post', isLoggedIn , async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;

    let post = await postModel.create({
        user:user._id,
        content: content
    });
    
    user.posts.push(post._id);
    await user.save();
    return res.redirect("/profile");
});

app.post('/register', async (req, res) => {
    let { name, username, age, email, password } = req.body;
    let user = await userModel.findOne({email});
    if(user){
        return res.status(500).redirect("/register")
        
    }
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt,async (err, hash) => {
            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            })
            let token = jwt.sign({email:email , userid: user._id},"shhh");
            res.cookie("token", token);
            res.redirect("/login");
        });
    });
});

app.post('/login', async (req, res) => {
    let {email, password } = req.body;
    let user = await userModel.findOne({email});
    if(!user){
        return res.status(500).json({error: "User not found"});
    }
    bcrypt.compare(password, user.password, function (err, result){
        if(result){
            let token = jwt.sign({email:email , userid: user._id},"shhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        }
        else{
            res.redirect("/login");
        }
    });
});

app.get('/logout', (req, res) => {
    res.cookie("token", "")
    res.redirect("/login");
});

app.post('/delete/:id', isLoggedIn , async (req, res) => {
    let post = await postModel.findById(req.params.id).populate("user");
    await postModel.findByIdAndDelete(req.params.id);
    if(post.user.posts.indexOf(req.params.id) !== -1){
        post.user.posts.splice(post.user.posts.indexOf(req.params.id), 1);
        await post.user.save();
    }
    await user.save();
    
    res.redirect("/profile");
});


function isLoggedIn(req, res, next){
    if(req.cookies.token === ""){
        res.redirect("/login");
    }
    else{
        let data = jwt.verify(req.cookies.token, "shhh");
        req.user = data;
        next();
    }
}

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});