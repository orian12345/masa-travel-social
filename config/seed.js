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

  // Additional fictional users, mainly to author the Europe-wide recommendation posts below.
  { username: 'tamar', passwordHash: 'password1', displayName: 'תמר גולן', age: 28, bio: 'חובבת אמנות ומוזיאונים, תמיד עם מצלמה.', languages: ['עברית', 'אנגלית', 'גרמנית'], travelStyle: 'museums', verified: true },
  { username: 'omer', passwordHash: 'password1', displayName: 'עומר פרץ', age: 32, bio: 'תרמילאי מקצועי, אוהב הרים ומסלולי הליכה.', languages: ['עברית', 'אנגלית'], travelStyle: 'backpacking', verified: true },
  { username: 'maya', passwordHash: 'password1', displayName: 'מאיה שלו', age: 25, bio: 'חיי לילה, פסטיבלים ומוזיקה חיה.', languages: ['עברית', 'אנגלית', 'ספרדית'], travelStyle: 'nightlife', verified: false },
  { username: 'eyal', passwordHash: 'password1', displayName: 'אייל מזרחי', age: 30, bio: 'טס עם המשפחה, תמיד מחפש פעילויות לילדים.', languages: ['עברית', 'אנגלית'], travelStyle: 'family', verified: true },
  { username: 'hila', passwordHash: 'password1', displayName: 'הילה בן־דוד', age: 27, bio: 'בטן־גב, קפה טוב ונופים יפים.', languages: ['עברית', 'אנגלית', 'צרפתית'], travelStyle: 'relaxed', verified: true },
  { username: 'gilad', passwordHash: 'password1', displayName: 'גלעד עמר', age: 35, bio: 'היסטוריה ואדריכלות אירופאית.', languages: ['עברית', 'אנגלית', 'איטלקית'], travelStyle: 'museums', verified: true },
  { username: 'keren', passwordHash: 'password1', displayName: 'קרן טל', age: 24, bio: 'תרמילאית עם תקציב נמוך ורשימת יעדים ארוכה.', languages: ['עברית', 'אנגלית'], travelStyle: 'backpacking', verified: false },
  { username: 'amit', passwordHash: 'password1', displayName: 'עמית שרעבי', age: 29, bio: 'מחפש את הבר הכי טוב בכל עיר.', languages: ['עברית', 'אנגלית'], travelStyle: 'nightlife', verified: true },
  { username: 'lior', passwordHash: 'password1', displayName: 'ליאור כץ', age: 31, bio: 'טיולים רגועים, בלי לחץ ובלי תוכנית קשיחה.', languages: ['עברית', 'אנגלית', 'גרמנית'], travelStyle: 'relaxed', verified: true },
  { username: 'yael', passwordHash: 'password1', displayName: 'יעל רוזן', age: 26, bio: 'מוזיאונים, גלריות ואדריכלות.', languages: ['עברית', 'אנגלית', 'רוסית'], travelStyle: 'museums', verified: true },
  { username: 'dor', passwordHash: 'password1', displayName: 'דור אברהם', age: 33, bio: 'תרמילאי שמתכנן הכל תוך כדי תנועה.', languages: ['עברית', 'אנגלית'], travelStyle: 'backpacking', verified: false },
  { username: 'shani', passwordHash: 'password1', displayName: 'שני כהן', age: 28, bio: 'נוסעת עם בן הזוג, אוהבת ספא ונופים.', languages: ['עברית', 'אנגלית'], travelStyle: 'family', verified: true },
  { username: 'ronen', passwordHash: 'password1', displayName: 'רונן ברק', age: 36, bio: 'טיולי היסטוריה ותרבות בקצב נינוח.', languages: ['עברית', 'אנגלית', 'ספרדית'], travelStyle: 'relaxed', verified: true },
  { username: 'adi', passwordHash: 'password1', displayName: 'עדי מלכה', age: 24, bio: 'חופים, שקיעות וחיי לילה.', languages: ['עברית', 'אנגלית'], travelStyle: 'nightlife', verified: false },
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

  // Recommendation posts spanning most of Europe, one country each.
  { username: 'tamar', type: 'recommendation', title: 'מוזיאון אורסה בבוקר מוקדם', content: 'הגיעו לפתיחה ב-9:30 - בלי תורים, ואפשר לראות את ואן גוך בשקט.', destination: 'פריז, צרפת', tags: ['תרבות', 'אמנות'] },
  { username: 'amit', type: 'recommendation', title: 'Park Güell מוקדם בבוקר', content: 'כניסה חינם עד 8:00, ואחר כך יורדים ללה רמבלה לטאפאס.', destination: 'ברצלונה, ספרד', tags: ['אדריכלות', 'חיי לילה'] },
  { username: 'lior', type: 'recommendation', title: 'East Side Gallery + שוק אוכל', content: 'קטע מקיר ברלין עם גרפיטי מרשים, ואחר כך שוק Markthalle Neun לאוכל רחוב.', destination: 'ברלין, גרמניה', tags: ['היסטוריה', 'אוכל'] },
  { username: 'yael', type: 'recommendation', title: 'Tate Modern + Borough Market', content: 'כניסה חינמית לתערוכת הקבע, ואחר כך שוק בורו לצהריים משובח.', destination: 'לונדון, בריטניה', tags: ['תרבות', 'אוכל'] },
  { username: 'dor', type: 'recommendation', title: 'סיור אופניים לאורך התעלות', content: 'שוכרים אופניים ליום שלם ומסתובבים בין התעלות, הרבה יותר כיף מאשר סיור רגלי.', destination: 'אמסטרדם, הולנד', tags: ['אופניים', 'נוף'] },
  { username: 'hila', type: 'recommendation', title: 'שקיעה מ-Oia בלי הקהל', content: 'הגיעו 30 דקות מוקדם וקחו נקודת תצפית קצת יותר צפונה מהכיכר הראשית.', destination: 'סנטוריני, יוון', tags: ['שקיעה', 'רומנטי'] },
  { username: 'gilad', type: 'recommendation', title: 'קונצרט קלאסי בכרטיס עמידה', content: 'באופרה הממלכתית יש כרטיסי עמידה זולים מאוד לסטודנטים ולצעירים.', destination: 'וינה, אוסטריה', tags: ['מוזיקה', 'תרבות'] },
  { username: 'omer', type: 'recommendation', title: 'פאראגליידינג מעל האגמים', content: 'הנוף על האגמים הטורקיז מלמעלה הוא חוויה שלא שוכחים, מומלץ להזמין מראש.', destination: 'אינטרלאקן, שוויץ', tags: ['הרפתקה', 'טבע'] },
  { username: 'keren', type: 'recommendation', title: 'תעלות וופל אמיתי', content: 'עיר קטנה וציורית, ופלים טריים מכל פינה - שווה ללון לילה אחד לפחות.', destination: 'בריז, בלגיה', tags: ['אוכל', 'נוף'] },
  { username: 'eyal', type: 'recommendation', title: 'הטירה בפראג בזריחה', content: 'מגיעים לפני 8:00 ומקבלים את כל הטירה כמעט לבד, מושלם לתמונות משפחתיות.', destination: 'פראג, צ׳כיה', tags: ['אדריכלות', 'משפחות'] },
  { username: 'shani', type: 'recommendation', title: 'מרחצאות תרמיים Széchenyi', content: 'ספא חיצוני ענק עם מים חמים כל השנה, מושלם ליום מנוחה עם הילדים.', destination: 'בודפשט, הונגריה', tags: ['רלקסציה', 'משפחות'] },
  { username: 'ronen', type: 'recommendation', title: 'הרובע היהודי קז׳ימייז׳', content: 'בתי כנסת עתיקים ובתי קפה קטנים - חלק חשוב מההיסטוריה שכדאי להכיר.', destination: 'קרקוב, פולין', tags: ['היסטוריה', 'תרבות'] },
  { username: 'adi', type: 'recommendation', title: 'חומות העיר העתיקה + שייט ללוקרום', content: 'הליכה על החומות בשעות הבוקר, ואחר הצהריים שייט קצר לאי השקט.', destination: 'דוברובניק, קרואטיה', tags: ['נוף', 'ים'] },
  { username: 'maya', type: 'recommendation', title: 'פאב עם מוזיקה חיה', content: 'ברחוב טמפל בר יש כמה פאבים עם נגנים חיים כל ערב, כניסה חופשית.', destination: 'דבלין, אירלנד', tags: ['מוזיקה', 'חיי לילה'] },
  { username: 'tamar', type: 'recommendation', title: 'Nyhavn בשעות הערב', content: 'הבתים הצבעוניים לאורך התעלה נראים הכי טוב עם התאורה של הערב.', destination: 'קופנהגן, דנמרק', tags: ['אדריכלות', 'נוף'] },
  { username: 'amit', type: 'recommendation', title: 'העיר העתיקה גמלה סטאן', content: 'רחובות אבן צרים, אדריכלות מימי הביניים ובתי קפה חמודים בכל פינה.', destination: 'שטוקהולם, שוודיה', tags: ['היסטוריה', 'אדריכלות'] },
  { username: 'lior', type: 'recommendation', title: 'רכבל להרים והפיורדים', content: 'מהרכבל Fløibanen יש נוף פנורמי על העיר וההרים הסובבים, שווה את זה.', destination: 'ברגן, נורווגיה', tags: ['טבע', 'נוף'] },
  { username: 'yael', type: 'recommendation', title: 'סאונה פינית אותנטית', content: 'חוויה מקומית אמיתית - סאונה ואז קפיצה למים הקרים, ממש כמו שהתושבים עושים.', destination: 'הלסינקי, פינלנד', tags: ['רלקסציה', 'חוויה מקומית'] },
  { username: 'dor', type: 'recommendation', title: 'בלו לגון ומעגל הזהב ביום אחד', content: 'שכרו רכב ועשו את שני האתרים באותו יום - חוסך לילה שלם של לינה.', destination: 'רייקיאוויק, איסלנד', tags: ['טבע', 'מים חמים'] },
  { username: 'hila', type: 'recommendation', title: 'ארמון הפרלמנט והעיר העתיקה', content: 'הבניין השני בגודלו בעולם, וממש לידו רובע עתיק עם בתי קפה שקטים.', destination: 'בוקרשט, רומניה', tags: ['אדריכלות', 'תרבות'] },
  { username: 'gilad', type: 'recommendation', title: 'כנסיית אלכסנדר נבסקי', content: 'הכנסייה האורתודוקסית המרשימה ביותר במזרח אירופה, כניסה חופשית.', destination: 'סופיה, בולגריה', tags: ['תרבות', 'אדריכלות'] },
  { username: 'omer', type: 'recommendation', title: 'טיול הליכה סביב אגם בלד', content: 'מסלול קל של כשעתיים סביב האגם עם נוף לאי ולכנסייה הקטנה במרכזו.', destination: 'לובליאנה, סלובניה', tags: ['טבע', 'מסלולים'] },
  { username: 'keren', type: 'recommendation', title: 'חופים וצלילה בולטה', content: 'מים כחולים צלולים וכמה נקודות צלילה מעולות למתחילים.', destination: 'ולטה, מלטה', tags: ['ים', 'צלילה'] },
  { username: 'eyal', type: 'recommendation', title: 'חוף פיניקודס עם הילדים', content: 'חוף מוגן ורדוד, מושלם למשפחות עם ילדים קטנים, ויש שם מסעדות דגים טובות.', destination: 'לרנקה, קפריסין', tags: ['ים', 'משפחות'] },
  { username: 'shani', type: 'recommendation', title: 'הטירה מעל הדנובה', content: 'נוף מדהים על הנהר מלמעלה, ומטה יש רובע עתיק קטן ונעים להסתובב בו.', destination: 'ברטיסלבה, סלובקיה', tags: ['נוף', 'היסטוריה'] },
  { username: 'ronen', type: 'recommendation', title: 'העיר העתיקה מימי הביניים', content: 'אחת מהערים העתיקות השמורות ביותר באירופה, ממש כמו מסע בזמן.', destination: 'טאלין, אסטוניה', tags: ['היסטוריה', 'אדריכלות'] },
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
