export const CATEGORIES = {
  "Technology & Digital": [
    "Software Development", "Web Development", "Mobile Development", "Cybersecurity",
    "Data & AI", "Cloud Computing", "UI/UX Design", "IT & Networking",
    "Product Management", "QA & Testing"
  ],
  "Creative & Media": [
    "Graphic Design", "Video Production", "Animation & Motion Graphics", "Photography",
    "Content Writing & Copywriting", "Journalism", "Podcast & Audio",
    "Social Media Management", "Brand & Identity Design", "Game Design"
  ],
  "Business & Management": [
    "Business Strategy", "Project Management", "Operations", "Human Resources",
    "Recruitment", "Sales", "Customer Success", "Business Development", "Executive Leadership"
  ],
  "Marketing & Advertising": [
    "Digital Marketing", "SEO & SEM", "Email Marketing", "Influencer Marketing",
    "Public Relations", "Market Research", "Advertising", "Growth Hacking"
  ],
  "Finance & Legal": [
    "Accounting", "Financial Planning", "Investment & Banking", "Tax & Audit",
    "Corporate Law", "Contract Law", "Compliance", "Insurance"
  ],
  "Healthcare & Wellness": [
    "Medicine & Clinical", "Nursing", "Mental Health", "Nutrition & Dietetics",
    "Fitness & Personal Training", "Pharmacy", "Medical Research"
  ],
  "Education & Coaching": [
    "Teaching", "Curriculum Development", "Corporate Training", "Life Coaching",
    "Career Coaching", "E-learning", "Academic Research"
  ],
  "Engineering & Architecture": [
    "Civil Engineering", "Mechanical Engineering", "Electrical Engineering",
    "Architecture", "Interior Design", "Construction Management"
  ],
  "Arts & Entertainment": [
    "Music Production", "Performing Arts", "Film & Theatre", "Fashion Design",
    "Fine Arts", "Styling"
  ],
  "Trades & Skilled Labour": [
    "Electrician", "Plumber", "Carpenter", "Mechanic",
    "Logistics & Supply Chain", "Manufacturing", "Agriculture"
  ],
  "Science & Research": [
    "Biotechnology", "Environmental Science", "Chemistry", "Physics", "Social Research"
  ],
  "Nonprofit & Social Impact": [
    "NGO Management", "Community Development", "Policy & Advocacy", "Volunteer Coordination"
  ]
};

export const CATEGORY_NAMES = Object.keys(CATEGORIES);

// Flat list of all skills derived from subcategories, plus common standalone skills
export const ALL_SKILLS = [
  // Tech
  "JavaScript", "TypeScript", "Python", "React", "Node.js", "Vue.js", "Next.js",
  "GraphQL", "REST APIs", "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes",
  "AWS", "Google Cloud", "Azure", "DevOps", "CI/CD", "Machine Learning", "Data Science",
  "iOS Development", "Android Development", "Flutter", "Swift", "Kotlin",
  "Cybersecurity", "Penetration Testing", "Blockchain", "Smart Contracts",
  // Design
  "UI Design", "UX Design", "Figma", "Sketch", "Adobe XD", "Illustrator", "Photoshop",
  "Graphic Design", "Brand Identity", "Motion Graphics", "3D Modeling", "Animation",
  "Typography", "Illustration", "Game Design",
  // Creative
  "Video Production", "Video Editing", "Cinematography", "Photography",
  "Podcast Production", "Audio Engineering", "Music Production", "Songwriting",
  "Voiceover", "Content Writing", "Copywriting", "Screenwriting", "Journalism",
  "Social Media", "Content Strategy",
  // Business & Marketing
  "Business Strategy", "Product Management", "Project Management", "Agile / Scrum",
  "Sales", "Business Development", "CRM", "Customer Success", "Operations",
  "Digital Marketing", "SEO", "SEM / PPC", "Email Marketing", "Growth Hacking",
  "Public Relations", "Market Research", "Influencer Marketing", "Brand Strategy",
  // Finance & Legal
  "Accounting", "Financial Modelling", "Venture Capital", "Private Equity",
  "Tax & Audit", "Corporate Law", "Contract Negotiation", "Compliance",
  // Soft Skills
  "Leadership", "Public Speaking", "Mentorship", "Community Building",
  "Event Management", "Recruiting", "Coaching",
];

export const SKILL_SUGGESTIONS = (query) =>
  ALL_SKILLS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 12);

export const ROLE_LABELS = {
  creator: "Creator",
  professional: "Professional",
  investor: "Investor or Brand",
  business: "Business",
  member: "Member",
  admin: "Admin"
};

export const ROLE_DESCRIPTIONS = {
  creator: "I make content, music, art, or media — this is where your work gets discovered and funded.",
  professional: "I offer skills and services — find clients, showcase your portfolio, and get booked.",
  investor: "I fund ideas or work with creators — discover talent, review pitches, and close deals.",
  business: "I hire talent or seek partnerships — post opportunities and find the right people.",
  member: "I am here to connect, learn, and explore — follow creators, join communities, and grow.",
  admin: "Platform administration"
};