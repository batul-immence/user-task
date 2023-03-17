const jwt = require('jsonwebtoken');
require('dotenv').config()

module.exports = (req, res, next) => {
    const token = req.headers['authentication'];
    if(!token){
        return res.status(401).send("Access denied!");
    } 
    try{
        const verify = jwt.verify(token, process.env.TOKEN_SECRET);
        console.log(verify)
        req.user = verify;
        next();
    } catch (error){
        res.status(400).send("Invalid Token");
    }
}