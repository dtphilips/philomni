/**
 * Computes a collaboration match score (0-100) between two user profiles.
 *
 * Scoring:
 *   - Shared skills overlap:          30 pts  (proportional)
 *   - Complementary categories:       25 pts  (same sector, different subcategory = synergy)
 *   - Same category (direct peer):    15 pts
 *   - Availability:                   15 pts  (both "available")
 *   - Open to collabs flag:           10 pts
 *   - Role complementarity:            5 pts  (e.g. creator + investor)
 */

const COMPLEMENTARY_ROLES = {
  creator: ['investor', 'business', 'professional'],
  professional: ['business', 'investor', 'creator'],
  investor: ['creator', 'professional', 'business'],
  business: ['professional', 'creator'],
  member: ['professional', 'creator'],
};

// Map subcategories to their parent sector
const SUBCATEGORY_TO_SECTOR = {};
const CATEGORIES_MAP = {
  "Technology & Digital": ["Software Development","Web Development","Mobile Development","Cybersecurity","Data & AI","Cloud Computing","UI/UX Design","IT & Networking","Product Management","QA & Testing"],
  "Creative & Media": ["Graphic Design","Video Production","Animation & Motion Graphics","Photography","Content Writing & Copywriting","Journalism","Podcast & Audio","Social Media Management","Brand & Identity Design","Game Design"],
  "Business & Management": ["Business Strategy","Project Management","Operations","Human Resources","Recruitment","Sales","Customer Success","Business Development","Executive Leadership"],
  "Marketing & Advertising": ["Digital Marketing","SEO & SEM","Email Marketing","Influencer Marketing","Public Relations","Market Research","Advertising","Growth Hacking"],
  "Finance & Legal": ["Accounting","Financial Planning","Investment & Banking","Tax & Audit","Corporate Law","Contract Law","Compliance","Insurance"],
};
Object.entries(CATEGORIES_MAP).forEach(([sector, subs]) => {
  subs.forEach(sub => { SUBCATEGORY_TO_SECTOR[sub] = sector; });
});

function getSector(category) {
  return SUBCATEGORY_TO_SECTOR[category] || category;
}

export function computeCollaboratorScore(currentUser, candidate) {
  if (!currentUser || !candidate || currentUser.id === candidate.id) return 0;

  let score = 0;

  // 1. Shared skills overlap (30 pts)
  const mySkills = (currentUser.skills || []).map(s => s.toLowerCase().trim());
  const theirSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());

  if (mySkills.length > 0 && theirSkills.length > 0) {
    const shared = mySkills.filter(s => theirSkills.includes(s)).length;
    const unionSize = new Set([...mySkills, ...theirSkills]).size;
    // Jaccard similarity × 30
    score += Math.round((shared / unionSize) * 30);
  }

  // 2. Category alignment (25 pts for same sector, 15 for direct category peer)
  const mySector = getSector(currentUser.primary_category);
  const theirSector = getSector(candidate.primary_category);

  if (mySector && theirSector) {
    if (currentUser.primary_category === candidate.primary_category) {
      // Direct peers — great for collaboration within same niche
      score += 15;
    } else if (mySector === theirSector) {
      // Same sector but different specialisation — highly complementary
      score += 25;
    }
  }

  // Cross-check secondary categories too
  if (candidate.primary_category === currentUser.secondary_category ||
      candidate.secondary_category === currentUser.primary_category) {
    score += 10;
  }

  // 3. Availability (15 pts)
  if (currentUser.availability === 'available' && candidate.availability === 'available') {
    score += 15;
  } else if (candidate.availability === 'available') {
    score += 8;
  }

  // 4. Open to collabs (10 pts)
  if (candidate.open_to_collabs) score += 10;

  // 5. Role complementarity (5 pts)
  const complementary = COMPLEMENTARY_ROLES[currentUser.role] || [];
  if (complementary.includes(candidate.role)) score += 5;

  return Math.min(100, score);
}

export function getCollabMatchLabel(score) {
  if (score >= 75) return { label: 'Strong Fit', color: 'text-green-600', bg: 'bg-green-500/10 border-green-200' };
  if (score >= 50) return { label: 'Good Fit', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' };
  if (score >= 30) return { label: 'Potential', color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-200' };
  return null; // below threshold — don't show
}

/**
 * Returns a human-readable list of reasons why two users match.
 */
export function getMatchReasons(currentUser, candidate) {
  const reasons = [];

  const mySkills = (currentUser.skills || []).map(s => s.toLowerCase().trim());
  const theirSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());
  const shared = (currentUser.skills || []).filter(s => theirSkills.includes(s.toLowerCase().trim()));

  if (shared.length > 0) {
    reasons.push(`Shared skills: ${shared.slice(0, 3).join(', ')}${shared.length > 3 ? ` +${shared.length - 3}` : ''}`);
  }

  const mySector = getSector(currentUser.primary_category);
  const theirSector = getSector(candidate.primary_category);
  if (mySector === theirSector && currentUser.primary_category !== candidate.primary_category) {
    reasons.push(`Complementary expertise in ${mySector}`);
  } else if (currentUser.primary_category === candidate.primary_category) {
    reasons.push(`Both specialise in ${currentUser.primary_category}`);
  }

  if (candidate.open_to_collabs) reasons.push('Open to collaborations');
  if (candidate.availability === 'available') reasons.push('Currently available');

  return reasons;
}