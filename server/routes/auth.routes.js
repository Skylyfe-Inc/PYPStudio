import { Router } from 'express';
import { signUpUser, loginUser } from '../utils/cognito.js';

const router = Router();

// Sign up endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
     await signUpUser(email, password, username);
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
     const authResult = await loginUser(email, password);
    res.status(200).send({
      token: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken
    });
 
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).send({ message: 'Unauthorized' });
  }
});

// Export router
export default router; 
