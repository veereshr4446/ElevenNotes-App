// ============================================================
//  DATA.JS — content for ElevenNotes.
//  Nothing here is fetched from, or sent to, any outside system.
//  Each class (branch + semester) has its own subjects, faculty,
//  timetable and dates in CLASS_DATA. Classes with no entry yet
//  show a friendly "not added yet" message. Always check your
//  official college timetable too.
// ============================================================

const BRANCHES = [
    { id: 'CSE-A', name: 'CSE – A',        long: 'Computer Science & Engineering, Section A', emoji: '💻' },
    { id: 'CSE-B', name: 'CSE – B',        long: 'Computer Science & Engineering, Section B', emoji: '💻' },
    { id: 'AIML-A', name: 'CSE – AI & ML – A', long: 'CSE (Artificial Intelligence & Machine Learning), Section A', emoji: '🤖' },
    { id: 'AIML-B', name: 'CSE – AI & ML – B', long: 'CSE (Artificial Intelligence & Machine Learning), Section B', emoji: '🤖' },
    { id: 'DS',    name: 'CSE – Data Science & Cyber', long: 'CSE (Data Science) and CSE (Cyber Security)', emoji: '📊' },
    { id: 'ISE',   name: 'ISE',            long: 'Information Science & Engineering', emoji: '🧩' },
    { id: 'ECE',   name: 'ECE',            long: 'Electronics & Communication Engineering', emoji: '📡' },
    { id: 'EEE',   name: 'EEE',            long: 'Electrical & Electronics Engineering', emoji: '⚡' },
    { id: 'ME',    name: 'Mechanical',     long: 'Mechanical Engineering', emoji: '⚙️' },
    { id: 'CIVIL', name: 'Civil',          long: 'Civil Engineering', emoji: '🏗️' }
];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_CLASS = { branch: 'CSE-A', sem: 3 };

// A period is 55 minutes. t = start time in minutes from midnight, n = periods it spans.
// Keys of a timetable are day numbers (1 = Monday ... 6 = Saturday).
const PERIOD_MIN = 55;

const SEM1 = {
    A: {
        note: "Physics group, CSE section A, Lecture Hall 09. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATS101", "name": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "faculty": "Mrs. G M Ambika", "kind": "theory", "credits": 0},
            {"id": "PHY", "code": "1BPHYS102", "name": "Applied Physics (Quantum Physics and Applications (CSE stream))", "faculty": "Dr. Nagabhushana N M", "kind": "theory", "credits": 0},
            {"id": "CED", "code": "1BCEDS103", "name": "Computer-Aided Engineering Drawing for CSE Stream", "faculty": "Dr. K Manjunatha", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104B", "name": "Introduction to Electrical Engineering", "faculty": "Ms. Rashmi H N", "kind": "theory", "credits": 0},
            {"id": "PSC", "code": "1BEIT105", "name": "Programming in C", "faculty": "Ms. S Deepa", "kind": "theory", "credits": 0},
            {"id": "SS", "code": "1BSKS106", "name": "Soft Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "CPL", "code": "1BPOPL107", "name": "C Programming Lab", "faculty": "Bhuvaneshwari M", "kind": "lab", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "Dr. Girisha H", "kind": "lab", "credits": 0},
            {"id": "KSK", "code": "1BKSKK109 / BKBKK109", "name": "Samskrutika Kannada / Balake Kannada", "faculty": "Mr. Veeresh Swamy / Mrs. Chetana P M", "kind": "theory", "credits": 0}
        ],
        faculty: [
            {"name": "Mrs. G M Ambika", "subject": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "emoji": "👩‍🏫"},
            {"name": "Dr. Nagabhushana N M", "subject": "Applied Physics (Quantum Physics and Applications (CSE stream))", "emoji": "👨‍🏫"},
            {"name": "Dr. K Manjunatha", "subject": "Computer-Aided Engineering Drawing for CSE Stream", "emoji": "👨‍🏫"},
            {"name": "Ms. Rashmi H N", "subject": "Introduction to Electrical Engineering", "emoji": "👩‍🏫"},
            {"name": "Ms. S Deepa", "subject": "Programming in C", "emoji": "👩‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Soft Skills", "emoji": "👨‍🏫"},
            {"name": "Bhuvaneshwari M", "subject": "C Programming Lab", "emoji": "👨‍🏫"},
            {"name": "Dr. Girisha H", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"},
            {"name": "Mr. Veeresh Swamy", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👨‍🏫"},
            {"name": "Mrs. Chetana P M", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👩‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "CED"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "PSC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: CAED Lab. Batch 2: Innovation and Design Thinking Lab", kind: "lab"}
            ],
            2: [
                {t: 540, n: 1, sub: "PHY"},
                {t: 595, n: 1, sub: "KSK"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "MATHS"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Physics Lab", kind: "lab"}
            ],
            3: [
                {t: 540, n: 1, sub: "PHY"},
                {t: 595, n: 1, sub: "PSC"},
                {t: 660, n: 1, sub: "PHY"},
                {t: 715, n: 1, sub: "ESC"},
                {t: 855, n: 1, sub: "PSC"},
                {t: 910, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"}
            ],
            4: [
                {t: 540, n: 1, sub: "PSC"},
                {t: 595, n: 1, sub: "PHY"},
                {t: 660, n: 1, sub: "MATHS"},
                {t: 715, n: 1, sub: "SS"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: Innovation and Design Thinking Lab. Batch 2: CAED Lab", kind: "lab"}
            ],
            5: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: Physics Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: Physics Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 855, n: 1, sub: "PHY"},
                {t: 910, n: 1, sub: "ESC"},
                {t: 965, n: 1, sub: "PSC"}
            ],
            6: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "ESC"},
                {t: 660, n: 2, sub: "CED"}
            ]
        },
        exams: []
    },
    B: {
        note: "Physics group, CSE section B, Lecture Hall 109. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATS101", "name": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "faculty": "Mrs. Gangamma G", "kind": "theory", "credits": 0},
            {"id": "PHY", "code": "1BPHYS102", "name": "Applied Physics (Quantum Physics and Applications (CSE stream))", "faculty": "Dr. N Nagaraja", "kind": "theory", "credits": 0},
            {"id": "CED", "code": "1BCEDS103", "name": "Computer-Aided Engineering Drawing for CSE Stream", "faculty": "A M Shivaprakesh Swamy", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104B", "name": "Introduction to Electrical Engineering", "faculty": "Mr. Nagabhushan K", "kind": "theory", "credits": 0},
            {"id": "PSC", "code": "1BEIT105", "name": "Programming in C", "faculty": "Ms. S Deepa", "kind": "theory", "credits": 0},
            {"id": "SS", "code": "1BSKS106", "name": "Soft Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "CPL", "code": "1BPOPL107", "name": "C Programming Lab", "faculty": "Ms. S Deepa", "kind": "lab", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "Dr. Girisha H", "kind": "lab", "credits": 0},
            {"id": "KSK", "code": "1BKSKK109 / BKBKK109", "name": "Samskrutika Kannada / Balake Kannada", "faculty": "Mr. Veeresh Swamy / Mrs. Chetana P M", "kind": "theory", "credits": 0}
        ],
        faculty: [
            {"name": "Mrs. Gangamma G", "subject": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "emoji": "👩‍🏫"},
            {"name": "Dr. N Nagaraja", "subject": "Applied Physics (Quantum Physics and Applications (CSE stream))", "emoji": "👨‍🏫"},
            {"name": "A M Shivaprakesh Swamy", "subject": "Computer-Aided Engineering Drawing for CSE Stream", "emoji": "👨‍🏫"},
            {"name": "Mr. Nagabhushan K", "subject": "Introduction to Electrical Engineering", "emoji": "👨‍🏫"},
            {"name": "Ms. S Deepa", "subject": "Programming in C", "emoji": "👩‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Soft Skills", "emoji": "👨‍🏫"},
            {"name": "Dr. Girisha H", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"},
            {"name": "Mr. Veeresh Swamy", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👨‍🏫"},
            {"name": "Mrs. Chetana P M", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👩‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 1, sub: "PSC"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 1, sub: "PHY"},
                {t: 715, n: 1, sub: "ESC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Physics Lab", kind: "lab"}
            ],
            2: [
                {t: 540, n: 1, sub: "PHY"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: CAED Lab. Batch 2: Innovation and Design Thinking Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: CAED Lab. Batch 2: Innovation and Design Thinking Lab", kind: "lab"},
                {t: 855, n: 1, sub: "PSC"},
                {t: 910, n: 1, sub: "MATHS"},
                {t: 965, n: 1, sub: "ESC"}
            ],
            3: [
                {t: 540, n: 1, sub: "CED"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: Innovation and Design Thinking Lab. Batch 2: CAED Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: Innovation and Design Thinking Lab. Batch 2: CAED Lab", kind: "lab"},
                {t: 855, n: 1, sub: "ESC"},
                {t: 910, n: 1, sub: "MATHS"},
                {t: 965, n: 1, sub: "PHY"}
            ],
            4: [
                {t: 540, n: 1, sub: "ESC"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: Physics Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: Physics Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 855, n: 1, sub: "PHY"},
                {t: 910, n: 1, sub: "CED"},
                {t: 965, n: 1, sub: "CED"}
            ],
            5: [
                {t: 540, n: 1, sub: "PHY"},
                {t: 595, n: 1, sub: "ESC"},
                {t: 660, n: 1, sub: "MATHS"},
                {t: 715, n: 1, sub: "PSC"},
                {t: 855, n: 1, sub: "PSC"},
                {t: 910, n: 1, sub: "SS"},
                {t: 965, n: 1, sub: "KSK"}
            ],
            6: [
                {t: 540, n: 1, sub: "PSC"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"}
            ]
        },
        exams: []
    },
    C: {
        note: "Physics group, AI & ML section C, Lecture Hall 212. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATS101", "name": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "faculty": "Prabhakar Meti", "kind": "theory", "credits": 0},
            {"id": "PHY", "code": "1BPHYS102", "name": "Applied Physics (Quantum Physics and Applications (CSE stream))", "faculty": "Dr. Bhagya", "kind": "theory", "credits": 0},
            {"id": "CED", "code": "1BCEDS103", "name": "Computer-Aided Engineering Drawing for CSE Stream", "faculty": "Dr. Lakshmana Naik T K", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104C", "name": "Introduction to Electronics & Communication Engineering", "faculty": "Dr. Chinna V Gowdar", "kind": "theory", "credits": 0},
            {"id": "PSC", "code": "1BEIT105", "name": "Programming in C", "faculty": "Mrs. Darshana Dandina", "kind": "theory", "credits": 0},
            {"id": "SS", "code": "1BSKS106", "name": "Soft Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "CPL", "code": "1BPOPL107", "name": "C Programming Lab", "faculty": "Mrs. Darshana Dandina", "kind": "lab", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "AI & ML Department", "kind": "lab", "credits": 0},
            {"id": "KSK", "code": "1BKSKK109 / BKBKK109", "name": "Samskrutika Kannada / Balake Kannada", "faculty": "Mr. Veeresh Swamy / Mrs. Chetana P M", "kind": "theory", "credits": 0}
        ],
        faculty: [
            {"name": "Prabhakar Meti", "subject": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "emoji": "👨‍🏫"},
            {"name": "Dr. Bhagya", "subject": "Applied Physics (Quantum Physics and Applications (CSE stream))", "emoji": "👨‍🏫"},
            {"name": "Dr. Lakshmana Naik T K", "subject": "Computer-Aided Engineering Drawing for CSE Stream", "emoji": "👨‍🏫"},
            {"name": "Dr. Chinna V Gowdar", "subject": "Introduction to Electronics & Communication Engineering", "emoji": "👨‍🏫"},
            {"name": "Mrs. Darshana Dandina", "subject": "Programming in C", "emoji": "👩‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Soft Skills", "emoji": "👨‍🏫"},
            {"name": "AI & ML Department", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"},
            {"name": "Mr. Veeresh Swamy", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👨‍🏫"},
            {"name": "Mrs. Chetana P M", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👩‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 2, title: "Lab session", detail: "Batch 1: CAED Lab. Batch 2: Innovation and Design Thinking Lab", kind: "lab"},
                {t: 660, n: 1, title: "Lab session", detail: "Batch 1: CAED Lab. Batch 2: Innovation and Design Thinking Lab", kind: "lab"},
                {t: 715, n: 1, sub: "PHY"},
                {t: 855, n: 1, sub: "MATHS"},
                {t: 910, n: 1, sub: "ESC"},
                {t: 965, n: 1, sub: "KSK"}
            ],
            2: [
                {t: 540, n: 1, sub: "PSC"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Physics Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Physics Lab", kind: "lab"},
                {t: 855, n: 1, sub: "MATHS"},
                {t: 910, n: 1, sub: "PHY"},
                {t: 965, n: 1, sub: "ESC"}
            ],
            3: [
                {t: 540, n: 1, sub: "ESC"},
                {t: 595, n: 1, sub: "PHY"},
                {t: 660, n: 1, sub: "MATHS"},
                {t: 715, n: 1, sub: "PSC"},
                {t: 855, n: 1, sub: "PSC"},
                {t: 910, n: 1, sub: "CED"},
                {t: 965, n: 1, sub: "CED"}
            ],
            4: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "PHY"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "PSC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: Physics Lab. Batch 2: C Programming Lab", kind: "lab"}
            ],
            5: [
                {t: 540, n: 1, sub: "CED"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: Innovation and Design Thinking Lab. Batch 2: CAED Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: Innovation and Design Thinking Lab. Batch 2: CAED Lab", kind: "lab"},
                {t: 855, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"},
                {t: 965, n: 1, sub: "SS"}
            ],
            6: [
                {t: 540, n: 1, sub: "PHY"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "PSC"}
            ]
        },
        exams: []
    },
    D: {
        note: "Physics group, AI & ML and ISE section D, Lecture Hall 213. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATS101", "name": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "faculty": "Dr. Shivamma", "kind": "theory", "credits": 0},
            {"id": "PHY", "code": "1BPHYS102", "name": "Applied Physics (Quantum Physics and Applications (CSE stream))", "faculty": "Dr. Anand Thipperudra", "kind": "theory", "credits": 0},
            {"id": "CED", "code": "1BCEDS103", "name": "Computer-Aided Engineering Drawing for CSE Stream", "faculty": "Dr. R H M Somanath Swamy", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104C", "name": "Introduction to Electronics & Communication Engineering", "faculty": "Mr Surendranatha", "kind": "theory", "credits": 0},
            {"id": "PSC", "code": "1BEIT105", "name": "Programming in C", "faculty": "Niranjan Varada", "kind": "theory", "credits": 0},
            {"id": "SS", "code": "1BSKS106", "name": "Soft Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "CPL", "code": "1BPOPL107", "name": "C Programming Lab", "faculty": "Bhuvaneshwari M", "kind": "lab", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "ISE Department", "kind": "lab", "credits": 0},
            {"id": "KSK", "code": "1BKSKK109 / BKBKK109", "name": "Samskrutika Kannada / Balake Kannada", "faculty": "Mr. Veeresh Swamy / Mrs. Chetana P M", "kind": "theory", "credits": 0}
        ],
        faculty: [
            {"name": "Dr. Shivamma", "subject": "Applied Mathematics -I (Calculus and Linear Algebra: CSE Stream)", "emoji": "👨‍🏫"},
            {"name": "Dr. Anand Thipperudra", "subject": "Applied Physics (Quantum Physics and Applications (CSE stream))", "emoji": "👨‍🏫"},
            {"name": "Dr. R H M Somanath Swamy", "subject": "Computer-Aided Engineering Drawing for CSE Stream", "emoji": "👨‍🏫"},
            {"name": "Mr Surendranatha", "subject": "Introduction to Electronics & Communication Engineering", "emoji": "👨‍🏫"},
            {"name": "Niranjan Varada", "subject": "Programming in C", "emoji": "👨‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Soft Skills", "emoji": "👨‍🏫"},
            {"name": "Bhuvaneshwari M", "subject": "C Programming Lab", "emoji": "👨‍🏫"},
            {"name": "ISE Department", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"},
            {"name": "Mr. Veeresh Swamy", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👨‍🏫"},
            {"name": "Mrs. Chetana P M", "subject": "Samskrutika Kannada / Balake Kannada", "emoji": "👩‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 1, sub: "ESC"},
                {t: 595, n: 1, sub: "PHY"},
                {t: 660, n: 1, sub: "CED"},
                {t: 715, n: 1, sub: "MATHS"},
                {t: 855, n: 1, sub: "ESC"},
                {t: 910, n: 1, sub: "PSC"},
                {t: 965, n: 1, sub: "PSC"}
            ],
            2: [
                {t: 540, n: 1, sub: "PHY"},
                {t: 595, n: 1, sub: "PSC"},
                {t: 660, n: 1, sub: "MATHS"},
                {t: 715, n: 1, sub: "PSC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: Innovation and Design Thinking Lab. Batch 2: CAED Lab", kind: "lab"}
            ],
            3: [
                {t: 540, n: 1, sub: "SS"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Physics Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Physics Lab", kind: "lab"},
                {t: 855, n: 1, sub: "PHY"},
                {t: 910, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"}
            ],
            4: [
                {t: 540, n: 2, title: "Lab session", detail: "Batch 1: CAED Lab. Batch 2: Innovation and Design Thinking Lab", kind: "lab"},
                {t: 660, n: 1, title: "Lab session", detail: "Batch 1: CAED Lab. Batch 2: Innovation and Design Thinking Lab", kind: "lab"},
                {t: 715, n: 1, sub: "ESC"},
                {t: 855, n: 1, sub: "MATHS"},
                {t: 910, n: 1, sub: "ESC"},
                {t: 965, n: 1, sub: "KSK"}
            ],
            5: [
                {t: 540, n: 1, sub: "CED"},
                {t: 595, n: 1, sub: "CED"},
                {t: 660, n: 1, sub: "PHY"},
                {t: 715, n: 1, sub: "MATHS"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: Physics Lab. Batch 2: C Programming Lab", kind: "lab"}
            ],
            6: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "PHY"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "PSC"}
            ]
        },
        exams: []
    },
    E: {
        note: "Chemistry group, CSE (Data Science and Cyber) section E, Lecture Hall 209. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATS101", "name": "Calculus And Linear Algebra: CSE stream", "faculty": "Mr. H M Majunath", "kind": "theory", "credits": 0},
            {"id": "CHE", "code": "1BCHES102", "name": "Applied Chemistry for Smart Systems (CSE)", "faculty": "Mrs. Chandana Y", "kind": "theory", "credits": 0},
            {"id": "ETC", "code": "1BAIA103", "name": "Introduction to AI and Applications", "faculty": "Prof Sathvik G", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104B", "name": "Introduction to Electrical Engineering", "faculty": "A Meenakshi", "kind": "theory", "credits": 0},
            {"id": "PLC", "code": "1BPLC105B", "name": "Python Programming", "faculty": "Dr. Shivaprasad K M", "kind": "theory", "credits": 0},
            {"id": "ENG", "code": "1BENGL106", "name": "Communication Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "ICEE", "code": "1BICO107", "name": "Indian Constitution & Engineering Ethics", "faculty": "N Kavya", "kind": "theory", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "Cse(cy ) Department", "kind": "lab", "credits": 0}
        ],
        faculty: [
            {"name": "Mr. H M Majunath", "subject": "Calculus And Linear Algebra: CSE stream", "emoji": "👨‍🏫"},
            {"name": "Mrs. Chandana Y", "subject": "Applied Chemistry for Smart Systems (CSE)", "emoji": "👩‍🏫"},
            {"name": "Prof Sathvik G", "subject": "Introduction to AI and Applications", "emoji": "👨‍🏫"},
            {"name": "A Meenakshi", "subject": "Introduction to Electrical Engineering", "emoji": "👨‍🏫"},
            {"name": "Dr. Shivaprasad K M", "subject": "Python Programming", "emoji": "👨‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Communication Skills", "emoji": "👨‍🏫"},
            {"name": "N Kavya", "subject": "Indian Constitution & Engineering Ethics", "emoji": "👨‍🏫"},
            {"name": "Cse(cy ) Department", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 1, sub: "PLC"},
                {t: 595, n: 1, sub: "ICEE"},
                {t: 660, n: 1, sub: "CHE"},
                {t: 715, n: 1, sub: "ESC"},
                {t: 855, n: 1, sub: "ETC"},
                {t: 910, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"}
            ],
            2: [
                {t: 540, n: 1, sub: "PLC"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: Chemistry Lab. Batch 2: Python Programming Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: Chemistry Lab. Batch 2: Python Programming Lab", kind: "lab"},
                {t: 855, n: 1, sub: "ETC"},
                {t: 910, n: 1, sub: "MATHS"},
                {t: 965, n: 1, title: "Counselling", detail: "Mentor and mentee session", kind: "free"}
            ],
            3: [
                {t: 540, n: 1, sub: "ESC"},
                {t: 595, n: 1, sub: "ENG"},
                {t: 660, n: 1, sub: "ETC"},
                {t: 715, n: 1, sub: "MATHS"},
                {t: 855, n: 1, sub: "PLC"},
                {t: 910, n: 1, sub: "CHE"},
                {t: 965, n: 1, title: "Tutorial", detail: "Tutorial class", kind: "free"}
            ],
            4: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "CHE"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "PLC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: Python Programming Lab. Batch 2: Chemistry Lab", kind: "lab"}
            ],
            5: [
                {t: 540, n: 1, sub: "CHE"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 2, sub: "IDT"},
                {t: 855, n: 1, sub: "ETC"},
                {t: 910, n: 1, sub: "PLC"},
                {t: 965, n: 1, sub: "ESC"}
            ],
            6: [
                {t: 540, n: 1, sub: "CHE"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "ETC"}
            ]
        },
        exams: []
    },
    F: {
        note: "Chemistry group, EEE section F, Lecture Hall 210. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATE101", "name": "Differential Calculus and Linear Algebra; EEE stream", "faculty": "Dr. Veeresh B", "kind": "theory", "credits": 0},
            {"id": "CHE", "code": "1BCHEE102", "name": "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", "faculty": "Ms. Sneha K / Dr. Divya Achari", "kind": "theory", "credits": 0},
            {"id": "ETC", "code": "1BAIA103", "name": "Introduction to AI and Applications", "faculty": "Mr. Gangadhar J", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104C", "name": "Introduction to Electronics and Communication Engineering", "faculty": "Mr. Santosh Mugali", "kind": "theory", "credits": 0},
            {"id": "PLC", "code": "1BPLC105E", "name": "Introduction to C Programming (For none IT programmes)", "faculty": "Mrs. Nandini", "kind": "theory", "credits": 0},
            {"id": "ENG", "code": "1BENGL106", "name": "Communication Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "ICEE", "code": "1BICO107", "name": "Indian Constitution & Engineering Ethics", "faculty": "N Kavya", "kind": "theory", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "EEE Department", "kind": "lab", "credits": 0}
        ],
        faculty: [
            {"name": "Dr. Veeresh B", "subject": "Differential Calculus and Linear Algebra; EEE stream", "emoji": "👨‍🏫"},
            {"name": "Ms. Sneha K", "subject": "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", "emoji": "👩‍🏫"},
            {"name": "Dr. Divya Achari", "subject": "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", "emoji": "👨‍🏫"},
            {"name": "Mr. Gangadhar J", "subject": "Introduction to AI and Applications", "emoji": "👨‍🏫"},
            {"name": "Mr. Santosh Mugali", "subject": "Introduction to Electronics and Communication Engineering", "emoji": "👨‍🏫"},
            {"name": "Mrs. Nandini", "subject": "Introduction to C Programming (For none IT programmes)", "emoji": "👩‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Communication Skills", "emoji": "👨‍🏫"},
            {"name": "N Kavya", "subject": "Indian Constitution & Engineering Ethics", "emoji": "👨‍🏫"},
            {"name": "EEE Department", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 1, sub: "PLC"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: Chemistry Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: Chemistry Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 855, n: 1, sub: "ESC"},
                {t: 910, n: 1, sub: "ETC"},
                {t: 965, n: 1, sub: "CHE"}
            ],
            2: [
                {t: 540, n: 1, sub: "CHE"},
                {t: 595, n: 1, sub: "ESC"},
                {t: 660, n: 1, sub: "MATHS"},
                {t: 715, n: 1, sub: "ETC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Chemistry Lab", kind: "lab"}
            ],
            3: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "ESC"},
                {t: 660, n: 1, sub: "ETC"},
                {t: 715, n: 1, title: "Counselling", detail: "Mentor and mentee session", kind: "free"},
                {t: 855, n: 1, sub: "CHE"},
                {t: 910, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"}
            ],
            4: [
                {t: 540, n: 2, sub: "IDT"},
                {t: 660, n: 1, sub: "CHE"},
                {t: 715, n: 1, sub: "ETC"},
                {t: 855, n: 1, sub: "ICEE"},
                {t: 910, n: 1, sub: "PLC"},
                {t: 965, n: 1, sub: "PLC"}
            ],
            5: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "ENG"},
                {t: 660, n: 1, sub: "MATHS"},
                {t: 715, n: 1, sub: "ETC"},
                {t: 855, n: 1, sub: "ESC"},
                {t: 910, n: 1, sub: "CHE"},
                {t: 965, n: 1, sub: "PLC"}
            ],
            6: [
                {t: 540, n: 1, sub: "ESC"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 1, sub: "PLC"},
                {t: 715, n: 1, title: "Tutorial", detail: "Tutorial class", kind: "free"}
            ]
        },
        exams: []
    },
    G: {
        note: "Chemistry group, ECE section G, Lecture Hall 211. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATE101", "name": "Differential Calculus and Linear Algebra; EEE stream", "faculty": "Mr. K Sangameshwar", "kind": "theory", "credits": 0},
            {"id": "CHE", "code": "1BCHEE102", "name": "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", "faculty": "Mrs. Jayashree M", "kind": "theory", "credits": 0},
            {"id": "ETC", "code": "1BAIA103", "name": "Introduction to AI and Applications", "faculty": "Mrs. Manasa K C", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104E", "name": "Essentials of Information Technology", "faculty": "Mrs. Darshana Dandina", "kind": "theory", "credits": 0},
            {"id": "PLC", "code": "1BPLC105E", "name": "Introduction to C Programming (For non IT programmes)", "faculty": "Mrs. Anitha A", "kind": "theory", "credits": 0},
            {"id": "ENG", "code": "1BENGL106", "name": "Communication Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "ICEE", "code": "1BICO107", "name": "Indian Constitution & Engineering Ethics", "faculty": "N Kavya", "kind": "theory", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "Lokesh KS / Santhosh M", "kind": "lab", "credits": 0}
        ],
        faculty: [
            {"name": "Mr. K Sangameshwar", "subject": "Differential Calculus and Linear Algebra; EEE stream", "emoji": "👨‍🏫"},
            {"name": "Mrs. Jayashree M", "subject": "Applied Chemistry for Emerging Electronics and Futuristic Devices (EEE, ECE)", "emoji": "👩‍🏫"},
            {"name": "Mrs. Manasa K C", "subject": "Introduction to AI and Applications", "emoji": "👩‍🏫"},
            {"name": "Mrs. Darshana Dandina", "subject": "Essentials of Information Technology", "emoji": "👩‍🏫"},
            {"name": "Mrs. Anitha A", "subject": "Introduction to C Programming (For non IT programmes)", "emoji": "👩‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Communication Skills", "emoji": "👨‍🏫"},
            {"name": "N Kavya", "subject": "Indian Constitution & Engineering Ethics", "emoji": "👨‍🏫"},
            {"name": "Lokesh KS / Santhosh M", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "ETC"},
                {t: 660, n: 1, sub: "CHE"},
                {t: 715, n: 1, sub: "ESC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Chemistry Lab", kind: "lab"}
            ],
            2: [
                {t: 540, n: 1, sub: "CHE"},
                {t: 595, n: 1, sub: "ETC"},
                {t: 660, n: 1, sub: "PLC"},
                {t: 715, n: 1, sub: "MATHS"},
                {t: 855, n: 1, sub: "ESC"},
                {t: 910, n: 1, sub: "ENG"},
                {t: 965, n: 1, title: "Tutorial", detail: "Tutorial class", kind: "free"}
            ],
            3: [
                {t: 540, n: 1, sub: "ESC"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 1, sub: "CHE"},
                {t: 715, n: 1, sub: "PLC"},
                {t: 855, n: 1, sub: "PLC"},
                {t: 910, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"}
            ],
            4: [
                {t: 540, n: 1, sub: "PLC"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: Chemistry Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: Chemistry Lab. Batch 2: C Programming Lab", kind: "lab"},
                {t: 855, n: 1, sub: "MATHS"},
                {t: 910, n: 1, sub: "CHE"},
                {t: 965, n: 1, sub: "ETC"}
            ],
            5: [
                {t: 540, n: 1, sub: "CHE"},
                {t: 595, n: 1, sub: "ICEE"},
                {t: 660, n: 1, sub: "ESC"},
                {t: 715, n: 1, sub: "MATHS"},
                {t: 855, n: 1, sub: "PLC"},
                {t: 910, n: 1, sub: "ETC"},
                {t: 965, n: 1, title: "Counselling", detail: "Mentor and mentee session", kind: "free"}
            ],
            6: [
                {t: 540, n: 1, sub: "ETC"},
                {t: 595, n: 1, sub: "ESC"},
                {t: 660, n: 2, sub: "IDT"}
            ]
        },
        exams: []
    },
    H: {
        note: "Chemistry group, Civil and Mechanical section H, Lecture Hall 206. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batch 1 is roll numbers 01 to 30, batch 2 is 31 onwards.",
        subjects: [
            {"id": "MATHS", "code": "1BMATC101/ 1BMATM101", "name": "Differential Calculus and Linear Algebra: CV/ME Stream", "faculty": "Dr. Sumangala B / Kaveri P", "kind": "theory", "credits": 0},
            {"id": "CHE", "code": "1BCHEM102/ 1BCHEC102", "name": "Applied Chemistry", "faculty": "Dr. Divya Achari / Sneha K", "kind": "theory", "credits": 0},
            {"id": "ETC", "code": "1BAIA103", "name": "Introduction to AI and Applications", "faculty": "Dr. Veerabhadrappa Algur", "kind": "theory", "credits": 0},
            {"id": "ESC", "code": "1BESC104C", "name": "Introduction to Electronics and Communication Engineering", "faculty": "Dr. Chandrashekar.K", "kind": "theory", "credits": 0},
            {"id": "PLC", "code": "1BPLC105E", "name": "Introduction to C Programming (For non IT programmes)", "faculty": "Dr. Vaddin Chetan", "kind": "theory", "credits": 0},
            {"id": "ENG", "code": "1BENGL106", "name": "Communication Skills", "faculty": "K M Arun Kumar", "kind": "theory", "credits": 0},
            {"id": "ICEE", "code": "1BICO107", "name": "Indian Constitution & Engineering Ethics", "faculty": "N Kavya", "kind": "theory", "credits": 0},
            {"id": "IDT", "code": "1BIDTL158", "name": "Innovation and Design Thinking Lab", "faculty": "Civil Department", "kind": "lab", "credits": 0}
        ],
        faculty: [
            {"name": "Dr. Sumangala B", "subject": "Differential Calculus and Linear Algebra: CV/ME Stream", "emoji": "👨‍🏫"},
            {"name": "Kaveri P", "subject": "Differential Calculus and Linear Algebra: CV/ME Stream", "emoji": "👨‍🏫"},
            {"name": "Dr. Divya Achari", "subject": "Applied Chemistry", "emoji": "👨‍🏫"},
            {"name": "Sneha K", "subject": "Applied Chemistry", "emoji": "👨‍🏫"},
            {"name": "Dr. Veerabhadrappa Algur", "subject": "Introduction to AI and Applications", "emoji": "👨‍🏫"},
            {"name": "Dr. Chandrashekar.K", "subject": "Introduction to Electronics and Communication Engineering", "emoji": "👨‍🏫"},
            {"name": "Dr. Vaddin Chetan", "subject": "Introduction to C Programming (For non IT programmes)", "emoji": "👨‍🏫"},
            {"name": "K M Arun Kumar", "subject": "Communication Skills", "emoji": "👨‍🏫"},
            {"name": "N Kavya", "subject": "Indian Constitution & Engineering Ethics", "emoji": "👨‍🏫"},
            {"name": "Civil Department", "subject": "Innovation and Design Thinking Lab", "emoji": "👨‍🏫"}
        ],
        timetable: {
            1: [
                {t: 540, n: 1, sub: "MATHS"},
                {t: 595, n: 1, sub: "ESC"},
                {t: 660, n: 1, sub: "ETC"},
                {t: 715, n: 1, sub: "PLC"},
                {t: 855, n: 1, sub: "CHE"},
                {t: 910, n: 1, sub: "MATHS"},
                {t: 965, n: 1, title: "Counselling", detail: "Mentor and mentee session", kind: "free"}
            ],
            2: [
                {t: 540, n: 1, sub: "ETC"},
                {t: 595, n: 1, sub: "CHE"},
                {t: 660, n: 1, sub: "PLC"},
                {t: 715, n: 1, sub: "ESC"},
                {t: 855, n: 1, sub: "ENG"},
                {t: 910, n: 2, title: "Library / Assignment", detail: "Read, borrow, revise", kind: "free"}
            ],
            3: [
                {t: 540, n: 1, sub: "ETC"},
                {t: 595, n: 1, sub: "CHE"},
                {t: 660, n: 1, sub: "MATHS"},
                {t: 715, n: 1, sub: "ESC"},
                {t: 855, n: 3, title: "Lab session", detail: "Batch 1: Chemistry Lab. Batch 2: C Programming Lab", kind: "lab"}
            ],
            4: [
                {t: 540, n: 1, sub: "PLC"},
                {t: 595, n: 1, sub: "MATHS"},
                {t: 660, n: 2, sub: "IDT"},
                {t: 855, n: 1, sub: "MATHS"},
                {t: 910, n: 1, sub: "PLC"},
                {t: 965, n: 1, sub: "ICEE"}
            ],
            5: [
                {t: 540, n: 1, sub: "CHE"},
                {t: 595, n: 1, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Chemistry Lab", kind: "lab"},
                {t: 660, n: 2, title: "Lab session", detail: "Batch 1: C Programming Lab. Batch 2: Chemistry Lab", kind: "lab"},
                {t: 855, n: 1, sub: "ESC"},
                {t: 910, n: 1, sub: "ETC"},
                {t: 965, n: 1, title: "Tutorial", detail: "Tutorial class", kind: "free"}
            ],
            6: [
                {t: 540, n: 1, sub: "ETC"},
                {t: 595, n: 1, sub: "ESC"},
                {t: 660, n: 1, sub: "PLC"},
                {t: 715, n: 1, sub: "CHE"}
            ]
        },
        exams: []
    }
};

// First year (Semester 1) sections: A CSE, B CSE, C AI & ML, D AI & ML + ISE, E CSE Data Science & Cyber, F EEE, G ECE, H Civil + Mechanical.
const CLASS_DATA = {
    'CSE-A|1': SEM1.A,
    'CSE-B|1': SEM1.B,
    'AIML-A|1': SEM1.C,
    'AIML-B|1': SEM1.D,
    'ISE|1': SEM1.D,
    'DS|1': SEM1.E,
    'EEE|1': SEM1.F,
    'ECE|1': SEM1.G,
    'CIVIL|1': SEM1.H,
    'ME|1': SEM1.H,
    'CSE-A|3': {
        note: 'Odd semester, AY 2026-27. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batches: A1 is roll numbers 01 to 29, A2 is 30 to 58.',
        subjects: [
            { id: 'DSP',  code: '1BMATCS301', name: 'Distributions and Statistics Probability', faculty: 'Prof. G. Gangamma',    kind: 'theory', credits: 3 },
            { id: 'JAVA', code: '1BCS302',    name: 'Object Oriented Programming with Java',    faculty: 'Dr. H. Girisha',       kind: 'theory', credits: 3 },
            { id: 'DDCO', code: '1BCS303',    name: 'Digital Design and Computer Organization', faculty: 'Prof. Radhika Y',      kind: 'theory', credits: 3 },
            { id: 'OS',   code: '1BCS304',    name: 'Operating Systems',                        faculty: 'Prof. Sharmila G K',   kind: 'theory', credits: 3 },
            { id: 'DSA',  code: '1BCS305',    name: 'Data Structures and Applications',         faculty: 'Prof. Rajeswari R.P',  kind: 'theory', credits: 3 },
            { id: 'DSL',  code: '1BCSL306',   name: 'Data Structures Laboratory',               faculty: 'Dr. Nagaveni Biradar / Amruth V', kind: 'lab', credits: 1 },
            { id: 'GIT',  code: '1BCSL307A',  name: 'Project Management (with Git)',            faculty: 'Prof. Prasanna Kumar', kind: 'lab',    credits: 1 },
            { id: 'CP',   code: '1BCP308',    name: 'Community Project / Societal Project',     faculty: 'Dr. H. Girisha',       kind: 'project', credits: 1 }
        ],
        faculty: [
            { name: 'Prof. G. Gangamma',    subject: 'Distributions and Statistics Probability', dept: 'Mathematics', emoji: '👩‍🏫' },
            { name: 'Dr. H. Girisha',       subject: 'Object Oriented Programming with Java',    dept: 'CSE',         emoji: '👨‍🏫' },
            { name: 'Prof. Radhika Y',      subject: 'Digital Design and Computer Organization', dept: 'CSE',         emoji: '👩‍🏫' },
            { name: 'Prof. Sharmila G K',   subject: 'Operating Systems',                        dept: 'CSE',         emoji: '👩‍🏫' },
            { name: 'Prof. Rajeswari R.P',  subject: 'Data Structures and Applications',         dept: 'CSE',         emoji: '👩‍🏫' },
            { name: 'Dr. Nagaveni Biradar', subject: 'Data Structures Laboratory',               dept: 'CSE',         emoji: '👩‍🏫' },
            { name: 'Amruth V',             subject: 'Data Structures Laboratory',               dept: 'CSE',         emoji: '👨‍🏫' },
            { name: 'Prof. Prasanna Kumar', subject: 'Project Management (with Git)',            dept: 'CSE',         emoji: '👨‍🏫' }
        ],
        timetable: {
            1: [
                { t: 540, n: 1, sub: 'DSA' }, { t: 595, n: 1, sub: 'DSA' }, { t: 660, n: 1, sub: 'DDCO' }, { t: 715, n: 1, sub: 'OS' },
                { t: 855, n: 3, title: 'Lab session', detail: 'Batch A1: Data Structures Lab. Batch A2: Project Management (Git)', kind: 'lab' }
            ],
            2: [
                { t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'DSA' }, { t: 715, n: 1, sub: 'DSP' },
                { t: 855, n: 3, title: 'Lab session', detail: 'Batch A2: Data Structures Lab. Batch A1: Project Management (Git)', kind: 'lab' }
            ],
            3: [
                { t: 540, n: 1, sub: 'OS' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'DSA' }, { t: 715, n: 1, sub: 'DDCO' },
                { t: 855, n: 1, sub: 'DSP' }, { t: 910, n: 2, sub: 'CP' }
            ],
            4: [
                { t: 540, n: 2, title: 'OOPS Lab', detail: 'Java programming lab', kind: 'lab' },
                { t: 660, n: 1, sub: 'DSP' }, { t: 715, n: 1, sub: 'DDCO' },
                { t: 855, n: 1, sub: 'JAVA' }, { t: 910, n: 1, sub: 'OS' },
                { t: 965, n: 1, title: 'Yoga', detail: 'Wellness period', kind: 'free' }
            ],
            5: [
                { t: 540, n: 1, sub: 'DSP' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'OS' }, { t: 715, n: 1, sub: 'DDCO' },
                { t: 855, n: 2, title: 'Library visit', detail: 'Read, borrow, revise', kind: 'free' }
            ],
            6: [
                { t: 540, n: 1, sub: 'OS' }, { t: 595, n: 1, sub: 'DSA' }, { t: 660, n: 1, sub: 'JAVA' }, { t: 715, n: 1, sub: 'DSP' }
            ]
        },
        exams: [
            { id: 'last',   name: 'Last working day', date: '2026-12-30' },
            { id: 'theory', name: 'VTU theory exams', date: '2027-01-04' },
            { id: 'prac',   name: 'Practical exams',  date: '2027-02-08' },
            { id: 'next',   name: 'Next semester',    date: '2027-02-22' }
        ]
    }
    ,
    'CSE-B|3': {
        note: 'Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batches: B1 is roll numbers 01 to 28, B2 is 29 to 59.',
        subjects: [
            { id: 'DSP',  code: '1BMATCS301', name: 'Distributions and Statistics Probability', faculty: 'Prof. K. Sangameshwar',  kind: 'theory', credits: 3 },
            { id: 'JAVA', code: '1BCS302',    name: 'Object Oriented Programming with Java',    faculty: 'Mrs. Gowri Achappa / Dr. Sreedevi Malipatil', kind: 'theory', credits: 3 },
            { id: 'DDCO', code: '1BCS303',    name: 'Digital Design and Computer Organization', faculty: 'Mr. Shridhar Bilagi',    kind: 'theory', credits: 3 },
            { id: 'OS',   code: '1BCS304',    name: 'Operating Systems',                        faculty: 'Ms. Nithya Santhoshi H', kind: 'theory', credits: 3 },
            { id: 'DS',   code: '1BCS305',    name: 'Data Structures and Applications',         faculty: 'Prof. Kavitha Juliet',   kind: 'theory', credits: 3 },
            { id: 'DSL',  code: '1BCSL306',   name: 'Data Structures Laboratory',               faculty: 'Prof. Kavitha Juliet / Ms. Nithya Santhoshi H', kind: 'lab', credits: 1 },
            { id: 'GIT',  code: '1BCSL307A',  name: 'Project Management (with Git)',            faculty: 'Dr. Bergi Veeresh Gowda', kind: 'lab',   credits: 1 },
            { id: 'CP',   code: '1BCP308',    name: 'Community Project (Project-Based Learning) / Societal Project', faculty: 'Dr. H. Girisha', kind: 'project', credits: 1 }
        ],
        faculty: [
            { name: 'Prof. K. Sangameshwar',    subject: 'Distributions and Statistics Probability', emoji: '👨‍🏫' },
            { name: 'Mrs. Gowri Achappa',       subject: 'Object Oriented Programming with Java',    emoji: '👩‍🏫' },
            { name: 'Dr. Sreedevi Malipatil',   subject: 'Object Oriented Programming with Java',    emoji: '👩‍🏫' },
            { name: 'Mr. Shridhar Bilagi',      subject: 'Digital Design and Computer Organization', emoji: '👨‍🏫' },
            { name: 'Ms. Nithya Santhoshi H',   subject: 'Operating Systems, Data Structures Laboratory', emoji: '👩‍🏫' },
            { name: 'Prof. Kavitha Juliet',     subject: 'Data Structures and Applications, Data Structures Laboratory', emoji: '👩‍🏫' },
            { name: 'Dr. Bergi Veeresh Gowda',  subject: 'Project Management (with Git)',            emoji: '👨‍🏫' },
            { name: 'Dr. H. Girisha',           subject: 'Community Project / Societal Project',     emoji: '👨‍🏫' }
        ],
        timetable: {
            1: [{ t: 540, n: 1, sub: 'OS' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'DSP' }, { t: 715, n: 1, sub: 'DS' }, { t: 855, n: 1, sub: 'DDCO' }, { t: 910, n: 1, sub: 'OS' }],
            2: [{ t: 540, n: 1, sub: 'DSP' }, { t: 595, n: 1, sub: 'DS' }, { t: 660, n: 1, sub: 'DDCO' }, { t: 715, n: 1, sub: 'JAVA' }, { t: 855, n: 1, sub: 'OS' }, { t: 910, n: 2, sub: 'CP' }],
            3: [{ t: 540, n: 1, sub: 'DS' }, { t: 595, n: 1, sub: 'DDCO' }, { t: 660, n: 1, sub: 'DSP' }, { t: 715, n: 1, sub: 'OS' },
                { t: 855, n: 3, title: 'Lab session', detail: 'Batch B1: Data Structures Lab. Batch B2: Project Management (Git)', kind: 'lab' }],
            4: [{ t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'DS' }, { t: 660, n: 1, sub: 'JAVA' }, { t: 715, n: 1, sub: 'DSP' },
                { t: 855, n: 3, title: 'Lab session', detail: 'Batch B2: Data Structures Lab. Batch B1: Project Management (Git)', kind: 'lab' }],
            5: [{ t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'DSP' }, { t: 660, n: 1, sub: 'OS' }, { t: 715, n: 1, sub: 'JAVA' },
                { t: 855, n: 2, title: 'Library visit', detail: 'Read, borrow, revise', kind: 'free' }],
            6: [{ t: 540, n: 1, sub: 'JAVA' }, { t: 595, n: 1, sub: 'DS' }, { t: 660, n: 2, title: 'OOPS Lab', detail: 'Java programming lab', kind: 'lab' }]
        },
        exams: []
    },
    'DS|3': {
        note: 'CSE (Data Science) and CSE (Cyber Security), Section A. Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batches: Batch 1 is roll numbers 01 to 30, Batch 2 is 31 onwards.',
        subjects: [
            { id: 'MATHS', code: '1BMATCS301', name: 'Probability, Distributions and Statistics', faculty: 'Dr. Veeresh B',               kind: 'theory', credits: 3 },
            { id: 'JAVA',  code: '1BCS302',    name: 'Object Oriented Programming with Java',     faculty: 'Mrs. Gowri Achappa',          kind: 'theory', credits: 3 },
            { id: 'DDCO',  code: '1BCS303',    name: 'Digital Design and Computer Organization',  faculty: 'Ms. Sumalatha',               kind: 'theory', credits: 3 },
            { id: 'OS',    code: '1BCS304',    name: 'Operating Systems',                         faculty: 'Prof. A T Satya Narayana Reddy', kind: 'theory', credits: 3 },
            { id: 'DS',    code: '1BCS305',    name: 'Data Structures and Applications',          faculty: 'Dr. H. M. Manhantesh',        kind: 'theory', credits: 3 },
            { id: 'DSL',   code: '1BCSL306',   name: 'Data Structures Laboratory',                faculty: 'Dr. H. M. Manhantesh',        kind: 'lab',    credits: 1 },
            { id: 'GIT',   code: '1BCSL307A',  name: 'Project Management (with Git)',             faculty: 'Prasannakumar S',             kind: 'lab',    credits: 1 },
            { id: 'CP',    code: '1BCP308',    name: 'Community Project (Project-Based Learning)', faculty: 'Dr. Shiva Prasad K M',       kind: 'project', credits: 1 }
        ],
        faculty: [
            { name: 'Dr. Veeresh B',                  subject: 'Probability, Distributions and Statistics', emoji: '👨‍🏫' },
            { name: 'Mrs. Gowri Achappa',             subject: 'Object Oriented Programming with Java',     emoji: '👩‍🏫' },
            { name: 'Ms. Sumalatha',                  subject: 'Digital Design and Computer Organization',  emoji: '👩‍🏫' },
            { name: 'Prof. A T Satya Narayana Reddy', subject: 'Operating Systems',                         emoji: '👨‍🏫' },
            { name: 'Dr. H. M. Manhantesh',           subject: 'Data Structures and Applications, Data Structures Laboratory', emoji: '👨‍🏫' },
            { name: 'Prasannakumar S',                subject: 'Project Management (with Git)',             emoji: '👨‍🏫' },
            { name: 'Dr. Shiva Prasad K M',           subject: 'Community Project',                         emoji: '👨‍🏫' }
        ],
        timetable: {
            1: [{ t: 540, n: 1, sub: 'OS' }, { t: 595, n: 1, sub: 'DS' }, { t: 660, n: 1, sub: 'MATHS' }, { t: 715, n: 1, sub: 'JAVA' },
                { t: 855, n: 3, title: 'Lab session', detail: 'Batch 1: Java Lab. Batch 2: Data Structures Lab.', kind: 'lab' }],
            2: [{ t: 540, n: 1, sub: 'MATHS' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'DS' }, { t: 715, n: 1, sub: 'DDCO' },
                { t: 855, n: 3, title: 'Lab session', detail: 'Batch 2: Java Lab. Batch 1: Data Structures Lab.', kind: 'lab' }],
            3: [{ t: 540, n: 1, sub: 'DS' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'DDCO' }, { t: 715, n: 1, sub: 'OS' },
                { t: 855, n: 1, sub: 'CP' }, { t: 910, n: 1, sub: 'OS' }, { t: 965, n: 1, title: 'Remedial class', detail: 'Extra help session', kind: 'free' }],
            4: [{ t: 540, n: 1, sub: 'JAVA' }, { t: 595, n: 1, sub: 'MATHS' }, { t: 660, n: 1, sub: 'DS' }, { t: 715, n: 1, sub: 'OS' },
                { t: 855, n: 1, sub: 'DDCO' }, { t: 910, n: 1, sub: 'MATHS' }, { t: 965, n: 1, title: 'NSS', detail: 'National Service Scheme', kind: 'free' }],
            5: [{ t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'DS' }, { t: 660, n: 1, sub: 'OS' }, { t: 715, n: 1, title: 'NSS / Yoga', detail: 'National Service Scheme or Yoga', kind: 'free' },
                { t: 855, n: 3, title: 'Git lab', detail: 'Project Management (with Git). Batch 1 and Batch 2.', kind: 'lab' }],
            6: [{ t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'MATHS' }, { t: 715, n: 1, sub: 'CP' }]
        },
        exams: []
    }
    ,
    'AIML-A|3': {
        note: 'Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batches: B1 is roll numbers 01 to 32, B2 is 33 to 64.',
        subjects: [
            { id: 'MATHS', code: '1BMATCS301', name: 'Probability, Distributions and Statistics', faculty: 'Mr. Matti Prabhakar / Mrs. Gangamma', kind: 'theory', credits: 3 },
            { id: 'JAVA',  code: '1BCS302',    name: 'Object Oriented Programming with Java',    faculty: 'Dr. Shilpa Patil',  kind: 'theory', credits: 3 },
            { id: 'DDCO',  code: '1BCS303',    name: 'Digital Design and Computer Organization', faculty: 'Miss Keerthi',      kind: 'theory', credits: 3 },
            { id: 'OS',    code: '1BCS304',    name: 'Operating Systems',                        faculty: 'Dr. T. Hanumantha Reddy',           kind: 'theory', credits: 3 },
            { id: 'DSA',   code: '1BCS305',    name: 'Data Structures and Applications',         faculty: 'ENV Rajesh',        kind: 'theory', credits: 3 },
            { id: 'DSL',   code: '1BCSL306',   name: 'Data Structures Laboratory',               faculty: 'ENV Rajesh / Nazneen Jaha',          kind: 'lab',    credits: 1 },
            { id: 'EDA',   code: '1BAIL307A',  name: 'Exploratory Data Analysis',                faculty: 'Mr. R. Manjunath',  kind: 'lab',    credits: 1 },
            { id: 'CP',    code: '1BCP308',    name: 'Community Project',                        faculty: 'Dr. Prashant K',    kind: 'project', credits: 1 }
        ],
        faculty: [
            { name: 'Mr. Matti Prabhakar', subject: 'Probability, Distributions and Statistics', emoji: '👨‍🏫' },
            { name: 'Mrs. Gangamma', subject: 'Probability, Distributions and Statistics', emoji: '👩‍🏫' },
            { name: 'Dr. Shilpa Patil', subject: 'Object Oriented Programming with Java', emoji: '👩‍🏫' },
            { name: 'Miss Keerthi', subject: 'Digital Design and Computer Organization', emoji: '👩‍🏫' },
            { name: 'Dr. T. Hanumantha Reddy', subject: 'Operating Systems', emoji: '👨‍🏫' },
            { name: 'ENV Rajesh', subject: 'Data Structures and Applications, Data Structures Laboratory', emoji: '👨‍🏫' },
            { name: 'Nazneen Jaha', subject: 'Data Structures Laboratory', emoji: '👩‍🏫' },
            { name: 'Mr. R. Manjunath', subject: 'Exploratory Data Analysis', emoji: '👨‍🏫' },
            { name: 'Dr. Prashant K', subject: 'Community Project', emoji: '👨‍🏫' }
        ],
        timetable: {
            1: [{ t: 540, n: 1, sub: 'DSA' }, { t: 595, n: 1, sub: 'MATHS' }, { t: 660, n: 1, sub: 'JAVA' }, { t: 715, n: 1, sub: 'DDCO' }, { t: 855, n: 3, sub: 'DSL' }],
            2: [{ t: 540, n: 1, sub: 'OS' }, { t: 595, n: 1, sub: 'DDCO' }, { t: 660, n: 2, sub: 'DSL' }, { t: 855, n: 3, title: 'DS lab / Mini project', detail: 'Data Structures lab or mini project', kind: 'lab' }],
            3: [{ t: 540, n: 1, sub: 'OS' }, { t: 595, n: 1, sub: 'DDCO' }, { t: 660, n: 2, title: 'Lab session', detail: 'Batch B1: Java Lab. Batch B2: EDA Lab.', kind: 'lab' }, { t: 855, n: 1, sub: 'MATHS' }, { t: 910, n: 1, sub: 'JAVA' }, { t: 965, n: 1, sub: 'JAVA' }],
            4: [{ t: 540, n: 1, sub: 'JAVA' }, { t: 595, n: 1, sub: 'DSA' }, { t: 660, n: 1, sub: 'OS' }, { t: 715, n: 1, sub: 'MATHS' }, { t: 855, n: 3, title: 'Lab session', detail: 'Batch B2: Java Lab. Batch B1: EDA Lab.', kind: 'lab' }],
            5: [{ t: 540, n: 1, sub: 'MATHS' }, { t: 595, n: 1, sub: 'DSA' }, { t: 660, n: 1, sub: 'DDCO' }, { t: 715, n: 1, sub: 'DSA' }, { t: 855, n: 1, sub: 'OS' }, { t: 910, n: 1, sub: 'DDCO' }, { t: 965, n: 1, title: 'Library', detail: 'Read, borrow, revise', kind: 'free' }],
            6: [{ t: 540, n: 1, sub: 'JAVA' }, { t: 595, n: 1, sub: 'OS' }, { t: 660, n: 1, sub: 'DSA' }, { t: 715, n: 1, sub: 'MATHS' }]
        },
        exams: []
    }
    ,
    'AIML-B|3': {
        note: 'Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batches: B1 is roll numbers 01 to 32, B2 is 33 to 64.',
        subjects: [
            { id: 'MATHS', code: '1BMATCS301', name: 'Probability, Distributions and Statistics', faculty: 'Dr. Meti Prabhakar', kind: 'theory', credits: 3 },
            { id: 'JAVA',  code: '1BCS302',    name: 'Object Oriented Programming with Java',    faculty: 'Dr. Shilpa Patil',  kind: 'theory', credits: 3 },
            { id: 'DDCO',  code: '1BCS303',    name: 'Digital Design and Computer Organization', faculty: 'Miss Keerthi',      kind: 'theory', credits: 3 },
            { id: 'OS',    code: '1BCS304',    name: 'Operating Systems',                        faculty: 'Mr. R. Manjunath',           kind: 'theory', credits: 3 },
            { id: 'DSA',   code: '1BCS305',    name: 'Data Structures and Applications',         faculty: 'ENV Rajesh',        kind: 'theory', credits: 3 },
            { id: 'DSL',   code: '1BCSL306',   name: 'Data Structures Laboratory',               faculty: 'Dr. Sai Madhavi D / Nazneen Jaha',          kind: 'lab',    credits: 1 },
            { id: 'EDA',   code: '1BAIL307A',  name: 'Exploratory Data Analysis',                faculty: 'Mr. R. Manjunath',  kind: 'lab',    credits: 1 },
            { id: 'CP',    code: '1BCP308',    name: 'Community Project',                        faculty: 'Dr. Prashant K',    kind: 'project', credits: 1 }
        ],
        faculty: [
            { name: 'Dr. Meti Prabhakar', subject: 'Probability, Distributions and Statistics', emoji: '👨‍🏫' },
            { name: 'Dr. Shilpa Patil', subject: 'Object Oriented Programming with Java', emoji: '👩‍🏫' },
            { name: 'Miss Keerthi', subject: 'Digital Design and Computer Organization', emoji: '👩‍🏫' },
            { name: 'Mr. R. Manjunath', subject: 'Operating Systems', emoji: '👨‍🏫' },
            { name: 'ENV Rajesh', subject: 'Data Structures and Applications', emoji: '👨‍🏫' },
            { name: 'Dr. Sai Madhavi D', subject: 'Data Structures Laboratory', emoji: '👩‍🏫' },
            { name: 'Nazneen Jaha', subject: 'Data Structures Laboratory', emoji: '👩‍🏫' },
            { name: 'Mr. R. Manjunath', subject: 'Operating Systems, Exploratory Data Analysis', emoji: '👨‍🏫' },
            { name: 'Dr. Prashant K', subject: 'Community Project', emoji: '👨‍🏫' }
        ],
        timetable: {
            1: [{ t: 540, n: 1, sub: 'JAVA' }, { t: 595, n: 1, sub: 'DSL' }, { t: 660, n: 2, sub: 'DSL' }, { t: 855, n: 1, sub: 'OS' }, { t: 910, n: 1, sub: 'DDCO' }, { t: 965, n: 1, sub: 'MATHS' }],
            2: [{ t: 540, n: 1, sub: 'DSA' }, { t: 595, n: 1, sub: 'MATHS' }, { t: 660, n: 1, sub: 'DDCO' }, { t: 715, n: 1, sub: 'DSA' }, { t: 855, n: 1, sub: 'OS' }, { t: 910, n: 1, sub: 'JAVA' }, { t: 965, n: 1, sub: 'JAVA' }],
            3: [{ t: 540, n: 1, sub: 'MATHS' }, { t: 595, n: 1, sub: 'OS' }, { t: 660, n: 1, sub: 'DDCO' }, { t: 715, n: 1, sub: 'DSA' }, { t: 855, n: 3, sub: 'DSL' }],
            4: [{ t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'OS' }, { t: 660, n: 1, sub: 'DSA' }, { t: 715, n: 1, sub: 'JAVA' }, { t: 855, n: 1, sub: 'MATHS' }, { t: 910, n: 1, sub: 'JAVA' }, { t: 965, n: 1, sub: 'DDCO' }],
            5: [{ t: 540, n: 2, title: 'Lab session', detail: 'Batch B2: Java Lab. Batch B1: EDA Lab.', kind: 'lab' }, { t: 660, n: 1, sub: 'OS' }, { t: 715, n: 1, sub: 'MATHS' }, { t: 855, n: 3, sub: 'CP' }],
            6: [{ t: 540, n: 1, sub: 'DSA' }, { t: 660, n: 2, title: 'Lab session', detail: 'Batch B1: Java Lab. Batch B2: EDA Lab.', kind: 'lab' }]
        },
        exams: []
    }
    ,
    'CIVIL|3': {
        note: 'Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab batches: A1 is odd roll numbers (1, 3, 5 ... 45), A2 is even roll numbers (2, 4, 6 ... 44).',
        subjects: [
            { id: 'MAT',   code: '1BMAT301', name: 'Probability and Statistics for Civil Engineers', faculty: 'Dr. Sumangalama',   kind: 'theory', credits: 5 },
            { id: 'FM&HM', code: '1BCV302',  name: 'Fluid Mechanics and Hydraulic Machinery',        faculty: 'Mr. Ganesh H',      kind: 'theory', credits: 5 },
            { id: 'SM',    code: '1BCV303',  name: 'Solid Mechanics',                                faculty: 'Dr. Mahesh',        kind: 'theory', credits: 5 },
            { id: 'BM&C',  code: '1BCV304',  name: 'Building Materials and Construction',            faculty: 'Ms. Raja Selvi',    kind: 'theory', credits: 3 },
            { id: 'EGIP',  code: '1BCV305',  name: 'Engineering Geology for Infrastructure Projects', faculty: 'Mr. Pavan Kumar M', kind: 'theory', credits: 3 },
            { id: 'CAD',   code: '1BCVL306', name: 'Building CAD and 3D Modelling Lab',              faculty: 'Mr. Veereshaiah H M', kind: 'lab',  credits: 2 },
            { id: 'EGSI',  code: '1BCV307D', name: 'Engineering Geology and Soil Identification Lab', faculty: 'Mr. Pavan Kumar M', kind: 'lab',   credits: 2 },
            { id: 'CP',    code: '1BCP308',  name: 'Community Project / Societal Project',           faculty: 'Ms. N Kavya',       kind: 'project', credits: 1 }
        ],
        faculty: [
            { name: 'Dr. Sumangalama',     subject: 'Probability and Statistics for Civil Engineers', emoji: '👩‍🏫' },
            { name: 'Mr. Ganesh H',        subject: 'Fluid Mechanics and Hydraulic Machinery',        emoji: '👨‍🏫' },
            { name: 'Dr. Mahesh',          subject: 'Solid Mechanics',                                emoji: '👨‍🏫' },
            { name: 'Ms. Raja Selvi',      subject: 'Building Materials and Construction',            emoji: '👩‍🏫' },
            { name: 'Mr. Pavan Kumar M',   subject: 'Engineering Geology for Infrastructure Projects, Engineering Geology and Soil Identification Lab', emoji: '👨‍🏫' },
            { name: 'Mr. Veereshaiah H M', subject: 'Building CAD and 3D Modelling Lab',              emoji: '👨‍🏫' },
            { name: 'Ms. N Kavya',         subject: 'Community Project / Societal Project, NSS',      emoji: '👩‍🏫' },
            { name: 'Ms. Kaveri P.',       subject: 'Mathematics course for Lateral Entry Students',  emoji: '👩‍🏫' }
        ],
        timetable: {
            1: [{ t: 540, n: 1, sub: 'SM' }, { t: 595, n: 1, sub: 'BM&C' }, { t: 660, n: 1, sub: 'MAT' }, { t: 715, n: 1, sub: 'FM&HM' }, { t: 855, n: 3, title: 'Lab session', detail: 'Batch A1: FM&HM Lab. Batch A2: NSS.', kind: 'lab' }],
            2: [{ t: 540, n: 1, sub: 'EGIP' }, { t: 595, n: 1, sub: 'FM&HM' }, { t: 660, n: 1, title: 'MAAT', detail: 'As printed on the college timetable', kind: 'theory' }, { t: 715, n: 1, sub: 'SM' }, { t: 855, n: 3, title: 'Lab session', detail: 'Batch A2: FM&HM Lab. Batch A1: NSS.', kind: 'lab' }],
            3: [{ t: 540, n: 1, sub: 'MAT' }, { t: 595, n: 1, sub: 'BM&C' }, { t: 660, n: 1, sub: 'EGIP' }, { t: 715, n: 1, sub: 'FM&HM' }, { t: 855, n: 1, title: 'TW/SL', detail: 'As printed on the college timetable', kind: 'free' },
                { t: 910, n: 2, title: 'Mathematics course', detail: 'For lateral entry students. Ms. Kaveri P.', kind: 'theory' }],
            4: [{ t: 540, n: 1, sub: 'BM&C' }, { t: 595, n: 1, sub: 'FM&HM' }, { t: 660, n: 1, sub: 'EGIP' }, { t: 715, n: 1, sub: 'SM' }, { t: 855, n: 3, title: 'Lab session', detail: 'Batch A1: CAD Lab. Batch A2: EGSI Lab.', kind: 'lab' }],
            5: [{ t: 540, n: 2, sub: 'FM&HM' }, { t: 660, n: 1, sub: 'MAT' }, { t: 715, n: 1, title: 'TW/SL', detail: 'As printed on the college timetable', kind: 'free' }, { t: 855, n: 3, title: 'Lab session', detail: 'Batch A2: CAD Lab. Batch A1: EGSI Lab.', kind: 'lab' }],
            6: [{ t: 540, n: 1, sub: 'SM' }, { t: 595, n: 1, sub: 'MAT' }, { t: 660, n: 1, sub: 'CP' }, { t: 715, n: 1, sub: 'SM' }]
        },
        exams: []
    }
    ,
    'ISE|3': {
        note: 'Break 10:50 to 11:00, lunch 12:50 to 2:15. Lab periods are for the whole class (roll numbers 1 to 40).',
        subjects: [
            { id: 'MATHS', code: '18CS302',   name: 'Probability Distributions and Statistics', faculty: 'Dr. B H Sherla',        kind: 'theory', credits: 3 },
            { id: 'JAVA',  code: '18CS303',   name: 'Data Structures with Java',                faculty: 'Dr. B H Sherla',        kind: 'theory', credits: 3 },
            { id: 'DDCO',  code: '18CS301',   name: 'DDCO',                                     faculty: 'Sumalatha B',           kind: 'theory', credits: 3 },
            { id: 'OS',    code: '18CS304',   name: 'Operating System',                         faculty: 'Dr. Sreerajith B',      kind: 'theory', credits: 3 },
            { id: 'DS',    code: '18CS305',   name: 'Data Structures',                          faculty: 'Dr. M Mahantesh H M',   kind: 'theory', credits: 3 },
            { id: 'DSL',   code: '18CSL306',  name: 'Data Structures Lab',                      faculty: 'Dr. M Mahantesh H M',   kind: 'lab',    credits: 1 },
            { id: 'GIT',   code: '18CSL307A', name: 'Git Hub Lab',                              faculty: 'K S Viniyas Kumar',     kind: 'lab',    credits: 1 },
            { id: 'CP',    code: '18CP308',   name: 'Project',                                  faculty: 'All staff',             kind: 'project', credits: 1 }
        ],
        faculty: [
            { name: 'Dr. B H Sherla',      subject: 'Probability Distributions and Statistics, Data Structures with Java', emoji: '👨‍🏫' },
            { name: 'Sumalatha B',         subject: 'DDCO',                         emoji: '👩‍🏫' },
            { name: 'Dr. Sreerajith B',    subject: 'Operating System',             emoji: '👨‍🏫' },
            { name: 'Dr. M Mahantesh H M', subject: 'Data Structures, Data Structures Lab', emoji: '👨‍🏫' },
            { name: 'K S Viniyas Kumar',   subject: 'Git Hub Lab',                  emoji: '👨‍🏫' }
        ],
        timetable: {
            1: [{ t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'DDCO' }, { t: 660, n: 1, sub: 'JAVA' }, { t: 715, n: 1, sub: 'DS' }, { t: 855, n: 3, title: 'Java Lab', detail: 'Whole class', kind: 'lab' }],
            2: [{ t: 540, n: 1, sub: 'DS' }, { t: 595, n: 1, sub: 'DDCO' }, { t: 660, n: 1, sub: 'DS' }, { t: 715, n: 1, sub: 'JAVA' }, { t: 855, n: 3, sub: 'GIT' }],
            3: [{ t: 540, n: 1, sub: 'OS' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'DS' }, { t: 715, n: 1, sub: 'MATHS' }, { t: 855, n: 3, title: 'Data Structures / Git Hub Lab (TD)', detail: 'As printed on the college timetable', kind: 'lab' }],
            4: [{ t: 540, n: 1, sub: 'DDCO' }, { t: 595, n: 1, sub: 'DS' }, { t: 660, n: 1, sub: 'OS' }, { t: 715, n: 1, sub: 'MATHS' }, { t: 855, n: 3, sub: 'DSL' }],
            5: [{ t: 540, n: 1, sub: 'MATHS' }, { t: 595, n: 1, sub: 'JAVA' }, { t: 660, n: 1, sub: 'OS' }, { t: 715, n: 1, sub: 'DDCO' }, { t: 855, n: 3, sub: 'CP' }],
            6: [{ t: 540, n: 1, sub: 'JAVA' }, { t: 595, n: 1, sub: 'DS' }, { t: 660, n: 1, sub: 'DDCO' }, { t: 715, n: 1, sub: 'MATHS' }]
        },
        exams: []
    }
};

// Active class data. app.js fills these in from the class the student picked.
let SUBJECTS = [], FACULTY = [], TIMETABLE = {}, EXAMS = [];

// VTU grade scale (percentage of marks -> grade point)
const GRADES = [
    { min: 90, g: 'O',  p: 10 }, { min: 80, g: 'A+', p: 9 }, { min: 70, g: 'A', p: 8 },
    { min: 60, g: 'B+', p: 7 },  { min: 55, g: 'B',  p: 6 }, { min: 50, g: 'C', p: 5 },
    { min: 40, g: 'P',  p: 4 },  { min: 0,  g: 'F',  p: 0 }
];

const STUDY_CIRCLES = [
    { id: 'ai',     emoji: '🤖', name: 'AI Study Circle',     topic: 'Intro to AI' },
    { id: 'python', emoji: '🐍', name: 'Python Coders Club',  topic: 'Python programming' },
    { id: 'maths',  emoji: '📐', name: 'Maths Doubt Solvers', topic: 'Applied mathematics' },
    { id: 'chem',   emoji: '🧪', name: 'Chem Lab Prep Squad', topic: 'Applied chemistry' }
];

// Badges. `val` reads progress from the stats object, `goal` is the target.
const BADGES = [
    { id: 'hello',   icon: '👋', name: 'Hello!',          how: 'Open ElevenNotes',                 goal: 1,   val: s => 1 },
    { id: 'mine',    icon: '✏️', name: 'Made it mine',    how: 'Add your name and USN',            goal: 1,   val: s => s.profileDone ? 1 : 0 },
    { id: 'tick',    icon: '✅', name: 'First tick',      how: 'Finish 1 task',                    goal: 1,   val: s => s.tasksDone },
    { id: 'master',  icon: '🎯', name: 'Task master',     how: 'Finish 10 tasks',                  goal: 10,  val: s => s.tasksDone },
    { id: 'focus1',  icon: '🍅', name: 'First focus',     how: 'Complete 1 focus session',         goal: 1,   val: s => s.focusSessions },
    { id: 'deep',    icon: '🧠', name: 'Deep focus',      how: 'Focus for 120 minutes in total',   goal: 120, val: s => s.focusMinutes },
    { id: 'notes',   icon: '📝', name: 'Note keeper',     how: 'Save 3 notes',                     goal: 3,   val: s => s.notesAdded },
    { id: 'faculty', icon: '⭐', name: 'Faculty fan',     how: 'Rate 3 faculty',                   goal: 3,   val: s => s.rated },
    { id: 'calc',    icon: '🧮', name: 'Number cruncher', how: 'Use the SGPA and attendance tools', goal: 2,  val: s => (s.sgpaUsed ? 1 : 0) + (s.whatifUsed ? 1 : 0) },
    { id: 'owl',     icon: '🌙', name: 'Night owl',       how: 'Try dark mode',                    goal: 1,   val: s => s.darkTried ? 1 : 0 },
    { id: 'circle',  icon: '🤝', name: 'Joined in',       how: 'Join a study circle',              goal: 1,   val: s => s.circles },
    { id: 'roll',    icon: '🔥', name: 'On a roll',       how: 'Visit 3 days in a row',            goal: 3,   val: s => s.streak },
    { id: 'week',    icon: '🏆', name: 'Week warrior',    how: 'Visit 7 days in a row',            goal: 7,   val: s => s.streak }
];

const CHALLENGES = [
    { id: 'task',  icon: '✅', text: 'Finish 1 task',            goal: 1, xp: 20, val: d => d.tasksDone },
    { id: 'focus', icon: '🍅', text: 'Complete 2 focus sessions', goal: 2, xp: 30, val: d => d.focusSessions },
    { id: 'plan',  icon: '📝', text: 'Add a task or a note',      goal: 1, xp: 10, val: d => d.added }
];

const LEVELS = ['Fresher', 'Learner', 'Scholar', 'Achiever', 'Topper', 'Legend'];
