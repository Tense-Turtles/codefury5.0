var express = require('express');
var cors = require('cors')
var app = express();
app.use(cors({ optionsSuccessStatus: 200 }))
var path = require('path');
global.appRoot = path.resolve(__dirname);
const bcrypt = require("bcrypt")
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const saltRounds = 10;
require('dotenv').config()
const mySecret = process.env['MONGO_URI']
const mongoose = require('mongoose');
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true })
//     , function (err) {
//     for (var i in mongoose.connection.collections.users) {
//         console.log(mongoose.connection.collections.users[i]);
//         // will drop collection here
//     }
//     done();
// });





const cheerio = require('cheerio');
var fs = require('fs');

const multer = require('multer');
const { doesNotMatch } = require('assert');
const { time } = require('console');
const { json } = require('body-parser');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


fs.mkdir(appRoot + "/public/temp/community", { recursive: true }, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Temp Directory created successfully !!");
    }
});
fs.mkdir(appRoot + "/public/temp/profiles", { recursive: true }, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Temp Directory created successfully !!");
    }
});


app.get('/', function (req, res) {
    if (Username == null) {
        res.sendFile(__dirname + '/index.html');
    }
    else {
        const $ = cheerio.load(fs.readFileSync('index.html'));
        $('#authContainer').remove();
        $('#hero-section').append('<h4>Welcome, ' + Username + ' !</h4>')
        res.send($.html());
    }

})

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/allMentors', function (req, res) {
    res.sendFile(__dirname + '/frontend/Mentorship/mentors.html');
})

var Username;

var userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    joined: { type: Date, default: Date.now },
}, { collection: 'users' });

const User = mongoose.model("User", userSchema);

app.post("/register", upload.none(), async (req, res) => {
    // console.log(req.body);
    const $ = cheerio.load(fs.readFileSync('index.html'));
    try {
        var hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
        // console.log(hashedPwd);
        const insertResult = await User.create({
            username: req.body.username,
            password: hashedPwd,
        });
        Username = req.body.username;
        $('#authContainer').remove();
        $('#hero-section').append('<h4>Welcome ' + Username + ' ! <br>You have successfully registered</h4>')
        res.send($.html());
    } catch (error) {
        console.log(error);
        res.status(500).send("Try with a different username");
    }

});
app.post("/login", upload.none(), async (req, res) => {
    // console.log(req.body)
    const $ = cheerio.load(fs.readFileSync('index.html'));

    try {
        const user = await User.findOne({ username: req.body.username });
        console.log(user);
        if (user) {
            const cmp = await bcrypt.compare(req.body.password, user.password);
            if (cmp) {
                //   ..... further code to maintain authentication like jwt or sessions
                Username = req.body.username;
                $('#authContainer').remove();
                $('#hero-section').append('<h4>Welcome ' + Username + ' !</h4>')
                // res.send("Auth Successful");
                res.send($.html());

            } else {
                res.send("Wrong username or password.");
            }
        } else {
            res.send("Wrong username or password.");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error Occured");
    }
});
app.get('/newPost', (req, res) => {
    const $ = cheerio.load(fs.readFileSync('index.html'));
})

app.get('/allInvestors', (req, res) => {
    res.send(appRoot + '/frontend/startup/investers.html')
})



app.post('/postIdea', upload.none(), (req, res) => {
    const date = new Date();
    const timestamp = date.getTime();
    const title = req.body.title
    const content = req.body.content
    const theThread = { title, content, responses: [] }
    fs.writeFile(appRoot + "/public/temp/community/thread-" + timestamp + ".json", JSON.stringify(theThread), function (error) {
        if (error) { console.error("Error: " + error); }
        console.log("post saved")
    });
    // res.send('idea posted')
    res.redirect('/community')
})

app.get('/community', (req, res) => {
    const $ = cheerio.load(fs.readFileSync('frontend/community.html'));
    fs.readdirSync("public/temp/community").forEach(file => {
        // console.log(file)
        var theThread = fs.readFileSync("public/temp/community/" + file, { encoding: "utf8" })
        theThread = JSON.parse(theThread)
        console.log(theThread)
        const content = theThread.content;
        const title = theThread.title;
        var theChildDiv = '<div class="card bg-primary mb-3 shadow-soft"><div class="card-body"><h3 class="h5 card-title mt-3">' + title + '</h3><p>by ' + Username + '</p><p class="card-text">' + content + '</p><a href="#" class="inner-text "> Visit Profile </a></div></div>'
        $('#ideasCol').append(theChildDiv)
        // console.log(readFileSync(".levels/" + file, {encoding: "utf8"}))
        res.send($.html())
    })
    // res.sendFile(__dirname + '/frontend/community.html')
})


app.post('/createStartupProfile', upload.none(), (req, res) => {
    const date = new Date();
    const timestamp = date.getTime();
    const title = req.body.title
    const content = req.body.content
    const theProfile = { title, content }
    // console.log(req.body)
    fs.writeFile(appRoot + "/public/temp/profiles/profile-" + timestamp + ".json", JSON.stringify(theProfile), function (error) {
        if (error) { console.error("Error: " + error); }
        console.log("post saved")
    });
    // res.send('profile posted')
    res.redirect('/allStartups')
})
app.get('/allStartups', (req, res) => {
    const $ = cheerio.load(fs.readFileSync(appRoot + '/frontend/startup/startuplist.html'));
    fs.readdirSync("public/temp/profiles").forEach(file => {
        var theProfile = fs.readFileSync(appRoot + "/public/temp/profiles/" + file, { encoding: "utf8" })
        theProfile = JSON.parse(theProfile)
        const content = theProfile.content;
        const title = theProfile.title;
        var theChildDiv = '<div class="card bg-primary mb-3 shadow-soft"><div class="card-body"><h3 class="h5 card-title mt-3">' + title + '</h3><p class="card-text">' + content + '</p><a href="#" class="inner-text ">Open discussion</a></div></div>'
        $('#allProfileCol').append(theChildDiv)
        res.send($.html())
    })

    // res.sendFile(appRoot + '/frontend/startup/startuplist.html')
})




const port = process.env.PORT || 8080;
app.listen(port, function () {
    console.log('Your app is listening on http://localhost:' + port)
});