import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import { generateToken, AuthRequest } from '../middleware/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'ecocivic-super-secure-production-jwt-key-2026';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'Please provide all required fields (Name, Email, Phone, Password).' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    // Security rule: Workers cannot self-register without admin authorization
    if (role === 'worker' || role === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Direct self-registration as a Field Worker or Administrator is prohibited. Worker accounts must be created or approved by the Municipal Administration.',
      });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role: 'citizen',
      accountStatus: 'active',
    });

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed due to a server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role: intendedRole } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
      return;
    }

    if (user.accountStatus !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Your account is currently inactive or pending administrative approval.',
      });
      return;
    }

    // Role verification against backend: citizens cannot log into worker interface and vice-versa
    if (intendedRole && user.role !== intendedRole && user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: `Account role mismatch: This account is registered as a "${user.role.toUpperCase()}", not a "${intendedRole.toUpperCase()}". Please switch to the correct portal tab.`,
      });
      return;
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Sign in successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        workerDetails: user.workerDetails,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Authentication error occurred.' });
  }
});

// POST /api/auth/quick-login (Demo Helper)
router.post('/quick-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    let query: any = { role: 'citizen' };
    if (role === 'worker') query = { role: 'worker' };
    if (role === 'admin') query = { role: 'admin' };

    const user = await User.findOne(query);
    if (!user) {
      res.status(404).json({ success: false, message: 'Demo account not found. Please re-seed the database.' });
      return;
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: `Signed in as demonstration ${user.role} (${user.name}).`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        workerDetails: user.workerDetails,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Quick login failed.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.json({ success: false, user: null });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await User.findById(decoded.id);

    if (!user || user.accountStatus !== 'active') {
      res.json({ success: false, user: null });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        workerDetails: user.workerDetails,
      },
    });
  } catch (err) {
    res.json({ success: false, user: null });
  }
});

export default router;
