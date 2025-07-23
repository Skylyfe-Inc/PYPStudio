import { CognitoIdentityProviderClient, SignUpCommand, AdminConfirmSignUpCommand, InitiateAuthCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

export async function signUpUser(email, password, username) {
  const signUpCmd = new SignUpCommand({
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'preferred_username', Value: username }
    ]
  });
  await cognitoClient.send(signUpCmd);
  try {
    const confirmCmd = new AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: email
    });
    await cognitoClient.send(confirmCmd);
  } catch (err) {
    console.error('Error confirming signup:', err);
  }
}

export async function loginUser(email, password) {
  const authCmd = new InitiateAuthCommand({
    ClientId: clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });
  const { AuthenticationResult } = await cognitoClient.send(authCmd);
  return AuthenticationResult;
}

export async function verifyToken(accessToken) {
  try {
    const cmd = new GetUserCommand({ AccessToken: accessToken });
    const response = await cognitoClient.send(cmd);
    return response;
  } catch (err) {
    console.error('Error verifying token:', err);
    return null;
  }
}