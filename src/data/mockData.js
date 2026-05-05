export const roles = ["student", "instructor", "superadmin"];

export const users = [
  {
    id: "u-admin-1",
    fullName: "Nodir Rahmatov",
    email: "admin@lms.uz",
    password: "admin123",
    role: "superadmin",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80",
    bio: "Platform SuperAdmin",
  },
  {
    id: "u-instructor-1",
    fullName: "Javohir Sodiqov",
    email: "instructor@lms.uz",
    password: "instructor123",
    role: "instructor",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    bio: "Senior Frontend Engineer va 8+ yil mentorlik tajribasi.",
    rating: 4.9,
  },
  {
    id: "u-instructor-2",
    fullName: "Madina Usmonova",
    email: "ux@lms.uz",
    password: "instructor123",
    role: "instructor",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80",
    bio: "Product Designer va UX tadqiqotchi.",
    rating: 4.8,
  },
  {
    id: "u-student-1",
    fullName: "Aziza Karimova",
    email: "student@lms.uz",
    password: "student123",
    role: "student",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    bio: "Frontend learner",
  },
  {
    id: "u-student-2",
    fullName: "Kamron Juraev",
    email: "kamron@lms.uz",
    password: "student123",
    role: "student",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
    bio: "Product analyst",
  },
];

export const categories = ["Programming", "Design", "Marketing", "Language"];

export const courses = [
  {
    id: "c-react-bootcamp",
    title: "React Frontend Bootcamp",
    description:
      "React, Router va component architecture orqali production darajadagi web ilovalar qurish.",
    coverImage:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
    category: "Programming",
    difficulty: "beginner",
    language: "Uzbek",
    price: 490000,
    durationHours: 28,
    status: "published",
    rating: 4.8,
    reviewCount: 214,
    studentCount: 1240,
    instructorId: "u-instructor-1",
    whatYouWillLearn: [
      "React component design",
      "Routing and layouts",
      "Reusable state patterns",
      "Frontend deployment basics",
    ],
    requirements: ["HTML/CSS basics", "JavaScript fundamentals"],
    modules: [
      {
        id: "m-react-1",
        title: "React Foundations",
        lessons: [
          {
            id: "l-react-1",
            title: "Why React",
            type: "video",
            durationMin: 24,
            isPreview: true,
            content: "React UI ni componentlarga bo'lib qurishni osonlashtiradi.",
            resourceUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
          },
          {
            id: "l-react-2",
            title: "JSX va Component",
            type: "text",
            durationMin: 31,
            isPreview: false,
            content:
              "JSX bu JavaScript ichida UI yozish sintaksisi. Har bir component returnda JSX qaytaradi.",
            resourceUrl: "",
          },
        ],
      },
      {
        id: "m-react-2",
        title: "Routing and State",
        lessons: [
          {
            id: "l-react-3",
            title: "React Router bilan sahifalar",
            type: "video",
            durationMin: 35,
            isPreview: false,
            content:
              "Client-side route orqali single page app ichida page transition qilamiz.",
            resourceUrl: "https://www.youtube.com/watch?v=Ul3y1LXxzdU",
          },
          {
            id: "l-react-4",
            title: "Local state va lifting state up",
            type: "file",
            durationMin: 18,
            isPreview: false,
            content:
              "State parentda saqlanib childlarga props orqali uzatiladi. Bu shared state uchun kerak.",
            resourceUrl: "https://react.dev/learn/sharing-state-between-components",
          },
        ],
      },
    ],
    finalQuiz: {
      id: "q-react-final",
      title: "Final Quiz: React Core",
      passThreshold: 70,
      timeLimitMin: 30,
      maxAttempts: 3,
      questions: [
        {
          id: "q1",
          prompt: "React da state update qilishning to'g'ri yo'li qaysi?",
          options: [
            "state = yangiQiymat",
            "setState/useState setter funksiyasi",
            "DOM ni to'g'ridan-to'g'ri update qilish",
          ],
          correctOptionIndexes: [1],
        },
        {
          id: "q2",
          prompt: "React Router nima uchun ishlatiladi?",
          options: [
            "Backend yozish uchun",
            "Sahifalar orasida client-side navigation",
            "CSS preprocess qilish",
          ],
          correctOptionIndexes: [1],
        },
      ],
    },
    reviews: [
      {
        id: "r-1",
        author: "Kamron",
        rating: 5,
        date: "2026-03-18",
        text: "Darslar juda amaliy va aniq.",
      },
      {
        id: "r-2",
        author: "Shahzoda",
        rating: 4,
        date: "2026-04-02",
        text: "Modul tuzilishi tushunarli, quiz ham foydali.",
      },
    ],
  },
  {
    id: "c-ux-pro",
    title: "UX Design Sprint",
    description:
      "Foydalanuvchi tadqiqoti, wireframe va usable prototip yaratish bo'yicha intensive kurs.",
    coverImage:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=80",
    category: "Design",
    difficulty: "intermediate",
    language: "English",
    price: 590000,
    durationHours: 20,
    status: "published",
    rating: 4.7,
    reviewCount: 132,
    studentCount: 640,
    instructorId: "u-instructor-2",
    whatYouWillLearn: ["User research", "Wireframing", "Prototype testing"],
    requirements: ["Figma basic"],
    modules: [
      {
        id: "m-ux-1",
        title: "Research",
        lessons: [
          {
            id: "l-ux-1",
            title: "Interview plan",
            type: "text",
            durationMin: 22,
            isPreview: true,
            content: "Respondent tanlash, savol bloklari va interview script tayyorlash.",
            resourceUrl: "",
          },
        ],
      },
    ],
    finalQuiz: {
      id: "q-ux-final",
      title: "Final Quiz: UX",
      passThreshold: 70,
      timeLimitMin: 20,
      maxAttempts: 2,
      questions: [],
    },
    reviews: [],
  },
  {
    id: "c-seo-start",
    title: "SEO va Content Marketing",
    description:
      "Search ranking, semantic kontent va analytics bilan organik o'sishni oshirish.",
    coverImage:
      "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=1600&q=80",
    category: "Marketing",
    difficulty: "beginner",
    language: "Uzbek",
    price: 0,
    durationHours: 12,
    status: "published",
    rating: 4.6,
    reviewCount: 78,
    studentCount: 1100,
    instructorId: "u-instructor-1",
    whatYouWillLearn: ["SEO fundamentals", "Keyword strategy"],
    requirements: ["No prerequisite"],
    modules: [
      {
        id: "m-seo-1",
        title: "SEO Basics",
        lessons: [
          {
            id: "l-seo-1",
            title: "How search works",
            type: "video",
            durationMin: 15,
            isPreview: true,
            content:
              "Search engine crawling, indexing va ranking tushunchalari bilan tanishamiz.",
            resourceUrl: "https://developers.google.com/search/docs/fundamentals/how-search-works",
          },
        ],
      },
    ],
    finalQuiz: {
      id: "q-seo-final",
      title: "Final Quiz: SEO",
      passThreshold: 70,
      timeLimitMin: 15,
      maxAttempts: 3,
      questions: [],
    },
    reviews: [],
  },
];

export const enrollments = [
  {
    id: "en-1",
    userId: "u-student-1",
    courseId: "c-react-bootcamp",
    status: "active",
    progress: 50,
    completedLessonIds: ["l-react-1", "l-react-2"],
    attempts: [
      {
        quizId: "q-react-final",
        score: 80,
        timeSpentMin: 18,
        submittedAt: "2026-04-28T10:30:00Z",
      },
    ],
    certificate: null,
  },
  {
    id: "en-2",
    userId: "u-student-2",
    courseId: "c-ux-pro",
    status: "completed",
    progress: 100,
    completedLessonIds: ["l-ux-1"],
    attempts: [],
    certificate: {
      id: "CERT-C-UX-PRO-U-STUDENT-2",
      issuedAt: "2026-02-10T08:00:00Z",
    },
  },
];

export const payments = [
  {
    id: "p-1",
    courseId: "c-react-bootcamp",
    amount: 490000,
    instructorPayout: 294000,
    date: "2026-04-01",
  },
  {
    id: "p-2",
    courseId: "c-ux-pro",
    amount: 590000,
    instructorPayout: 324500,
    date: "2026-04-12",
  },
  {
    id: "p-3",
    courseId: "c-react-bootcamp",
    amount: 490000,
    instructorPayout: 294000,
    date: "2026-04-22",
  },
  {
    id: "p-4",
    courseId: "c-seo-start",
    amount: 0,
    instructorPayout: 0,
    date: "2026-04-30",
  },
];
