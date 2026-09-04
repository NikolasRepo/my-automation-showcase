const express = require('express')
const router = express.Router()
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} = require('@aws-sdk/client-cognito-identity-provider')
require('dotenv').config()

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
})

// Register a new contractor
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password and name are required' })
  }
  try {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CONTRACTOR_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'custom:role', Value: 'contractor' },
      ],
    })
    await cognitoClient.send(command)
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' })
  } catch (err) {
    console.error('Register error:', err)
    res.status(400).json({ error: err.message })
  }
})

// Confirm email verification
router.post('/confirm', async (req, res) => {
  const { email, code } = req.body
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and confirmation code are required' })
  }
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CONTRACTOR_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    })
    await cognitoClient.send(command)
    res.json({ message: 'Email confirmed. You can now log in.' })
  } catch (err) {
    console.error('Confirm error:', err)
    res.status(400).json({ error: err.message })
  }
})

// Resend confirmation code
router.post('/resend-code', async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }
  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: process.env.COGNITO_CONTRACTOR_CLIENT_ID,
      Username: email,
    })
    await cognitoClient.send(command)
    res.json({ message: 'Confirmation code resent.' })
  } catch (err) {
    console.error('Resend code error:', err)
    res.status(400).json({ error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password and role are required' })
  }

  const clientId = role === 'client'
    ? process.env.COGNITO_CLIENT_CLIENT_ID
    : process.env.COGNITO_CONTRACTOR_CLIENT_ID

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    })
    const response = await cognitoClient.send(command)

    // Decode the ID token to check the user's actual role
    const idToken = response.AuthenticationResult.IdToken
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString())
    const userRole = payload['custom:role'] || 'contractor'

    // If user is trying to log in as client but is a contractor, reject
    if (role === 'client' && userRole === 'contractor') {
      return res.status(403).json({ error: 'This account is a contractor account. Please sign in as a contractor.' })
    }

    // If user is trying to log in as contractor but is a client, reject
    if (role === 'contractor' && userRole === 'client') {
      return res.status(403).json({ error: 'This account is a client account. Please sign in as a client.' })
    }

    res.json({
      accessToken: response.AuthenticationResult.AccessToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      idToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
      role: userRole,
    })
  } catch (err) {
    console.error('Login error:', err)
    if (err.name === 'NotAuthorizedException') {
      return res.status(401).json({ error: 'Incorrect email or password.' })
    }
    if (err.name === 'UserNotConfirmedException') {
      return res.status(401).json({ error: 'User is not confirmed. Please check your email.' })
    }
    res.status(401).json({ error: err.message })
  }
})

module.exports = router