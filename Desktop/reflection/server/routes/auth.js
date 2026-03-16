import { getLoginUrl, getLogoutUrl, validateTicket } from '../cas.js';
import * as db from '../db/index.js';

export function registerAuthRoutes(app) {
  const baseUrl = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const apiUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
  // In dev, use baseUrl for callback so browser lands on frontend and proxy forwards; cookie then matches origin.
  const callbackOrigin = process.env.NODE_ENV === 'production' ? apiUrl : baseUrl;
  const serviceUrl = `${callbackOrigin}/api/auth/cas/callback`;

  app.get('/api/auth/cas/login', (req, res) => {
    const loginUrl = getLoginUrl(serviceUrl);
    res.redirect(loginUrl);
  });

  app.get('/api/auth/cas/callback', async (req, res) => {
    const ticket = req.query.ticket;
    if (!ticket) {
      return res.redirect(`${baseUrl}/?error=no_ticket`);
    }
    const netid = await validateTicket(serviceUrl, ticket);
    if (!netid) {
      return res.redirect(`${baseUrl}/?error=invalid_ticket`);
    }
    let user = db.getUserByNetid(netid);
    if (!user) {
      user = db.createUser(netid);
    }
    req.session.userId = user.id;
    req.session.netid = netid;
    req.session.save((err) => {
      if (err) return res.redirect(`${baseUrl}/?error=session`);
      res.redirect(`${baseUrl}/onboarding`);
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      const logoutUrl = getLogoutUrl(baseUrl);
      res.json({ logoutUrl });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = db.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found' });
    }
    const { onboarding_complete, ...rest } = user;
    res.json({
      ...rest,
      onboardingComplete: !!user.onboarding_complete
    });
  });
}
