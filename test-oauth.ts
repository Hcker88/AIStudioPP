import { OAuth2Client } from 'google-auth-library';
import { env } from './src/lib/env.server.js';

console.log("ID:", env.GOOGLE_CLIENT_ID);
console.log("SECRET:", env.GOOGLE_CLIENT_SECRET);

const oauth2Client = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['profile', 'email'],
  prompt: 'consent'
});

console.log("URL:", url);
