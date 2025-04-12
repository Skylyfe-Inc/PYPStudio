import { Router } from 'express';
//import { firebase_admin, db } from '../utils/firebase';

const router = Router();

// Sign up endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const userRecord = await firebase_admin.auth().createUser({
      email,
      password,
      username
    });
    
    // Save user data to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      username
    });

    res.status(200).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send({ message: 'Error creating user' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate the user with Firebase Authentication
    const userRecord = await firebase_admin.auth().getUserByEmail(email);
    const token = await firebase_admin.auth().createCustomToken(userRecord.uid);
    res.status(200).send({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).send({ message: 'Unauthorized' });
  }
});

// Export router
export default router; 
