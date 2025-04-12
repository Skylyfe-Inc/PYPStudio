import { Router } from 'express';
//import { firebase_admin, db, verifyToken } from '../utils/firebase';

const router = Router();

// Save design endpoint
router.post('/save', async (req, res) => {
    const token = req.body.token; // Assuming the token is sent in the request body
    const imageData = req.body.imageData;

    try {
        const decodedToken = await verifyToken(token);
        
        // Access Control: Check if the user is authenticated
        if (!decodedToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }        

        // Proceed with saving the image to Firebase Cloud Storage
        const bucket = firebase_admin.storage().bucket();
        const file = bucket.file('path/to/image.jpg');
        await file.save(imageData, { contentType: 'image/jpeg' });

        return res.status(200).json({ message: 'Design saved successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export router
export default router; 
