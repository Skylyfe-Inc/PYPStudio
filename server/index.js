import express from "express";
import * as dotenv from 'dotenv';
import cors from 'cors';

import dalleRoutes from './routes/dalle.routes.js'; 
import authRoutes from './routes/auth.routes.js';
import designRoutes from './routes/design.routes.js';

dotenv.config(); // Loads environment variables from .env file

const app = express(); // Creates Express application
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(express.json({limit: "50mb"})) // Sets the limit of the JSON body to 50 MB

app.options('/generate-image', cors()); // Enable CORS for the OPTIONS request

app.use('/api/v1/images/generations', dalleRoutes); // Adds routes from dalleRoutes
app.use('/api/v1/auth', authRoutes); // Adds routes from authRoutes
app.use('/api/v1/designs', designRoutes); // Adds routes from designRoutes

app.get('/', (req,res) =>{ // GET request to root endpoint
    res.status(200).json({message: 'Hello From PlaceYourPrintStudio Server'}) // Sends 200 status code and JSON message
})

app.listen(8080, () => console.log('Server has started on Port 8080')) // Listens on port 8080