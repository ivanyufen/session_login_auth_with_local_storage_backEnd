//supaya connected dengan server utama
const userRouter = require('express').Router();
//untuk connect ke db
const db = require("../connection/connection");

//middleware
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
var bcrypt = require('bcryptjs');
const saltRounds = 10;
const fileupload = require("express-fileupload");
const mkdirp = require('mkdirp');


//pakai middleware
userRouter.use(bodyParser.urlencoded({ extended: true }));
userRouter.use(bodyParser.json());
userRouter.use(cors());
userRouter.use(fileupload());

userRouter.get("/users", (req, res) => {
    let data = req.body;
    let sql = "SELECT * FROM users;";
    let query = db.query(sql, data, (err, result) => {
        if (err) throw err;
        console.log(result);
        // res.send("All users data successfully fetched!");
        res.send(result);
    });
});

userRouter.get("/users/:id", (req, res) => {
    let id = req.params.id;
    let sql = "SELECT * FROM users WHERE id = ? ;";
    let query = db.query(sql, id, (err, result) => {
        if (err) throw err;
        console.log(result);
        // res.send(`User with id: ${id} successfully fetched!`);
        res.send(result);
    });
});

userRouter.post("/login", (req, res) => {
    console.log(req.method)
    let username = req.body.username;
    let password = req.body.password;
    let sql = `SELECT * FROM users WHERE username = '${username}'`;
    let query = db.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else if (result.length > 0) {
            bcrypt.compare(password, result[0].password, (err, checkPass) => {
                console.log(checkPass);
                if (checkPass == true) {
                    res.send(result);
                }
                else {
                    res.send({ "status": "wrongPassword" });
                }
            });
            // if (password != result[0].password) {
            //     res.send({ "status": "wrongPassword" });
            // }
            // else {
            //     // res.send({ "status": "loginSuccess" });
            //     res.send(result);
            // }
        }
        else {
            res.send({ "status": "notRegistered" });
        }
    });
});

userRouter.post("/users", (req, res) => {
    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let data = req.body;

    let sql = `SELECT * FROM users WHERE username = '${username}'`;
    let query = db.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else if (result.length > 0) {
            res.send({ "status": "dataExist" });
        }
        else {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                let query = db.query(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hash], (err, result) => {
                    if (err) {
                        throw err;
                    }
                    // res.send({ "status": "signUpSuccess" });
                    res.send(result);
                });
            })
        }
    });
});

userRouter.put("/users/:id", (req, res) => {
    let data = req.body;
    let id = req.params.id;
    let sql = `UPDATE users SET ? where id = ${id} ;`;
    let query = db.query(sql, data, (err, result) => {
        if (err) throw err;
        console.log(result);
        // res.send(`User with id: ${id} successfully updated!`);
        res.send(result);
    });
});

userRouter.delete("/users/:id", (req, res) => {
    let id = req.params.id;
    console.log(id)
    let sql = `DELETE FROM users where id = ${id} ;`;
    let query = db.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        res.send(`User with id: ${id} successfully deleted!`);
        // res.send(result);

    });
});

//upload Profile Picture
userRouter.post('/upload', (req, res) => {
    //kalau ada data nya, masukin; kalau gaada, default di database udh ada profpict.png
    if (req.files) {
        var userid = req.body.userid;
        var fileData = req.files.file;
        var fileDataName = fileData.name;

        //masukin url path gambarnya ke row user
        var filePath = `http://localhost:3007/files/users/${userid}/${fileDataName}`;
        let query = db.query(`UPDATE users SET profpict = ? WHERE ID = ${userid}`, filePath, (err, result) => {
            if (err) {
                console.log("error");
            }
            else {
                res.send(filePath);
            }
        });
        //masukin foto nya ke storage backend
        fs.mkdirSync(`./files/users/${userid}`);
        fileData.mv(`./files/users/${userid}/` + fileDataName, (err) => {
            if (err) {
                throw err;
            } else {
                // res.send(fileDataName);
                console.log("Photo successfully stored in storage!")
            }
        });
    }
})

module.exports = userRouter;
