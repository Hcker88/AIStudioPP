import { Request, Response } from 'express';
import { logger } from '../config/logger';
import * as decisionEngine from '../services/DecisionEngine.server';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../lib/env.server';

import { db } from '../../lib/db';
import { users } from '../../lib/schema';
import { eq } from 'drizzle-orm';
import { handleChatAction } from '../../routes/api.chat.server';
import { generateFinancialRoadmap } from '../../routes/api.export.server';
import { syncFinancials as syncHandler } from '../../routes/api.sync.server';


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
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const appUrl = `${protocol}://${host}`;
    const redirectUri = `${appUrl}/api/auth/callback`;

    logger.info(`Generating auth URL with redirectUri: ${redirectUri}, appUrl: ${appUrl}`);

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
    res.json({ success: true, data: { url } });
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
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const appUrl = `${protocol}://${host}`;
    const redirectUri = `${appUrl}/api/auth/callback`;
    
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
    
    // Upsert user to DB
    let dbUser = await db.query.users.findFirst({
      where: eq(users.googleId, user.sub)
    });

    if (!dbUser) {
      const inserted = await db.insert(users).values({
        email: user.email,
        name: user.name,
        googleId: user.sub,
      }).returning();
      dbUser = inserted[0];
    } else {
      const updated = await db.update(users)
        .set({ name: user.name })
        .where(eq(users.id, dbUser.id))
        .returning();
      dbUser = updated[0];
    }

    if (req.session) {
      req.session.user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
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
                  id: dbUser.id,
                  email: dbUser.email,
                  name: dbUser.name,
                  picture: user.picture
                })}
              }, window.location.origin);
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
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: red;">Authentication Failed</h2>
          <p>We successfully connected to Google, but encountered an error saving your session.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; overflow-wrap: break-word;">
            ${error instanceof Error ? error.message : String(error)}
          </div>
          <p><strong>Troubleshooting:</strong></p>
          <ul>
            <li>If you see a Database error (ENOTFOUND, connection refused, or tenant not found), your Postgres/Supabase instance may be paused or offline. Please check your DATABASE_URL in the Settings menu.</li>
            <li>If you see a redirect_uri_mismatch, ensure your Google Cloud Credentials exactly match the App URL.</li>
          </ul>
        </body>
      </html>
    `);
  }
};

export const getMe = (req: Request, res: Response) => {
  res.json({ success: true, data: { user: req.session?.user || null } });
};

export const logout = (req: Request, res: Response) => {
  req.session = null;
  res.json({ success: true });
};

import { handleOnboardingAction } from '../../routes/onboarding.server';
import { loadDashboardData } from '../../routes/dashboard.server';
import { saveStrategy as saveStrategyHandler } from '../../routes/api.save-strategy.server';
import { parseStatementText } from '../../routes/api.parse.server';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    const result = await loadDashboardData(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(error, 'Dashboard load error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const parseStatement = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text content is required' });
    }
    const result = await parseStatementText(text);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(error, 'Parse statement error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const handleOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    const data = { ...req.body, userId };
    const result = await handleOnboardingAction(data);
    res.json(result);
  } catch (error) {
    logger.error(error, 'Onboarding error');
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal Server Error' });
  }
};


export const handleChat = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    const { message, financialData } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    const responseText = await handleChatAction(userId, message, financialData);
    res.json({ success: true, response: responseText });
  } catch (error) {
    logger.error(error, 'Chat error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const saveStrategy = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    const result = await saveStrategyHandler({ ...req.body, userId });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(error, 'Save strategy error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const syncFinancials = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(400).json({ success: false, error: "Missing userId" });
    const result = await syncHandler(userId);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    logger.error(error, 'Sync error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const exportRoadmap = async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(400).json({ success: false, error: "Missing userId" });
    const result = await generateFinancialRoadmap(userId);
    res.json({ success: true, pdfBase64: result.pdfBase64 });
  } catch (error) {
    logger.error(error, 'Export error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

import { parseFinancialInput } from '../../lib/parser.ts';

export const parseFinancialIntent = async (req: Request, res: Response) => {
  try {
    const { message, profileContext } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    const result = await parseFinancialInput(message, profileContext || {});
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(error, 'Parser error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

