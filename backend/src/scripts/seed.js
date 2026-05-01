/**
 * Seed script — populates the database with demo content and a test admin user.
 * Run with: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Content = require('../models/Content');

const CONTENT_ITEMS = [
  // Technology
  {
    title: 'The Future of Artificial Intelligence in 2025',
    description:
      'AI is transforming industries at an unprecedented pace. From healthcare diagnostics to autonomous vehicles, machine learning models are now embedded in every aspect of modern life. This article explores key trends shaping the AI landscape this year.',
    category: 'technology',
    tags: ['AI', 'machine learning', 'deep learning', 'future tech'],
    author: 'Jane Doe',
    imageUrl: 'https://picsum.photos/seed/ai/800/450',
  },
  {
    title: 'React 19: What Developers Need to Know',
    description:
      'React 19 ships with concurrent rendering improvements, the new `use` hook, and server actions. We walk through the most impactful features and how to migrate from React 18.',
    category: 'technology',
    tags: ['react', 'javascript', 'frontend', 'web development'],
    author: 'Alex Chen',
    imageUrl: 'https://picsum.photos/seed/react/800/450',
  },
  {
    title: 'Quantum Computing: Closer Than You Think',
    description:
      'Major technology companies are racing to achieve quantum advantage. We explain the fundamentals of qubits, superposition, and entanglement, and why this matters for cryptography, drug discovery, and optimisation problems.',
    category: 'technology',
    tags: ['quantum computing', 'physics', 'cryptography'],
    author: 'Maria Santos',
    imageUrl: 'https://picsum.photos/seed/quantum/800/450',
  },
  {
    title: 'Node.js Performance Tips for High-Traffic APIs',
    description:
      'Serving millions of requests per day requires careful attention to event loop blocking, memory leaks, and I/O strategies. Learn the most effective patterns for building fast, resilient Node.js services.',
    category: 'technology',
    tags: ['nodejs', 'backend', 'performance', 'api'],
    author: 'Sam Williams',
    imageUrl: 'https://picsum.photos/seed/nodejs/800/450',
  },
  // Science
  {
    title: "CRISPR Gene Editing: Curing Diseases at the DNA Level",
    description:
      'Scientists have successfully treated sickle-cell disease and beta-thalassemia using CRISPR-Cas9. We explore the breakthrough, the ethical debates, and what comes next.',
    category: 'science',
    tags: ['genetics', 'CRISPR', 'biology', 'medicine'],
    author: 'Dr. Priya Patel',
    imageUrl: 'https://picsum.photos/seed/crispr/800/450',
  },
  {
    title: 'Webb Telescope Reveals Earliest Galaxies',
    description:
      'NASA\'s James Webb Space Telescope has captured light from galaxies formed just 300 million years after the Big Bang, pushing the boundaries of our understanding of cosmic history.',
    category: 'science',
    tags: ['astronomy', 'space', 'telescope', 'NASA'],
    author: 'Carlos Rivera',
    imageUrl: 'https://picsum.photos/seed/jwst/800/450',
  },
  // Sports
  {
    title: 'Data Analytics Is Changing the Way Teams Scout Players',
    description:
      'From xG metrics in football to WAR in baseball, advanced statistics have become indispensable in modern sport. We look at how clubs are using data science to gain a competitive edge.',
    category: 'sports',
    tags: ['analytics', 'football', 'baseball', 'data science'],
    author: 'Tom Bradley',
    imageUrl: 'https://picsum.photos/seed/sports/800/450',
  },
  {
    title: 'The Mental Health Challenge Facing Elite Athletes',
    description:
      'High-profile athletes are speaking out about anxiety, burnout, and depression. The conversation is changing how sport handles mental wellbeing at the highest levels.',
    category: 'sports',
    tags: ['mental health', 'athletes', 'wellbeing'],
    author: 'Lisa Park',
    imageUrl: 'https://picsum.photos/seed/athlete/800/450',
  },
  // Health
  {
    title: '10 Evidence-Based Habits for a Longer Life',
    description:
      'Researchers analysed data from 100,000 adults over 30 years. The findings confirm that sleep, diet, social connection, and moderate exercise are the strongest predictors of longevity.',
    category: 'health',
    tags: ['longevity', 'habits', 'nutrition', 'sleep'],
    author: 'Dr. Aisha Johnson',
    imageUrl: 'https://picsum.photos/seed/health/800/450',
  },
  {
    title: 'Gut Microbiome and Mental Health: The Gut-Brain Axis',
    description:
      'Emerging research suggests the trillions of bacteria in your gut may influence mood, anxiety, and cognition. We explore the science of the gut-brain connection.',
    category: 'health',
    tags: ['microbiome', 'mental health', 'gut health', 'neuroscience'],
    author: 'Dr. Wei Zhang',
    imageUrl: 'https://picsum.photos/seed/gut/800/450',
  },
  // Business
  {
    title: 'How Startups Are Disrupting Traditional Banking',
    description:
      'Fintech companies like Revolut, Stripe, and Wise are capturing market share from incumbent banks by offering lower fees, faster transactions, and superior UX. What does this mean for the future of finance?',
    category: 'business',
    tags: ['fintech', 'banking', 'startup', 'finance'],
    author: 'Emma Wilson',
    imageUrl: 'https://picsum.photos/seed/fintech/800/450',
  },
  {
    title: 'The Rise of the Four-Day Work Week',
    description:
      'Companies across Europe and North America are trialling a four-day work week with no pay cut. Early results show higher productivity, lower absenteeism, and happier employees.',
    category: 'business',
    tags: ['work life balance', 'productivity', 'management'],
    author: 'Sophie Turner',
    imageUrl: 'https://picsum.photos/seed/workweek/800/450',
  },
  // Entertainment
  {
    title: 'Streaming Wars: Who Is Winning in 2025?',
    description:
      'Netflix, Disney+, Apple TV+ and Amazon Prime are all competing for eyeballs. We break down subscriber numbers, original content strategies, and where the market is heading.',
    category: 'entertainment',
    tags: ['streaming', 'Netflix', 'Disney', 'media'],
    author: 'Jake Harrison',
    imageUrl: 'https://picsum.photos/seed/streaming/800/450',
  },
  {
    title: 'AI-Generated Music: Creativity or Threat?',
    description:
      'Tools like Suno and Udio can produce studio-quality tracks in seconds. We ask musicians, producers, and ethicists what this means for the music industry.',
    category: 'entertainment',
    tags: ['AI music', 'creativity', 'music industry'],
    author: 'Mia Johnson',
    imageUrl: 'https://picsum.photos/seed/aimusic/800/450',
  },
  // Education
  {
    title: 'How AI Tutors Are Personalising Learning',
    description:
      'Adaptive learning platforms powered by AI can now identify knowledge gaps and adjust content in real time, making education more effective than traditional one-size-fits-all approaches.',
    category: 'education',
    tags: ['AI', 'e-learning', 'edtech', 'personalised learning'],
    author: 'Prof. Alan Lee',
    imageUrl: 'https://picsum.photos/seed/edtech/800/450',
  },
  {
    title: 'Top 10 Free Online Courses to Boost Your Career',
    description:
      'From machine learning on Coursera to cloud computing on AWS, we round up the best free online courses that can transform your career prospects in 2025.',
    category: 'education',
    tags: ['online learning', 'career', 'skills', 'MOOCs'],
    author: 'Rachel Adams',
    imageUrl: 'https://picsum.photos/seed/courses/800/450',
  },
  // Travel
  {
    title: "Japan in Cherry Blossom Season: A Traveller's Guide",
    description:
      'Sakura season transforms Japan into a dreamlike landscape of pink and white. We cover the best spots, timing, and travel tips for experiencing hanami at its finest.',
    category: 'travel',
    tags: ['Japan', 'cherry blossom', 'travel guide', 'Asia'],
    author: 'Yuki Tanaka',
    imageUrl: 'https://picsum.photos/seed/japan/800/450',
  },
  {
    title: 'Sustainable Travel: How to Explore Without Harming the Planet',
    description:
      'Eco-conscious travellers are choosing slow travel, carbon offsetting, and local experiences over mass tourism. Here is how to minimise your environmental footprint while still seeing the world.',
    category: 'travel',
    tags: ['sustainable travel', 'eco tourism', 'environment'],
    author: 'Lena Fischer',
    imageUrl: 'https://picsum.photos/seed/ecotravel/800/450',
  },
  // Food
  {
    title: 'The Science of Fermentation: Why Gut-Friendly Foods Are Trending',
    description:
      'Kombucha, kimchi, kefir, and sourdough are enjoying a renaissance. We explore the science behind fermentation and why these foods are so beneficial for gut health.',
    category: 'food',
    tags: ['fermentation', 'gut health', 'nutrition', 'probiotics'],
    author: 'Chef Isabelle Morel',
    imageUrl: 'https://picsum.photos/seed/ferment/800/450',
  },
  {
    title: 'Plant-Based Meat: Taste Test and Nutrition Breakdown',
    description:
      'Impossible Burger, Beyond Meat, and new competitors are getting closer to mimicking real meat. We put them to a blind taste test and compare their nutritional profiles.',
    category: 'food',
    tags: ['plant-based', 'vegan', 'nutrition', 'food tech'],
    author: 'Marcus Green',
    imageUrl: 'https://picsum.photos/seed/plantmeat/800/450',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recommendation_engine';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([Content.deleteMany({}), User.deleteMany({})]);
  console.log('Cleared existing data');

  // Insert content
  const contents = await Content.insertMany(
    CONTENT_ITEMS.map((item, i) => ({
      ...item,
      viewCount: Math.floor(Math.random() * 5000),
      likeCount: Math.floor(Math.random() * 500),
      shareCount: Math.floor(Math.random() * 200),
      publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Stagger over 20 days
    }))
  );
  console.log(`Inserted ${contents.length} content items`);

  // Create an admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    preferences: {
      categories: ['technology', 'science'],
      tags: ['AI', 'machine learning'],
    },
  });
  console.log('Created admin user:', admin.email, '/ password: admin123');

  // Create a demo user
  const demo = await User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'demo1234',
    preferences: {
      categories: ['technology', 'health', 'food'],
      tags: ['AI', 'nutrition'],
    },
  });
  console.log('Created demo user:', demo.email, '/ password: demo1234');

  await mongoose.disconnect();
  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
