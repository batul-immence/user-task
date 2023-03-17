const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
var generator = require('generate-password');
var nodemailer = require('nodemailer');
const verify = require('../auth/authVerify');
const connection = require('../database/connection');
require('dotenv').config()

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     User:
//  *       type: object
//  *       required:
//  *          - id
//  *          - full_name
//  *          - mobile_no
//  *       properties:
//  *         id:
//  *           type: int
//  *           description: The auto-generated id of the user
//  *         full_name:
//  *           type: string
//  *           description: The name of user
//  *         mobile_no:
//  *           type: string
//  *           description: Mobile n of the user
//  */


// /**
//  * @swagger
//  * tags:
//  * /:
//  *   get:
//  *     descripton: Blank request
//  *     responses:
//  *      '200':
//  *          description: A sucessful response
//  *       
//  */

router.get('/', (req, res) => {
    res.status(200).send({
        isSuccess: true,
        message: "Hello World!",
        code: 200,
        data: {
        },
      });
})

// /**
//  * @swagger
//  * tags:
//  * /allUsers:
//  *   get:
//  *     descripton: All users
//  *     responses:
//  *      '200':
//  *          description: A sucessful response
//  *          content:
//  *              schema:
//  *                    $ref: '#/components/schemas/User'
//  */


router.get('/user', async (req, res) => {
    var query = "Select full_name, mobile_no, email_id, address, blood_grp from users";
    connection.query(query, function(err, results){
        if(err) throw err;
        res.send(results);
    })
});

router.get('/user/:id', async (req, res) => {
    var id = req.params.id;
    var query = `Select full_name, mobile_no, email_id, address, blood_grp from users where id = ${id}`;
    connection.query(query, function(error, results){
        if(error) throw error;
        res.send(results.length? results :{
            isSuccess: true,
            message: "User not found",
            code: 404,
            data: {
            },
          })
    })
});

router.post('/user', verify, async (req, res) => {
    var data = req.body;
    var password = generator.generate({
        length: 6,
        numbers: true
    });
    console.log(data);
    var query = "INSERT INTO users (full_name, mobile_no, email_id, address, blood_grp, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
    connection.query(query, [ data.full_name, data.mobile_no, data.email_id, data.address, data.blood_grp, data.username, password ], function(err, results){
        if(err) throw err;
        res.send(data);
    })

    var transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        }
    });
      
    var mailOptions = {
    from: process.env.SMTP_USER,
    to: data.email_id,
    subject: 'Credentials',
    html: `Your Username : ${data.username}</br>Your Password : ${password}`,
    };
    
    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
    });
});

router.post('/auth/register', async (req, res) => {
    var data = req.body;
    console.log(data);
    var query = "INSERT INTO users (full_name, mobile_no, email_id, address, blood_grp, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
    connection.query(query, [ data.full_name, data.mobile_no, data.email_id, data.address, data.blood_grp, data.username, data.password ], function(err, results){
        if(err) throw err;
        res.send(data);
    })
});

router.post('/auth/login', async(req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    if(!username || !password){
        res.send("Username and Password required.");
    }
    var query = `Select count(*) as count, id from users where username = ? and password = ? group by id`;
    connection.query(query, [ username, password ], function(err, results){
        if(err) throw err;
        if(results[0]?.count? results[0].count == 1: 0){
            try{
                const token = jwt.sign({username}, process.env.TOKEN_SECRET);
                res.header("auth-token", token).send({
                    isSuccess: true,
                    message: "Login Successfull",
                    code: 200,
                    data: {
                    },
                  });
            } catch(error){
                res.status(500).send({
                    isSuccess: false,
                    message: error,
                    code: 500,
                    data: {
                    },
                  });
            }
        }
        else res.send({
            isSuccess: false,
            message: "Username or Password do not match!",
            code: 401,
            data: {
            },
          })
    });
})

router.post('/auth/forgotPassword', verify, async(req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    var query = "UPDATE users SET password = ? where email_id = ?";
    connection.query(query, [ password, email ], function(err, results){
        if(err) throw err;
        res.status(200).send({
            isSuccess: true,
            message: "Reset",
            code: 200,
            data: {
            },
          });
    })

    var transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        }
    });
      
    var mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Reset Password',
    html: `Your password is changed.`,
    };
    
    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
    });

})

router.post('/auth/updatePassword', verify, async(req, res) => {
    var email = req.body.email;
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;

    var query = "UPDATE users SET password = ? where email_id = ? and password = ?";
    connection.query(query, [ newPassword, email, oldPassword ], function(err, results){
        if(err) throw err;
        res.status(200).send({
            isSuccess: true,
            message: "Updated",
            code: 200,
            data: {
            },
          });
    })
    
    var transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        }
    });
      
    var mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Reset Password',
    html: `Your password has been updated.`,
    };
    
    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
    });

})

router.put('/user/:id', async (req, res) => {
    var id = req.params.id;
    var data = req.body;
    console.log(data);
    var query = `UPDATE users SET full_name = ?, mobile_no = ?, email_id = ?, address = ?, blood_grp = ? where id = ${id}`;
    connection.query(query, [ data.full_name, data.mobile_no, data.email_id, data.address, data.blood_grp ], function(err, results){
        if(err) throw err;
        res.send(data);
    })
});

router.delete('/user/:id', async (req, res) => {
    var id = req.params.id;
    var query = `DELETE FROM users where id = ${id}`;
    connection.query(query, function(err, results){
        if(err) throw err;
        res.send(results.affectedRows? {
            isSuccess: true,
            message: "User Deleted",
            code: 200,
            data: {
            },
          } : {
            isSuccess: true,
            message: "No such user existed",
            code: 404,
            data: {
            },
          })
    })
});

module.exports = router;