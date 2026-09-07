export interface ScoreFactor {
  category: 'industry' | 'company_size' | 'job_title' | 'engagement' | 'email_validity';
  label: string;
  points: number;
  maxPoints: number;
  description: string;
}

export interface ScoreBreakdown {
  total: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  tierLabel: string;
  factors: ScoreFactor[];
}

export interface LeadScoreInput {
  industry?: string | null;
  employee_count?: number | null;
  status?: string | null;
  email_status?: string | null;
  email?: string | null;
  domain?: string | null;
  phone?: string | null;
  contacts?: Array<{
    title?: string | null;
    email?: string | null;
  }>;
}

export class LeadScorer {
  /**
   * Calculates a transparent, multi-attribute lead score (0-100).
   */
  calculateScore(lead: LeadScoreInput): ScoreBreakdown {
    const factors: ScoreFactor[] = [];

    // 1. Industry Scoring (Max 25 pts)
    const ind = (lead.industry || '').toLowerCase();
    let indPoints = 5;
    let indDesc = 'Standard or unclassified industry';

    if (
      ind.includes('software') ||
      ind.includes('saas') ||
      ind.includes('cloud') ||
      ind.includes('artificial intelligence') ||
      ind.includes('fintech') ||
      ind.includes('cybersecurity')
    ) {
      indPoints = 25;
      indDesc = 'High-value SaaS / Tech / FinTech sector (+25)';
    } else if (
      ind.includes('health') ||
      ind.includes('biotech') ||
      ind.includes('medical') ||
      ind.includes('aerospace') ||
      ind.includes('defense')
    ) {
      indPoints = 22;
      indDesc = 'High-growth Enterprise / MedTech / Defense (+22)';
    } else if (
      ind.includes('finance') ||
      ind.includes('capital') ||
      ind.includes('consulting') ||
      ind.includes('professional') ||
      ind.includes('manufacturing')
    ) {
      indPoints = 18;
      indDesc = 'Commercial / Professional B2B services (+18)';
    } else if (lead.industry) {
      indPoints = 12;
      indDesc = `Identified vertical: ${lead.industry} (+12)`;
    }

    factors.push({
      category: 'industry',
      label: 'Industry Alignment',
      points: indPoints,
      maxPoints: 25,
      description: indDesc,
    });

    // 2. Company Size / Employee Count (Max 25 pts)
    const count = lead.employee_count || 0;
    let sizePoints = 5;
    let sizeDesc = 'Unspecified or pre-seed scale';

    if (count >= 500) {
      sizePoints = 25;
      sizeDesc = `Enterprise scale (${count}+ employees) (+25)`;
    } else if (count >= 100) {
      sizePoints = 20;
      sizeDesc = `Mid-Market scale (${count} employees) (+20)`;
    } else if (count >= 20) {
      sizePoints = 15;
      sizeDesc = `Growth SMB (${count} employees) (+15)`;
    } else if (count >= 5) {
      sizePoints = 10;
      sizeDesc = `Early-stage team (${count} employees) (+10)`;
    } else if (count > 0) {
      sizePoints = 6;
      sizeDesc = `Micro team (${count} employees) (+6)`;
    }

    factors.push({
      category: 'company_size',
      label: 'Company Scale',
      points: sizePoints,
      maxPoints: 25,
      description: sizeDesc,
    });

    // 3. Job Title Seniority of Key Contacts (Max 25 pts)
    let titlePoints = 0;
    let titleDesc = 'No decision makers identified yet';

    if (lead.contacts && lead.contacts.length > 0) {
      let maxTitleRank = 0;
      for (const contact of lead.contacts) {
        const title = (contact.title || '').toLowerCase();
        if (
          title.includes('ceo') ||
          title.includes('chief executive') ||
          title.includes('founder') ||
          title.includes('president') ||
          title.includes('owner') ||
          title.includes('cto') ||
          title.includes('cro') ||
          title.includes('cfo') ||
          title.includes('cmo')
        ) {
          maxTitleRank = Math.max(maxTitleRank, 25);
          titleDesc = `C-Level / Founder identified (${contact.title}) (+25)`;
        } else if (
          title.includes('vp') ||
          title.includes('vice president') ||
          title.includes('head of') ||
          title.includes('partner')
        ) {
          if (maxTitleRank < 20) {
            maxTitleRank = 20;
            titleDesc = `VP / Department Head identified (${contact.title}) (+20)`;
          }
        } else if (title.includes('director')) {
          if (maxTitleRank < 15) {
            maxTitleRank = 15;
            titleDesc = `Director-level stakeholder (${contact.title}) (+15)`;
          }
        } else if (title.includes('manager') || title.includes('lead')) {
          if (maxTitleRank < 10) {
            maxTitleRank = 10;
            titleDesc = `Management-level contact (${contact.title}) (+10)`;
          }
        } else if (maxTitleRank < 5) {
          maxTitleRank = 5;
          titleDesc = `Contact person on file (${contact.title || 'General'}) (+5)`;
        }
      }
      titlePoints = maxTitleRank;
    }

    factors.push({
      category: 'job_title',
      label: 'Decision Maker Seniority',
      points: titlePoints,
      maxPoints: 25,
      description: titleDesc,
    });

    // 4. Pipeline Engagement & Status (Max 15 pts)
    let statusPoints = 5;
    let statusDesc = 'New lead discovered';
    const status = (lead.status || 'NEW').toUpperCase();

    if (status === 'CONTACTED') {
      statusPoints = 15;
      statusDesc = 'Active sales outreach / engagement underway (+15)';
    } else if (status === 'ENRICHED') {
      statusPoints = 12;
      statusDesc = 'Enriched profile with multi-channel contacts (+12)';
    }

    factors.push({
      category: 'engagement',
      label: 'Pipeline Engagement',
      points: statusPoints,
      maxPoints: 15,
      description: statusDesc,
    });

    // 5. Email Validity & Reachability (Max 10 pts)
    let emailPoints = 0;
    let emailDesc = 'Email not validated';
    const emailStatus = (lead.email_status || 'UNKNOWN').toUpperCase();

    if (emailStatus === 'VALID') {
      emailPoints = 10;
      emailDesc = 'Deliverable corporate email verified (+10)';
    } else if (emailStatus === 'RISKY') {
      emailPoints = 5;
      emailDesc = 'Email syntax valid but catch-all or risky (+5)';
    } else if (emailStatus === 'INVALID') {
      emailPoints = 0;
      emailDesc = 'Invalid or non-existent email domain (0)';
    } else if (lead.email) {
      emailPoints = 3;
      emailDesc = 'Email present, awaiting verification (+3)';
    }

    factors.push({
      category: 'email_validity',
      label: 'Email Deliverability',
      points: emailPoints,
      maxPoints: 10,
      description: emailDesc,
    });

    const total = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'D';
    let tierLabel = 'Low Priority';

    if (total >= 90) {
      grade = 'A+';
      tierLabel = 'Tier 1 Priority';
    } else if (total >= 75) {
      grade = 'A';
      tierLabel = 'High Priority';
    } else if (total >= 50) {
      grade = 'B';
      tierLabel = 'Medium Priority';
    } else if (total >= 30) {
      grade = 'C';
      tierLabel = 'Nurture Priority';
    } else {
      grade = 'D';
      tierLabel = 'Low Priority';
    }

    return {
      total,
      grade,
      tierLabel,
      factors,
    };
  }
}

export const leadScorer = new LeadScorer();
