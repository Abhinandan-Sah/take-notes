import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';
import nodemailer from 'nodemailer'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/notes_app';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(express.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is up and running!");
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dateOfBirth: { type: String, required: false },
  otp: { type: String },
  otpExpires: { type: Date },
});

const User = mongoose.model('User', UserSchema);

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const Note = mongoose.model('Note', NoteSchema);

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user: { id: string } };
    req.user = decoded.user;
    next();
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(401).json({ message: 'Token is not valid.', error: message });
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

app.post('/api/auth/request-signup-otp', async (req: Request, res: Response) => {
  const { name, dateOfBirth, email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    const newUser = new User({ name, email, dateOfBirth, otp, otpExpires });
    await newUser.save();

    await sendEmail(email, 'Your Sign-up OTP', `Your OTP for notes-app sign up is: ${otp}`);

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ success: false, message: 'Server error.', error: message });
  }
});

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email.' });
    }

    if (!user.otp || user.otp !== otp || !user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, message: 'Signup successful.', token });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ success: false, message: 'Server error.', error: message });
  }
});

app.post('/api/auth/request-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up first.' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(email, 'Your Login OTP', `Your OTP for notes-app login is: ${otp}`);

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ success: false, message: 'Server error.', error: message });
  }
});


app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (!user.otp || user.otp !== otp || !user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, message: 'Login successful.', token });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ success: false, message: 'Server error.', error: message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token.' });
    }
    const user = await User.findById(req.user.id).select('-otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ message: 'Server error.', error: message });
  }
});

app.post('/api/notes/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token.' });
    }
    const { title, content } = req.body;
    const newNote = new Note({
      title,
      content,
      user: req.user.id,
    });
    const note = await newNote.save();
    res.status(201).json(note);
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ message: 'Server error.', error: message });
  }
});

app.get('/api/notes/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token.' });
    }
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ message: 'Server error.', error: message });
  }
});

app.delete('/api/notes/delete/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User ID not found in token.' });
    }
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found or you are not the owner.' });
    }
    res.json({ message: 'Note deleted successfully.' });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ message: 'Server error.', error: message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
