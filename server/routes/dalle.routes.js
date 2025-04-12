import express, { response } from 'express';
import * as dotenv from 'dotenv'; 
import OpenAI from 'openai';
import axios from "axios"



dotenv.config();

const router = express.Router();

// Configure OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
  });

// GET route
router.route('/').get((req, res) => {
    res.status(200).json({message: "Hello from DALL.E Routes"})
})

// POST route
async function imageUrlToBase64(url) {
    try {
      const response = await fetch(url);
  
      const blob = await response.arrayBuffer();
  
      const contentType = response.headers.get('content-type');
  
      const base64String = `data:${contentType};base64,${Buffer.from(
        blob,
      ).toString('base64')}`;
  
      return base64String;
    } catch (err) {
      console.log(err);
      return null
    }
  }
router.route('/').post(async(req, res)=>{
    try {
        // Get prompt from request body
        const {prompt} = req.body; 

        // Generate image
        const response = await openai.images.generate({ 
            prompt,
            model: 'dall-e-3',
            quality: 'standard',
            size: '1024x1024',
            n: 1, 
        });

        // Get image URL
        // console.log(response)
        const imageURL = response.data[0].url;
        // console.log('Image URL..' + imageURL)
        const photoData = await imageUrlToBase64(imageURL)
        res.status(200).json({photo: imageURL,photoData}); 

    } catch (error) {
       console.error(error);
       res.status(500).json({message: "Something went wrong"})
    }
})

// Export router
export default router; 