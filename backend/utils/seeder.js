const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Product = require('../models/Product');
const DigitalCode = require('../models/DigitalCode');

const sampleProducts = [
  // ==================== ROBLOX ====================
  {
    name: 'Roblox Gift Card $10 (Global)',
    description: 'Add $10 worth of Robux to your Roblox account instantly. Use it to buy limited items, avatar upgrades, game passes and more.',
    shortDescription: '$10 Roblox Gift Card - Instant Delivery',
    category: 'roblox',
    platform: 'Roblox',
    region: 'Global',
    price: 9.99,
    originalPrice: 10.00,
    tags: ['roblox', 'robux', 'gift-card'],
    image: 'https://images.unsplash.com/photo-1611996575749-79a3ae1e9d3f?w=400&q=80'
  },
  {
    name: 'Roblox Gift Card $25 (Global)',
    description: 'Add $25 worth of Robux to your account. Perfect for premium experiences and limited edition items.',
    shortDescription: '$25 Roblox Gift Card',
    category: 'roblox',
    platform: 'Roblox',
    region: 'Global',
    price: 24.99,
    originalPrice: 25.00,
    tags: ['roblox', 'robux'],
    image: 'https://images.unsplash.com/photo-1611996575749-79a3ae1e9d3f?w=400&q=80'
  },
  {
    name: 'Roblox 2000 Robux Top-up',
    description: 'Get 2000 Robux added directly to your Roblox account.',
    shortDescription: '2000 Robux Instant Top-up',
    category: 'roblox',
    platform: 'Roblox',
    region: 'Global',
    price: 24.99,
    originalPrice: 28.00,
    tags: ['roblox', 'robux'],
    image: 'https://images.unsplash.com/photo-1611996575749-79a3ae1e9d3f?w=400&q=80'
  },

  // ==================== MINECRAFT ====================
  {
    name: 'Minecraft: Java & Bedrock Edition',
    description: 'Get both Java and Bedrock editions of Minecraft for PC with one purchase. Explore infinite worlds.',
    shortDescription: 'Java and Bedrock editions for PC.',
    category: 'minecraft',
    platform: 'PC',
    region: 'Global',
    price: 29.99,
    originalPrice: 29.99,
    tags: ['minecraft', 'mojang', 'sandbox'],
    image: 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400&q=80'
  },
  {
    name: 'Minecraft 1720 Minecoins',
    description: 'Use Minecoins to purchase skins, texture packs, maps and more exciting content in the Minecraft Marketplace.',
    shortDescription: '1720 Minecoins for Minecraft Marketplace.',
    category: 'minecraft',
    platform: 'Multi-platform',
    region: 'Global',
    price: 9.99,
    originalPrice: 10.00,
    tags: ['minecoins', 'minecraft'],
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&q=80'
  },
  {
    name: 'Minecraft Dungeons: Ultimate Edition',
    description: 'Experience the full story of Minecraft Dungeons from the beginning to the End! Includes the base game and all six DLCs.',
    shortDescription: 'Complete Minecraft Dungeons experience.',
    category: 'minecraft',
    platform: 'PC',
    region: 'Global',
    price: 39.99,
    originalPrice: 39.99,
    tags: ['minecraft', 'dungeons'],
    image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&q=80'
  },

  // ==================== STEAM ====================
  {
    name: 'Steam Wallet $20 Gift Card (US)',
    description: 'Add $20 to your Steam wallet. Works on all Steam purchases including games, DLC, and in-game items.',
    shortDescription: 'Add $20 to your Steam wallet instantly.',
    category: 'steam',
    platform: 'Steam',
    region: 'US',
    price: 19.99,
    originalPrice: 20.00,
    tags: ['steam', 'gift-card'],
    image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&q=80'
  },
  {
    name: 'Steam Wallet $50 Gift Card (US)',
    description: 'Add $50 to your Steam wallet. Works on all Steam purchases.',
    shortDescription: 'Add $50 to your Steam wallet instantly.',
    category: 'steam',
    platform: 'Steam',
    region: 'US',
    price: 49.99,
    originalPrice: 50.00,
    tags: ['steam', 'gift-card'],
    image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&q=80'
  },
  {
    name: 'Steam Wallet 100 AED Gift Card (UAE)',
    description: 'Add 100 AED to your UAE Steam wallet.',
    shortDescription: '100 AED Steam credit for UAE store.',
    category: 'steam',
    platform: 'Steam',
    region: 'UAE',
    price: 27.50,
    originalPrice: 27.50,
    tags: ['steam', 'uae'],
    image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&q=80'
  },

  // ==================== DISCORD ====================
  {
    name: 'Discord Nitro - 1 Month',
    description: 'Get premium perks on Discord including animated avatars, custom emojis, 2 Server Boosts, and 100MB file uploads.',
    shortDescription: '1 month of Discord Nitro premium.',
    category: 'discord',
    platform: 'Discord',
    region: 'Global',
    price: 9.99,
    originalPrice: 9.99,
    tags: ['discord', 'nitro'],
    image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80'
  },
  {
    name: 'Discord Nitro Basic - 1 Month',
    description: 'The core Nitro features: use custom emojis anywhere, increased upload limit, and special badge.',
    shortDescription: 'Essential Discord perks for 1 month.',
    category: 'discord',
    platform: 'Discord',
    region: 'Global',
    price: 2.99,
    originalPrice: 2.99,
    tags: ['discord', 'nitro', 'basic'],
    image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80'
  },
  {
    name: 'Discord Nitro - 1 Year',
    description: 'Get a full year of Discord Nitro at a discounted price.',
    shortDescription: 'Save with 1 year of Discord Nitro.',
    category: 'discord',
    platform: 'Discord',
    region: 'Global',
    price: 99.99,
    originalPrice: 119.88,
    tags: ['discord', 'nitro', 'yearly'],
    image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80'
  },

  // ==================== CHATGPT & AI ====================
  {
    name: 'ChatGPT Plus - 1 Month Subscription',
    description: 'Get access to GPT-4, faster response times, and priority access to new features like DALL·E 3 and Browsing.',
    shortDescription: '1 month of ChatGPT Plus access.',
    category: 'chatgpt',
    platform: 'OpenAI',
    region: 'Global',
    price: 22.00,
    originalPrice: 25.00,
    tags: ['chatgpt', 'openai', 'ai'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80'
  },
  {
    name: 'Midjourney Basic Plan - 1 Month',
    description: 'Experience AI-powered art generation with Midjourney.',
    shortDescription: 'Generate AI art with Midjourney.',
    category: 'chatgpt',
    platform: 'Midjourney',
    region: 'Global',
    price: 12.00,
    originalPrice: 15.00,
    tags: ['midjourney', 'ai', 'art'],
    image: 'https://images.unsplash.com/photo-1615332579037-3c44b3660b53?w=400&q=80'
  },
  {
    name: 'Claude Pro - 1 Month Subscription',
    description: 'Get prioritized access to Claude, the helpful, harmless, and honest AI assistant from Anthropic.',
    shortDescription: '1 month of Claude Pro access.',
    category: 'chatgpt',
    platform: 'Anthropic',
    region: 'Global',
    price: 21.00,
    originalPrice: 21.00,
    tags: ['claude', 'anthropic', 'ai'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80'
  },

  // ==================== STREAMING (movies) ====================
  {
    name: 'Netflix $25 Gift Card',
    description: 'Redeem for Netflix service in the US. No credit card required to redeem.',
    shortDescription: '$25 Netflix streaming credit.',
    category: 'movies',
    platform: 'Netflix',
    region: 'US',
    price: 24.99,
    originalPrice: 25.00,
    tags: ['netflix', 'streaming'],
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&q=80'
  },
  {
    name: 'Disney+ 1 Month Subscription',
    description: 'Get 1 month of Disney+ for unlimited streaming of Disney, Pixar, Marvel, Star Wars, and National Geographic.',
    shortDescription: '1 month of Disney+ streaming.',
    category: 'movies',
    platform: 'Disney+',
    region: 'Global',
    price: 7.99,
    originalPrice: 9.99,
    tags: ['disney', 'streaming'],
    image: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?w=400&q=80'
  },
  {
    name: 'Spotify Premium 12 Months',
    description: 'Get 1 full year of Spotify Premium. Ad-free music, offline listening, and high-quality audio.',
    shortDescription: '1 year of Spotify Premium.',
    category: 'movies',
    platform: 'Spotify',
    region: 'Global',
    price: 99.00,
    originalPrice: 119.88,
    tags: ['spotify', 'music'],
    image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80'
  },

  // ==================== GIFT CARDS ====================
  {
    name: 'Apple Gift Card $10',
    description: 'Use it for products, accessories, apps, games, music, movies, and more.',
    shortDescription: '$10 Apple Store & iTunes credit.',
    category: 'gift-cards',
    platform: 'Apple',
    region: 'US',
    price: 10.00,
    originalPrice: 10.00,
    tags: ['apple', 'itunes'],
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80'
  },
  {
    name: 'PlayStation $25 Gift Card (US)',
    description: 'Add $25 to your PSN wallet for games, add-ons, and more.',
    shortDescription: '$25 credit for US PlayStation Store.',
    category: 'gift-cards',
    platform: 'PlayStation',
    region: 'US',
    price: 24.99,
    originalPrice: 25.00,
    tags: ['psn', 'playstation'],
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80'
  },
  {
    name: 'Xbox $50 Gift Card (US)',
    description: 'Add $50 to your Microsoft account for games and entertainment on Xbox and Windows.',
    shortDescription: '$50 credit for US Xbox Store.',
    category: 'gift-cards',
    platform: 'Xbox',
    region: 'US',
    price: 49.99,
    originalPrice: 50.00,
    tags: ['xbox', 'microsoft'],
    image: 'https://images.unsplash.com/photo-1621259182978-7cd433eff945?w=400&q=80'
  },

  // ==================== DIGITAL BOOKS ====================
  {
    name: 'The Art of Game Design - eBook',
    description: 'A comprehensive guide covering the principles of game design.',
    shortDescription: 'Essential guide for game designers.',
    category: 'ebooks',
    platform: 'PDF/EPUB',
    region: 'Global',
    price: 14.99,
    originalPrice: 29.99,
    tags: ['ebook', 'game-design'],
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80'
  },
  {
    name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.',
    shortDescription: 'The classic handbook for clean code.',
    category: 'ebooks',
    platform: 'PDF/Kindle',
    region: 'Global',
    price: 19.99,
    originalPrice: 35.00,
    tags: ['programming', 'clean-code'],
    image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&q=80'
  },
  {
    name: 'Digital Fortress - Dan Brown (eBook)',
    description: 'A thrilling techno-thriller from the author of The Da Vinci Code.',
    shortDescription: 'Techno-thriller by Dan Brown.',
    category: 'ebooks',
    platform: 'Kindle',
    region: 'Global',
    price: 9.99,
    originalPrice: 12.99,
    tags: ['thriller', 'ebook'],
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'
  },

  // ==================== GAMES ====================
  {
    name: 'Elden Ring - Steam Key Global',
    description: 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.',
    shortDescription: 'The award-winning RPG Elden Ring.',
    category: 'games',
    platform: 'Steam',
    region: 'Global',
    price: 49.99,
    originalPrice: 59.99,
    tags: ['elden-ring', 'rpg'],
    image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&q=80'
  },
  {
    name: 'Cyberpunk 2077: Ultimate Edition (GOG)',
    description: 'Includes the base game and the Phantom Liberty expansion.',
    shortDescription: 'Full Cyberpunk 2077 experience.',
    category: 'games',
    platform: 'GOG',
    region: 'Global',
    price: 54.99,
    originalPrice: 79.99,
    tags: ['cyberpunk', 'rpg'],
    image: 'https://images.unsplash.com/photo-1605898835373-52417658392a?w=400&q=80'
  },
  {
    name: 'FC 24 - Ultimate Edition PC',
    description: 'The world\'s game. EA SPORTS FC 24 brings you the most true-to-football experience ever.',
    shortDescription: 'The latest football sim from EA.',
    category: 'games',
    platform: 'EA App',
    region: 'Global',
    price: 69.99,
    originalPrice: 99.99,
    tags: ['fc24', 'football'],
    image: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=400&q=80'
  }
];

const generateCodes = (prefix, count) => {
  return Array.from({ length: count }, (_, i) =>
    `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${String(i + 1).padStart(4, '0')}`
  );
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      DigitalCode.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create owner user
    const owner = await User.create({
      name: 'Admin Owner',
      email: 'admin@digivault.com',
      password: 'Admin@123456',
      role: 'owner'
    });
    console.log('👤 Owner created: admin@digivault.com / Admin@123456');

    // Create sample user
    await User.create({
      name: 'John Doe',
      email: 'user@digivault.com',
      password: 'User@123456',
      role: 'user'
    });
    console.log('👤 Sample user created: user@digivault.com / User@123456');

    // Create products with codes
    for (const productData of sampleProducts) {
      const product = await Product.create({ ...productData, createdBy: owner._id });

      const prefix = product.name.split(' ')[0].toUpperCase().substring(0, 4);
      const codes = generateCodes(prefix, 20);

      const codeDocs = codes.map(code => ({
        product: product._id,
        code,
        addedBy: owner._id
      }));

      await DigitalCode.insertMany(codeDocs);
      await Product.findByIdAndUpdate(product._id, { stock: codes.length });

      console.log(`📦 Created: ${product.name} with ${codes.length} codes`);
    }

    console.log('\n✅ Seeding complete!');
    console.log('─────────────────────────────');
    console.log('🌐 Owner login:  admin@digivault.com / Admin@123456');
    console.log('🌐 User login:   user@digivault.com  / User@123456');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();