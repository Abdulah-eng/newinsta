export interface MockProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  membership_tier: 'basic' | 'premium' | 'elite';
  followers: number;
  following: number;
  bio: string;
  age_verified: boolean;
}

export interface MockPost {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  is_nsfw: boolean;
  location?: string;
  likes: number;
  comments: number;
  created_at: string;
  profiles: MockProfile;
}

export interface MockComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: Pick<MockProfile, 'full_name' | 'avatar_url'>;
}

const sampleAvatars = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612c7c8?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face'
];

const sampleImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1515064553891-bfcdc26e7e8d?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1477862096227-3a1bb3b08330?w=500&h=500&fit=crop'
];

const sampleNSFWImages = [
  'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&h=500&fit=crop&blur=50',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop&blur=50',
  'https://images.unsplash.com/photo-1594736797933-d0cc4bb8bfc6?w=500&h=500&fit=crop&blur=50',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=500&fit=crop&blur=50',
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500&h=500&fit=crop&blur=50'
];

const names = [
  'Alexandra Stone', 'Marcus Rivera', 'Sophia Chen', 'Devon Blake', 'Luna Martinez',
  'Phoenix Taylor', 'Isabella Rose', 'Carter Cross', 'Aria Wilde', 'Zane Cooper',
  'Scarlett Fox', 'Dante Knight', 'Nova Sterling', 'Raven Black', 'Atlas Grey',
  'Ember James', 'Sage Morgan', 'Kai Hunter', 'Violet Storm', 'Axel Reed'
];

const captions = [
  'Living my best life ✨',
  'Another day in paradise 🌴',
  'Grateful for moments like these',
  'Chasing sunsets and dreams',
  'Weekend vibes only',
  'Making memories that last forever',
  'Adventure awaits 🗺️',
  'Good vibes and good times',
  'Blessed beyond measure',
  'Life is beautiful when you choose to see it',
  'Coffee first, then the world ☕',
  'Dancing through life',
  'Find your wild and free',
  'Sunshine on my mind',
  'Creating my own sunshine',
  'Lost in the right direction',
  'Collect moments, not things',
  'Here\'s to the nights we won\'t remember',
  'Dream big, work hard, stay humble',
  'Life\'s too short for boring photos'
];

const nsfwCaptions = [
  'Feeling confident and free 🔥',
  'Artistic expression at its finest',
  'Embracing my authentic self',
  'Bold and beautiful',
  'Confidence is my best accessory',
  'Art has no boundaries',
  'Expressing my truth',
  'Beauty in all forms',
  'Unapologetically me',
  'Breaking barriers and stereotypes'
];

const locations = [
  'New York, NY', 'Los Angeles, CA', 'Miami, FL', 'Austin, TX', 'Chicago, IL',
  'San Francisco, CA', 'Las Vegas, NV', 'Seattle, WA', 'Denver, CO', 'Nashville, TN',
  'Atlanta, GA', 'Phoenix, AZ', 'San Diego, CA', 'Portland, OR', 'Boston, MA'
];

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateMockProfiles = (count: number = 20): MockProfile[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `profile_${index + 1}`,
    full_name: names[index] || `User ${index + 1}`,
    avatar_url: sampleAvatars[index % sampleAvatars.length],
    membership_tier: getRandomElement(['basic', 'premium', 'elite']),
    followers: getRandomNumber(100, 50000),
    following: getRandomNumber(50, 2000),
    bio: `Living life to the fullest • ${getRandomElement(['Artist', 'Photographer', 'Traveler', 'Creator', 'Entrepreneur', 'Model', 'Designer', 'Writer'])} • ${getRandomElement(locations)}`,
    age_verified: Math.random() > 0.3 // 70% chance of being age verified
  }));
};

export const generateMockPosts = (profiles: MockProfile[], count: number = 25): MockPost[] => {
  return Array.from({ length: count }, (_, index) => {
    const isNSFW = Math.random() < 0.15; // 15% chance of NSFW content
    const hasImage = Math.random() > 0.2; // 80% chance of having an image
    const hasLocation = Math.random() > 0.4; // 60% chance of having a location
    
    return {
      id: `post_${index + 1}`,
      author_id: getRandomElement(profiles).id,
      content: isNSFW ? getRandomElement(nsfwCaptions) : getRandomElement(captions),
      image_url: hasImage ? (isNSFW ? getRandomElement(sampleNSFWImages) : getRandomElement(sampleImages)) : undefined,
      video_url: Math.random() < 0.1 ? 'https://example.com/video.mp4' : undefined, // 10% chance of video
      is_nsfw: isNSFW,
      location: hasLocation ? getRandomElement(locations) : undefined,
      likes: getRandomNumber(10, 5000),
      comments: getRandomNumber(0, 200),
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Within last 7 days
      profiles: getRandomElement(profiles)
    };
  });
};

export const generateMockComments = (posts: MockPost[], profiles: MockProfile[], count: number = 100): MockComment[] => {
  const commentTexts = [
    'Amazing! 😍', 'Love this!', 'So beautiful', 'Goals! 💯', 'Incredible shot',
    'This is perfect', 'Stunning!', 'Wow! 🔥', 'Absolutely gorgeous', 'Love the vibes',
    'This is everything', 'So good!', 'Perfect timing', 'Beautiful capture',
    'This made my day', 'Incredible', 'Love the energy', 'So inspiring',
    'This is art', 'Gorgeous view', 'Amazing colors', 'Perfect lighting'
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `comment_${index + 1}`,
    post_id: getRandomElement(posts).id,
    author_id: getRandomElement(profiles).id,
    content: getRandomElement(commentTexts),
    created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Within last 24 hours
    profiles: {
      full_name: getRandomElement(profiles).full_name,
      avatar_url: getRandomElement(profiles).avatar_url
    }
  }));
};

// Create singleton instances for consistent data across components
export const mockProfiles = generateMockProfiles(20);
export const mockPosts = generateMockPosts(mockProfiles, 25);
export const mockComments = generateMockComments(mockPosts, mockProfiles, 100);

// Helper to get user's own posts for profile page
export const getUserMockPosts = (userId: string, count: number = 12): MockPost[] => {
  const userProfile = mockProfiles.find(p => p.id === userId) || mockProfiles[0];
  
  return Array.from({ length: count }, (_, index) => {
    const isNSFW = Math.random() < 0.2; // 20% chance for user's own posts
    const hasImage = Math.random() > 0.1; // 90% chance of having an image
    
    return {
      id: `user_post_${userId}_${index + 1}`,
      author_id: userId,
      content: isNSFW ? getRandomElement(nsfwCaptions) : getRandomElement(captions),
      image_url: hasImage ? (isNSFW ? getRandomElement(sampleNSFWImages) : getRandomElement(sampleImages)) : undefined,
      is_nsfw: isNSFW,
      location: Math.random() > 0.5 ? getRandomElement(locations) : undefined,
      likes: getRandomNumber(50, 2000),
      comments: getRandomNumber(5, 150),
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Within last 30 days
      profiles: userProfile
    };
  });
};