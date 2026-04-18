import { Request, Response } from 'express';
import { logger } from '../config/logger';
import * as decisionEngine from '../services/DecisionEngine.server';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../lib/env.server';

const oauth2Client = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  // Use APP_URL if available, otherwise fallback to a default or construct dynamically
  env.APP_URL ? `${env.APP_URL}/api/auth/callback` : 'postmessage'
);

export const healthCheck = (req: Request, res: Response) => {
  logger.info('Health check called');
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
};

export const getDecisionInsight = async (req: Request, res: Response) => {
  const { principal, monthlyPayment, annualInterestRate } = req.body;
  
  if (!principal || !monthlyPayment || !annualInterestRate) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const insight = decisionEngine.generateDecisionInsight(principal, monthlyPayment, annualInterestRate);
    res.json({ success: true, data: insight });
  } catch (error) {
    logger.error(error, 'Error generating decision insight');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getAuthUrl = (req: Request, res: Response) => {
  try {
    // We need the origin to construct the redirect URI dynamically if APP_URL is not set
    // Strictly use APP_URL to avoid origin/referer mismatch issues
    const redirectUri = `${env.APP_URL}/api/auth/callback`;

    logger.info(`Generating auth URL with redirectUri: ${redirectUri}, APP_URL: ${env.APP_URL}`);

    // Create a new client instance for each request to ensure the redirect URI is correct
    const client = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
    logger.info(`Generated URL: ${url}`);
    res.json({ success: true, data: { url, debug: { id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET } } });
  } catch (error) {
    logger.error(error, 'Error generating auth URL');
    res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
  }
};

export const handleAuthCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const redirectUri = `${env.APP_URL}/api/auth/callback`;
    
    const client = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfoResponse = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const user = userInfoResponse.data as any;

    if (req.session) {
      req.session.user = {
        id: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture
      };
    }

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                user: ${JSON.stringify({
                  id: user.sub,
                  email: user.email,
                  name: user.name,
                  picture: user.picture
                })}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error(error, 'Error during auth callback');
    res.status(500).send('Authentication failed');
  }
};

export const getMe = (req: Request, res: Response) => {
  res.json({ success: true, data: { user: req.session?.user || null } });
};

export const logout = (req: Request, res: Response) => {
  req.session = null;
  res.json({ success: true });
};

export const getDashboard = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const handleOnboarding = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const getWelcome = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const getAIContext = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const handleChat = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const saveStrategy = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const syncFinancials = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const exportRoadmap = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const getMarketPulse = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const getAnnualReport = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const saveFeedback = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const logAdvice = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const markAdviceFollowed = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};
