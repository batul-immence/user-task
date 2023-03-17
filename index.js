const express = require('express');
const app = express();
const connection = require('./src/database/connection');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors')
const dotenv = require('dotenv');
const routers = require('./src/routes/routes');

const swaggerUI = require('swagger-ui-express');
// const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    // definition: {
    //     openapi: "3.0.0",
    //     info: {
    //         title: "Welcome to the User API!",
    //         version: "1.0.0",
    //         description: ""
    //     },
    //     servers: [
    //         {
    //             url: "http://localhost:4000"
    //         }
    //     ]
    // },
    // apis: ["./src/routes/routes.js"]
    explorer: true,
    swaggerOptions: {
        urls: [
        {
            url: `http://localhost:4000/doc/swagger.json`,
            name: 'V1',
        },
        ],
        servers: [
        {
            url: "http://localhost:4000",
        },
        ],
    }
}

// const swaggerdoc = swaggerJSDoc(options);


app.use(bodyParser.json());
app.use(express.json());
app.use('/', routers);

app.use(cors())
dotenv.config();

app.use('/api', swaggerUI.serve, swaggerUI.setup(null, options));

app.use('/doc', express.static(path.join(__dirname, './src/docs')))

app.listen(4000, () => {
    console.log("Server On!");
    connection.connect(err => {
        if (!err) {
          console.log("DB Connection Succeeded");
        } else {
          console.log("DB Connection Failed");
        } 
    });
})