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

fs.mkdir(appRoot + "/public/temp", { recursive: true }, (error) => {
    if (error) { console.log(error); }
});
fs.mkdir(appRoot + "/public/temp/community", { recursive: true }, (error) => {
    if (error) { console.log(error); }
});
fs.mkdir(appRoot + "/public/temp/profiles", { recursive: true }, (error) => {
    if (error) { console.log(error); }
});
fs.writeFile(appRoot + "/public/temp/community/initialCompany.json", '{"title":"A Food based venture","Username":"Amar","content":"A food delivery company, which will deliver food from restaurant and deliver it to doorstep","responses": [{"Username":"Vikranth","Content":"I think this might be a good idea"},{"Username":"Amar","Content":"Maybe, we can collab ?"}]}', (err) => {
    if (err) throw err;
});
fs.writeFile(appRoot + "/public/temp/profiles/initialCompany.json", '{"title":"Swift","content":"A transportation company, connecting students and bikers"}', (err) => {
    if (err) throw err;
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


app.get('/mentorship',(req,res)=>{
    res.sendFile(__dirname + '/frontend/Mentorship/mentorship_page.html');
})
app.get('/allMentors', function (req, res) {
    res.sendFile(__dirname + '/frontend/Mentorship/mentors.html');
})
app.get('/resources',(req,res)=>{
    res.sendFile(__dirname + '/frontend/Mentorship/Resources.html');
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
        // console.log(user);
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
    const theThread = { title, content, Username, responses: [] }
    fs.writeFile(appRoot + "/public/temp/community/thread-" + timestamp + ".json", JSON.stringify(theThread), function (error) {
        if (error) { console.error("Error: " + error); }
        // console.log("post saved")
    });
    // res.send('idea posted')
    res.redirect('/community')
})


app.get('/posts/:ref?', (req, res) => {
    const file = req.params.ref
    const $ = cheerio.load(fs.readFileSync('ideaThread.html'));
    var theThread = fs.readFileSync("public/temp/community/" + file);
    theThread = JSON.parse(theThread)
    const content = theThread.content;
    const title = theThread.title;
    const theUser = theThread.Username;
    const responses = theThread.responses
    // console.log(responses.length)
    $('#threadHead').text(title)
    $('#threadDesc').text(content)
    $('#creditLine').text('by ' + theUser)
    $('#formHolder').append('<form enctype="multipart/form-data" id="newDisccussion" method="POST" action="/posts/newDiscussion/' + file + '" class="mt-4"><div class="form-group"><div class="input-group mb-4"><textarea class="form-control" id="exampleInputPassword6"placeholder="Content" type="text" name="content" aria-label="Password" required=""></textarea></div></div><button type="submit" class="btn btn-block btn-primary">Post</button></form>')
    for (var i = 0; i < responses.length; i++) {
        var theChildDiv = '<div class="card bg-primary mb-3 shadow-soft"><div class="card-body"><p class="card-text">' + theThread.responses[i].Content + '</p></div><p class="inner-text card-footer">By ' + theThread.responses[i].Username + '</p></div>'
        $('#responseCol').append(theChildDiv)
    }
    res.send($.html())
    // res.send(responses)
})

app.post('/posts/newDiscussion/:ref?', upload.none(), (req, res) => {
    
    const file = req.params.ref
    const content = req.body.content
    console.log(content)
    var theThread = fs.readFileSync("public/temp/community/" + file);
    theThread = JSON.parse(theThread)
    theThread.responses.push({ Username, Content: content })
    fs.writeFileSync(appRoot + '/public/temp/community/' + file, JSON.stringify(theThread), function (error) {
        if (error) { console.error("Error: " + error); }
    });
    res.redirect('/posts/' + file)
})



app.get('/posts/public/neumorphism.css', (req, res) => {
    res.sendFile(appRoot + '/public/neumorphism.css')
})
app.get('/community', (req, res) => {
    const $ = cheerio.load(fs.readFileSync('frontend/community.html'));
    fs.readdirSync("public/temp/community").forEach(file => {
        // console.log(f)
        var theThread = fs.readFileSync("public/temp/community/" + String(file), { encoding: "utf8" })
        // console.log(theThread)
        theThread = JSON.parse(theThread)
        // console.log(theThread)
        const content = theThread.content;
        const title = theThread.title;
        const theUser = theThread.Username;
        var theChildDiv = '<div class="card bg-primary mb-3 shadow-soft"><div class="card-body"><h3 class="h5 card-title mt-3">' + title + '</h3><p>by ' + theUser + '</p><p class="card-text">' + content + '</p><a href="/posts/' + file + '" class="inner-text "> Open Discussion </a></div></div>'
        $('#ideasCol').append(theChildDiv)
        // console.log(readFileSync(".levels/" + file, {encoding: "utf8"}))

    })
    res.send($.html())
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
        // console.log("post saved")
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
        var theChildDiv = '<div class="card bg-primary mb-3 shadow-soft"><div class="card-body"><h3 class="h5 card-title mt-3">' + title + '</h3><p class="card-text">' + content + '</p><a href="#" class="inner-text ">Visit Profile</a></div></div>'
        $('#allProfileCol').append(theChildDiv)
    })
    res.send($.html())
    // res.sendFile(appRoot + '/frontend/startup/startuplist.html')
})


app.get('/logout', (req, res) => {
    Username = null,
    res.redirect('/')
})


const port = process.env.PORT || 8080;
app.listen(port, function () {
    console.log('Your app is listening on http://localhost:' + port)
});