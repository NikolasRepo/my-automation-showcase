const { CognitoJwtVerifier } = require('aws-jwt-verify')
require('dotenv').config()

const contractorVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CONTRACTOR_CLIENT_ID,
})

const clientVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_CLIENT_ID,
})

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = await contractorVerifier.verify(token)
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: 'contractor',
    }
    return next()
  } catch {}

  try {
    const payload = await clientVerifier.verify(token)
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: 'client',
    }
    return next()
  } catch {}

  return res.status(401).json({ error: 'Invalid or expired token' })
}

function requireContractor(req, res, next) {
  if (req.user?.role !== 'contractor') {
    return res.status(403).json({ error: 'Contractor access required' })
  }
  next()
}

function requireClient(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

module.exports = { requireAuth, requireContractor, requireClient }