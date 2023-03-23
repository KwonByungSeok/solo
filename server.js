const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
require("dotenv").config();

const MongoClient = require("mongodb").MongoClient;
app.set("view engine", "ejs");

app.use("/public", express.static("public"));

var db;
MongoClient.connect(process.env.DB_URL, function (err, clinet) {
  if (err) return console.log(err);

  db = clinet.db("todoapp");

  app.listen(process.env.PORT, function () {
    console.log("listening on 8080");
  });
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      res.render("list.ejs", { posts: result });
    });
});

app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (err, result) {
      console.log(result);
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (err, result) {
      res.render("edit.ejs", { post: result });
    }
  );
});

app.put("/edit", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { 제목: req.body.title, 날짜: req.body.date } },
    function (err, result) {
      console.log("수정완료");
      res.redirect("/list");
    }
  );
});

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const multer = require("multer");

app.use(
  session({ secret: "비밀코드 ", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (err, result) {
    done(null, result);
  });
});

app.get("/mypage", 로그인했니, (req, res) => {
  console.log(req.user);
  res.render("mypage.ejs", { 사용자: req.user });
});

function 로그인했니(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인 안하셨는데요?");
  }
}

app.get("/search", (요청, 응답) => {
  console.log(요청.query);
  db.collection("post")
    .find({ 제목: 요청.query.value })
    .toArray((에러, 결과) => {
      console.log(결과);
    });
});

app.post("/register", (req, res) => {
  db.collection("login").insertOne(
    { id: req.body.id, pw: req.body.pw },
    function (err, result) {
      res.redirect("/");
    }
  );
});

app.post("/add", function (요청, 응답) {
  console.log(요청.user._id);
  응답.send("전송완료");
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (에러, 결과) {
      console.log(결과.totalPost);
      var 총게시물갯수 = 결과.totalPost;

      db.collection("post").insertOne(
        { _id: 총게시물갯수 + 1, 제목: 요청.body.title, 날짜: 요청.body.date },
        function (에러, 결과) {
          db.collection("counter").updateOne(
            { name: "게시물갯수" },
            { $inc: { totalPost: 1 } },
            function (에러, 결과) {
              if (에러) {
                return console.log(에러);
              }
            }
          );
        }
      );
    }
  );

  app.delete("/delete", (req, res) => {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);

    db.collection("post").deleteOne(req.body, function (err, result) {
      console.log("삭제완료");
      if (err) {
        console.log(err);
      }
      res.status(200).send({ message: "성공했습니다" });
    });
  });

  app.use("/shop", require("./routes/shop.js"));
  app.use("/board", require("./routes/board.js"));

  let _multer = require("multer");
  var storage = _multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/image");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });

  var upload = multer({ storage: storage });

  app.get("/upload", (req, res) => {
    res.render("upload.ejs");
  });

  app.post("/upload", upload.single("profile"), function (req, res) {
    res.send("업로드 완료");
  });

  app.get("/image/:imageName", function (요청, 응답) {
    응답.sendFile(__dirname + "/public/image/" + 요청.params.imageName);
  });
});
