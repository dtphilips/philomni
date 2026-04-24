/**
 * Computes a match score (0-100) between a user profile and a job listing.
 *
 * Scoring breakdown:
 *   - Category match (primary):   40 pts
 *   - Subcategory match:          20 pts
 *   - Skills overlap:             25 pts  (proportional to matched skills)
 *   - Rate / budget alignment:    15 pts
 */
export function computeMatchScore(user, job) {
  if (!user || !job) return 0;

  let score = 0;

  // 1. Category match (40 pts)
  if (job.category && user.primary_category) {
    if (user.primary_category === job.category) {
      score += 40;
    } else if (user.secondary_category === job.category) {
      score += 20; // secondary category partial match
    }
  }

  // 2. Subcategory match (20 pts)
  if (job.subcategory && user.secondary_category) {
    if (user.secondary_category === job.subcategory) {
      score += 20;
    }
  }

  // 3. Skills overlap (25 pts)
  const jobSkills = (job.skills_required || []).map(s => s.toLowerCase().trim());
  const userSkills = (user.skills || []).map(s => s.toLowerCase().trim());

  if (jobSkills.length > 0 && userSkills.length > 0) {
    const matched = jobSkills.filter(s => userSkills.includes(s)).length;
    score += Math.round((matched / jobSkills.length) * 25);
  } else if (jobSkills.length === 0 && userSkills.length > 0) {
    // No skills required → no penalty, partial credit
    score += 10;
  }

  // 4. Rate / budget alignment (15 pts)
  const hourlyRate = parseFloat(user.hourly_rate) || 0;
  const budgetMin = parseFloat(job.budget_min) || 0;
  const budgetMax = parseFloat(job.budget_max) || 0;

  if (hourlyRate > 0 && (budgetMin > 0 || budgetMax > 0)) {
    // Determine if budget looks hourly or annual/project
    const isHourlyScale = budgetMax > 0 && budgetMax < 1000;
    const isAnnualScale = budgetMin > 10000;

    if (isHourlyScale) {
      // Direct hourly comparison
      const low = budgetMin || budgetMax * 0.5;
      const high = budgetMax || budgetMin * 2;
      if (hourlyRate >= low && hourlyRate <= high) score += 15;
      else if (hourlyRate <= high * 1.2 && hourlyRate >= low * 0.8) score += 8;
    } else if (isAnnualScale) {
      // Convert annual to rough hourly (÷ 2000 working hrs)
      const annualLow = budgetMin;
      const annualHigh = budgetMax || budgetMin * 1.3;
      const impliedHourly = ((annualLow + annualHigh) / 2) / 2000;
      if (Math.abs(hourlyRate - impliedHourly) / impliedHourly <= 0.3) score += 15;
      else if (Math.abs(hourlyRate - impliedHourly) / impliedHourly <= 0.6) score += 8;
    } else {
      // Unknown scale — give partial credit if user has a rate at all
      score += 5;
    }
  }

  return Math.min(100, score);
}

export function getMatchLabel(score) {
  if (score >= 80) return { label: 'Excellent Match', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  if (score >= 60) return { label: 'Good Match', color: 'text-primary', bg: 'bg-accent border-primary/20' };
  if (score >= 40) return { label: 'Fair Match', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
  return { label: 'Low Match', color: 'text-muted-foreground', bg: 'bg-muted border-border' };
}