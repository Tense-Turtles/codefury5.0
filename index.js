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
//     for (var i in mongoose.connection.collections) {
//         console.log(mongoose.connection.collections[i]);
//         // will drop collection here
//     }
// });




const cheerio = require('cheerio');
var fs = require('fs');

const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


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

app.get('/mentors', function (req, res) {
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



const port = process.env.PORT || 8080;
app.listen(port, function () {
    console.log('Your app is listening on http://localhost:' + port)
});