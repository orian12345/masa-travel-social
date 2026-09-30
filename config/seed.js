require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('../models/User');
const Group = require('../models/Group');
const Post = require('../models/Post');
const Message = require('../models/Message');
const ChatRequest = require('../models/ChatRequest');

const usersData = [
  { username: 'michal', passwordHash: 'password1', displayName: 'מיכל כהן', age: 27, bio: 'אוהבת אוכל ויין, פחות מוזיאונים.', languages: ['עברית', 'אנגלית'], travelStyle: 'relaxed', verified: true },
  { username: 'yuval', passwordHash: 'password1', displayName: 'יובל לוי', age: 25, bio: 'תרמילאי ותיק, תמיד בדרכים.', languages: ['עברית', 'אנגלית', 'ספרדית'], travelStyle: 'backpacking', verified: true },
  { username: 'noa', passwordHash: 'password1', displayName: 'נועה ברק', age: 29, bio: 'אוהבת חיי לילה ומסיבות רחוב.', languages: ['עברית', 'אנגלית'], travelStyle: 'nightlife', verified: false },
  { username: 'itai', passwordHash: 'password1', displayName: 'איתי ברק', age: 31, bio: 'צלם חובב, קם מוקדם לזריחות.', languages: ['עברית', 'אנגלית', 'איטלקית'], travelStyle: 'museums', verified: true },
  { username: 'shira', passwordHash: 'password1', displayName: 'שירה נוי', age: 26, bio: 'מטיילת עם קבוצות גדולות, אוהבת לתכנן הכל.', languages: ['עברית', 'צרפתית'], travelStyle: 'backpacking', verified: true },
  { username: 'roi', passwordHash: 'password1', displayName: 'רועי אבן', age: 34, bio: 'טיולי משפחה עם שני ילדים.', languages: ['עברית', 'אנגלית'], travelStyle: 'family', verified: false },
  { username: 'dana', passwordHash: 'password1', displayName: 'דנה לוי', age: 24, bio: 'בטן-גב מקצועית, אוהבת בתי קפה.', languages: ['עברית'], travelStyle: 'relaxed', verified: false },
  { username: 'nir', passwordHash: 'password1', displayName: 'ניר כהן', age: 30, bio: 'ממליץ מומחה לאוכל איטלקי.', languages: ['עברית', 'אנגלית', 'איטלקית'], travelStyle: 'museums', verified: true },
];

const groupsData = [
  { name: 'מטיילים ברומא', destination: 'רומא, איטליה', description: 'קבוצה למי שמתכנן/ת טיול לרומא', adminUsername: 'nir' },
  { name: 'מטיילים בבנגקוק - אוגוסט 2026', destination: 'בנגקוק, תאילנד', description: 'תיאום טיולים משותפים בתאילנד', adminUsername: 'yuval' },
  { name: 'מטיילים בליסבון', destination: 'ליסבון, פורטוגל', description: 'חיי לילה, בתי קפה והמלצות מקומיות', adminUsername: 'noa' },
  { name: 'מטיילים ביפן', destination: 'יפן', description: 'מסלולים, תרבות ואוכל ביפן', adminUsername: 'shira' },
];

const postsTemplates = [
  {
    username: 'michal',
    type: 'partner',
    title: 'מחפשת שותפה לסיור קולינרי ברומא',
    content: 'מחפשת שותפה לסיור טעימות ברובע טרסטבורה, קצב רגוע.',
    destination: 'רומא, איטליה',
    tags: ['בטן־גב', 'אוכל'],
    budgetPerDay: 45,
    group: 'מטיילים ברומא',
    screeningQuestions: [
      { question: 'מה אופי הטיול שאת/ה מחפש/ת?', options: ['רגוע', 'עמוס', 'מסיבות', 'תרבות'] },
      { question: 'מהו התקציב המשוער שלך ליום?', options: ['עד 30€', '30-60€', '60-100€', '100€+'] },
    ],
  },
  { username: 'nir', type: 'recommendation', title: 'Trattoria da Enzo', content: 'פסטה קרבונרה אמיתית בלי תיירים מסביב. חובה להזמין מקום מראש.', destination: 'רומא, איטליה', tags: ['אוכל'], budgetPerDay: 25, group: 'מטיילים ברומא' },
  { username: 'itai', type: 'recommendation', title: 'הקולוסיאום בזריחה', content: 'הגיעו ב-7:00 - בלי תור, בלי קהל, אור מושלם לתמונות.', destination: 'רומא, איטליה', tags: ['אטרקציות', 'צילום'], group: 'מטיילים ברומא' },
  { username: 'yuval', type: 'partner', title: 'שותפים לדירה בבנגקוק', content: 'מחפש שותפים לדירה + חלוקת מוניות ל-3 ימים חופפים.', destination: 'בנגקוק, תאילנד', tags: ['תקציב נמוך'], budgetPerDay: 20, group: 'מטיילים בבנגקוק - אוגוסט 2026' },
  { username: 'dana', type: 'partner', title: 'מצטרפת לקבוצה לבנגקוק', content: 'מגיעה לבד, אשמח להצטרף לקבוצה קיימת.', destination: 'בנגקוק, תאילנד', tags: ['תרמילאות'], budgetPerDay: 30, group: 'מטיילים בבנגקוק - אוגוסט 2026' },
  { username: 'noa', type: 'partner', title: 'יציאה לבר הערב בליסבון', content: 'מי בעניין לצאת הערב באיזור ביירו אלטו?', destination: 'ליסבון, פורטוגל', tags: ['מסיבות'], group: 'מטיילים בליסבון' },
  { username: 'roi', type: 'recommendation', title: 'מסיבת רחוב בבאיירו אלטו', content: 'כל יום שישי בשכונה - כניסה חופשית ומוזיקה חיה עד הבוקר.', destination: 'ליסבון, פורטוגל', tags: ['חיי לילה'], group: 'מטיילים בליסבון' },
  { username: 'shira', type: 'recommendation', title: 'מסלול יום שלם בקיוטו', content: 'מקדשים, יער במבוק וטקס תה מסורתי.', destination: 'יפן', tags: ['תרבות', 'מסלולים'], budgetPerDay: 35, group: 'מטיילים ביפן' },
  { username: 'itai', type: 'partner', title: 'צילום בפסטיבל פנסים צפים', content: 'מחפש שותף/ה לצילום בפסטיבל פנסים בצ׳יאנג מאי.', destination: 'צ׳יאנג מאי, תאילנד', tags: ['צילום'] },
  { username: 'michal', type: 'recommendation', title: 'Gelateria dei Gracchi', content: 'הגלידה הכי טובה שאכלתי באיטליה.', destination: 'רומא, איטליה', tags: ['אוכל'], group: 'מטיילים ברומא' },
  { username: 'noa', type: 'partner', title: 'טיול ספונטני לליסבון', content: 'טסה בעוד שבועיים, מחפשת שותפים לרגע האחרון.', destination: 'ליסבון, פורטוגל', tags: ['ספונטני'] },
  { username: 'roi', type: 'recommendation', title: 'פארק שעשועים ידידותי למשפחות', content: 'מומלץ מאוד לילדים עד גיל 10, יש הנחת קבוצה.', destination: 'בנגקוק, תאילנד', tags: ['משפחות'], group: 'מטיילים בבנגקוק - אוגוסט 2026' },
  { username: 'dana', type: 'recommendation', title: 'בית קפה עם נוף לקולוסיאום', content: 'המקום המושלם לפוסט אינסטגרם ולקפה איטלקי אמיתי.', destination: 'רומא, איטליה', tags: ['בטן־גב'], group: 'מטיילים ברומא' },
  { username: 'shira', type: 'partner', title: 'קבוצה למסלול הרים ביפן', content: 'מארגנת קבוצה של 6 להליכה בהרי היפנים, קצב בינוני.', destination: 'יפן', tags: ['תרמילאות'], group: 'מטיילים ביפן' },
  { username: 'yuval', type: 'recommendation', title: 'שוק לילה מקומי', content: 'אוכל רחוב אותנטי במחירים נמוכים, פחות תיירים.', destination: 'בנגקוק, תאילנד', tags: ['אוכל', 'תקציב נמוך'], group: 'מטיילים בבנגקוק - אוגוסט 2026' },
];

async function seed() {
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Post.deleteMany({}),
    Message.deleteMany({}),
    ChatRequest.deleteMany({}),
  ]);

  console.log('Creating users...');
  const usersByUsername = {};
  for (const data of usersData) {
    const user = await User.create(data);
    usersByUsername[data.username] = user;
  }

  console.log('Creating groups...');
  const groupsByName = {};
  for (const data of groupsData) {
    const admin = usersByUsername[data.adminUsername];
    // Seed 2-4 extra members per group besides the admin, for realistic size.
    const otherUsers = Object.values(usersByUsername).filter((u) => u._id.toString() !== admin._id.toString());
    const memberCount = 2 + Math.floor(Math.random() * 3);
    const members = [admin._id, ...otherUsers.slice(0, memberCount).map((u) => u._id)];

    const group = await Group.create({
      name: data.name,
      destination: data.destination,
      description: data.description,
      admin: admin._id,
      members,
    });
    groupsByName[data.name] = group;
  }

  console.log('Creating posts spread across the last 6 months...');
  let michalRomePost = null;
  for (let i = 0; i < postsTemplates.length; i++) {
    const t = postsTemplates[i];
    const author = usersByUsername[t.username];
    const group = t.group ? groupsByName[t.group] : null;

    const monthsAgo = i % 6;
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - monthsAgo);
    createdAt.setDate(1 + (i % 25));

    const post = await Post.create({
      author: author._id,
      group: group ? group._id : null,
      type: t.type,
      title: t.title,
      content: t.content,
      destination: t.destination,
      tags: t.tags || [],
      budgetPerDay: t.budgetPerDay,
      screeningQuestions: t.screeningQuestions || [],
    });
    // Override the auto-set timestamp so posts spread realistically across months.
    await Post.updateOne({ _id: post._id }, { createdAt });
    if (i === 0) michalRomePost = post;
  }

  console.log('Creating a sample chat thread...');
  const michal = usersByUsername.michal;
  const yuval = usersByUsername.yuval;

  // The seeded messages below only make sense if these two are already
  // allowed to chat — so seed the approved request the real flow would
  // have produced.
  await ChatRequest.create({
    fromUser: yuval._id,
    toUser: michal._id,
    answers: [],
    status: 'approved',
  });

  const roomId = Message.roomFor(michal._id, yuval._id);
  await Message.create([
    { roomId, sender: michal._id, recipient: yuval._id, text: 'היי! ראיתי שאתה גם מתכנן טיול לבנגקוק' },
    { roomId, sender: yuval._id, recipient: michal._id, text: 'כן! מגיע בעוד שבועיים, אתה/את?' },
    { roomId, sender: michal._id, recipient: yuval._id, text: 'גם אני, בואו נתאם משהו ביחד' },
  ]);

  console.log('Creating a sample pending chat request...');
  await ChatRequest.create({
    post: michalRomePost._id,
    fromUser: usersByUsername.dana._id,
    toUser: michal._id,
    answers: [
      { question: 'מה אופי הטיול שאת/ה מחפש/ת?', answer: 'רגוע' },
      { question: 'מהו התקציב המשוער שלך ליום?', answer: '30-60€' },
    ],
    status: 'pending',
  });

  console.log('Seed complete.');
  console.log('Demo login: username "michal", password "password1" (all seeded users share this password).');
}

module.exports = seed;

// Only auto-run (connect, seed, disconnect, exit) when invoked directly as
// `node config/seed.js` / `npm run seed`. A caller that already manages its
// own connection (e.g. a demo script reusing an in-memory Mongo instance)
// requires this file and calls seed() itself instead.
if (require.main === module) {
  connectDB()
    .then(() => seed())
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
