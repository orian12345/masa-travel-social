# מסלול — רשת חברתית לטיולים

פרויקט גמר בקורס פיתוח אפליקציות אינטרנטיות.

## טכנולוגיות
Node.js, Express, MongoDB (Mongoose), EJS, jQuery + Ajax, React (רכיב Video+Canvas יחיד), Socket.io (צ'אט), D3.js (גרפים).

## הרצה מקומית

1. `npm install`
2. העתיקו את `.env.example` ל-`.env` ומלאו:
   - `MONGO_URI` — מחרוזת חיבור ל-MongoDB Atlas
   - `SESSION_SECRET` — כל מחרוזת אקראית
3. אכלוס נתוני דמו: `npm run seed`
   (מוחק ומאכלס מחדש 8 משתמשים, 4 קבוצות, 15 פוסטים ושיחת צ'אט לדוגמה. כל המשתמשים משתמשים בסיסמה `password1`, שם משתמש למשל `michal`.)
4. הרצה: `npm start` (או `npm run dev` עם nodemon לפיתוח)
5. גלישה ל-`http://localhost:3000`

## מבנה הפרויקט (MVC)
- `models/` — סכמות Mongoose: User, Post, Group, Message
- `controllers/` — לוגיקת השרת לכל מודל
- `routes/` — מיפוי בקשות HTTP לקונטרולרים
- `views/` — תבניות EJS (ה-View)
- `public/` — CSS, jQuery, ורכיב ה-React היחיד (VerifyCamera)
- `sockets/` — לוגיקת הצ'אט ב-Socket.io
- `middleware/` — הגנת מסלולים (התחברות נדרשת)
