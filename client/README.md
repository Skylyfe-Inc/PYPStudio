## Overview

Place Your Print Studio offers an interactive 3D environment where users can customize various products including shirts, hoodies, boots, and sneakers. The application features:

- Real-time 3D visualization using Three.js and React Three Fiber
- Interactive color customization 
- Design upload functionality
- AI-generated designs using DALL-E 3
- User authentication

## Tech Stack

### Frontend
- **React**: Core UI library
- **Vite**: Build tool and development environment
- **React Router**: For navigation between pages
- **Valtio**: For state management
- **Three.js/React Three Fiber**: For 3D rendering
- **Framer Motion**: For animations and transitions
- **Tailwind CSS**: For styling

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework 
- **OpenAI API**: For generating custom designs
- **AWS Cognito (AWS SDK)**: For authentication
- **MongoDB**: Database integration
- **Nodemon**: For development environment hot-reloading

## Project Structure

### Frontend
The frontend follows a modular architecture:
- **assets**: Contains static assets (images, icons)
- **canvas**: Contains 3D rendering components
- **components**: Reusable UI components
- **config**: Configuration files, routes, constants, and helper functions
- **pages**: Main page components
- **store**: State management
- **services**: API integration services

### Backend
The backend is organized into:
- **index.js**: Entry point with Express configuration and route mounting
- **routes/**: API endpoint definitions organized by feature
- **utils/**: Helper functions and service integrations

## API Endpoints

The server exposes several RESTful endpoints:

### 1. DALL-E Integration (`/api/v1/images/generations`)
- **GET**: Basic health check 
- **POST**: Accepts a text prompt and returns an AI-generated image

### 2. Authentication (`/api/v1/auth`)
- **POST /signup**: User registration with Firebase Authentication
- **POST /login**: User authentication and token generation
- **POST /signup**: User registration via AWS Cognito
- **POST /login**: User login with token generation from Cognito

### 3. Design Management (`/api/v1/designs`)

- **POST /save**: Saves user designs

## Key Features

### 3D Rendering System
The 3D visualization is handled by several components:
- **CanvasModel**: Main container for 3D elements
- **Model**: Handles the 3D model loading and customization
- **CameraRig**: Controls camera positioning based on viewport size
- **Backdrop**: Creates shadows and lighting effects

The application dynamically switches between different 3D models (shirt, hoodie, boot, sneaker) based on user selection while maintaining customization state.

### Customization Tools
The customization features include:
- **ColorPicker**: For changing the product color
- **FilePicker**: For uploading design files
- **AIPicker**: Interface for AI-generated designs using DALL-E

### Authentication System
The app has a complete authentication flow with:
- Login/Signup pages
- Token-based authentication (JWT)
- Protected routes
- Cookie storage for tokens

## Technical Considerations and Improvements

### Frontend
- Implements responsive design that adjusts layout and 3D camera positioning based on screen size
- Uses dynamic texture application with decals on 3D models
- Incorporates smooth animations with Framer Motion
- Implements lazy loading for performance optimization

### Backend
- Properly manages API keys using environment variables
- Implements basic error handling and appropriate HTTP status codes
- Processes images with URL-to-base64 conversion for client-side usage

- Uses token-based authentication flow with AWS Cognito

### Security Considerations
- Environment variables should be properly secured

- AWS credentials should be stored safely
- Input validation should be implemented
- Authentication middleware should be used consistently

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/place-your-print-studio.git
```

2. Install frontend dependencies
```
cd client
npm install
```

3. Install backend dependencies
```
cd server
npm install
```

4. Create a `.env` file in the server directory with your OpenAI API key:
4. Create a `.env` file in the server directory with your OpenAI and AWS Cognito credentials:
```
OPENAI_API_KEY=your_api_key_here
AWS_REGION=your_region
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret
```

5. Start the backend server
```
cd server
npm start
```

6. Start the frontend application
```
cd client
npm run dev
```

7. Access the application at `http://localhost:5173`

## Future Enhancements

- Complete AWS integration for authentication and design storage
- Improve error handling and validation
- Implement user profile management
- Add more 3D models and customization options
- Enhance the AI design generation capabilities