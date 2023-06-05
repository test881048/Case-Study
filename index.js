const express = require("express");
const app = express();
const multer = require("multer");
const aws = require("aws-sdk");
var path = require("path");
var bodyparser = require("body-parser");
app.use(bodyparser.json());
var mysql = require("mysql");
var session = require("express-session");

app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.resolve(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

aws.config.update({
  accessKeyId: "AKIAV52OWJCDRJ5PHKEA",
  secretAccessKey: "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",
  region: "us-east-1",
});

var con = mysql.createConnection({
  host: "172.29.57.206",
  user: "bhasker",
  password: "Mind1234",
  database: "ashutest",
});

const s3 = new aws.S3();
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.render("home");
  } else {
    res.render("error");
  }
  // res.render("home");
});

app.get("/upload", (req, res) => {
   if (req.session.loggedin) {
    res.render("upload", { err: "" });
  } else {
    res.render("error");
  }
});

app.get('/signout', (req,res)=>{
  req.session.loggedin = false
  res.redirect('/')
})

app.get('/getanimals',(req,res)=>{
  var data=[]
  var sql=`select name from casestudyimages where category='Animals'`
  con.query(sql, function (err, result, fields) {
    // console.log(result)
    for (var i of result){
      var temp={name:i.name,url:'https://d38gzhurlwic7c.cloudfront.net/'+i.name}
      data.push(temp)
    }
    res.render('animals',{data:data})
  });
})
app.get('/getfruits',(req,res)=>{
  var data=[]
  var sql=`select name from casestudyimages where category='Fruits'`
  con.query(sql, function (err, result, fields) {
    // console.log(result)
    for (var i of result){
      var temp={name:i.name,url:'https://d38gzhurlwic7c.cloudfront.net/'+i.name}
      data.push(temp)
    }
    res.render('fruits',{data:data})
  });
})
app.get('/getmisc',(req,res)=>{
  var data=[]
  var sql=`select name from casestudyimages where category='Miscellaneous'`
  con.query(sql, function (err, result, fields) {
    // console.log(result)
    for (var i of result){
      var temp={name:i.name,url:'https://d38gzhurlwic7c.cloudfront.net/'+i.name}
      data.push(temp)
    }
    res.render('misc',{data:data})
  });
})

app.get("/login", (req, res) => {
  res.render("login", { err: "" });
});
app.get("/register", (req, res) => {
  res.render("register", { err: "" });
});

app.post("/submitlogin", function (req, res, next) {
  var email = req.body.emaillogin;
  var pwd = req.body.passwordlogin;
  if (email && pwd) {
    var sql = `select email, pwd from casestudyusers where email = '${email}'`;
    con.query(sql, function (err, result, fields) {
      if (result[0].pwd == pwd) {
        req.session.loggedin = true;
        res.redirect("/");
      } else {
        res.render("login", { err: "Incorrect Password" });
      }
    });
  } else {
    res.render("login", { err: "Fields can't be empty" });
  }
});

app.post("/submitregister", function (req, res, next) {
  var email = req.body.emailregister;
  var pwd = req.body.passwordregister;
  if (email && pwd) {
    var sql = "select email from casestudyusers";
    var ch = 0;
    con.query(sql, function (err, result, fields) {
      for (var i of result) {
        if (email == i.email) {
          ch = 1;
          break;
        }
      }
      if (ch == 1) {
        res.render("register", {
          err: `User with ${email} already exists, please proceed to login.`,
        });
      } else {
        var sql = `INSERT INTO casestudyusers (email, pwd) VALUES ('${email}','${pwd}')`;
        con.query(sql, function (err) {
          if (err) throw err;
          res.render("login",{err:""});
        });
      }
    });
  } else {
    res.render("register", { err: "Fields can't be empty" });
  }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const s3Key = file.originalname;
  const extension = s3Key.split(".");

  const params = {
    Bucket: "bhasker-ki-bucket",
    Key: s3Key,
    Body: file.buffer,
  };

  // Upload the file to S3
  if (
    extension[1] == "JPG" ||
    extension[1] == "jpg" ||
    extension[1] == "JPEG" ||
    extension[1] == "jpeg"
  ) {
    var sql = "select name from casestudyimages";
    var ch = 0;
    con.query(sql, function (err, result, fields) {
      for (var i of result) {
        if (s3Key == i.name) {
          ch = 1;
          break;
        }
      }
      if (ch == 1) {
        res.render("upload", {
          err: `This Image already exists.`,
        });
      } else {
        var sql = `INSERT INTO casestudyimages (name, category) VALUES ('${s3Key}','${req.body.category}')`;
        con.query(sql, function (err) {
          if (err) throw err;
          s3.upload(params, (err, data) => {
            if (err) {
              res.render("upload",{err:"Error uploading file to S3"});
            } else {
              res.redirect("/");
            }
          });
        });
      }
    });
  } else {
    res.render("upload",{err:"only JPG, JPEG formats are allowed"});
  }
});

app.listen(3000, () => {
  console.log("server running on http://localhost:3000/");
});
