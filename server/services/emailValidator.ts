import dns from 'dns';
import axios from 'axios';

export type EmailValidationStatus = 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';

export interface EmailValidationResult {
  email: string;
  status: EmailValidationStatus;
  reason: string;
  providerUsed: 'abstract_api' | 'zerobounce_api' | 'builtin_verifier';
  isDisposable: boolean;
  isFree: boolean;
  hasMxRecords: boolean;
  deliverabilityScore: number; // 0 to 100
}

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'mytemp.email',
  'crazymailing.com',
  'temp-mail.org',
  'fakemailgenerator.com',
]);

const FREE_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'zoho.com',
  'protonmail.com',
]);

export class EmailValidationService {
  /**
   * Validates an email address via Abstract API, ZeroBounce API, or built-in DNS/MX verification.
   */
  async validateEmail(email?: string | null): Promise<EmailValidationResult> {
    if (!email || !email.trim()) {
      return {
        email: email || '',
        status: 'UNKNOWN',
        reason: 'No email address provided',
        providerUsed: 'builtin_verifier',
        isDisposable: false,
        isFree: false,
        hasMxRecords: false,
        deliverabilityScore: 0,
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Basic Syntax Check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        reason: 'Invalid email syntax format',
        providerUsed: 'builtin_verifier',
        isDisposable: false,
        isFree: false,
        hasMxRecords: false,
        deliverabilityScore: 0,
      };
    }

    const [, domain] = cleanEmail.split('@');

    // 2. Check Disposable Domains
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        reason: 'Known disposable temporary email domain',
        providerUsed: 'builtin_verifier',
        isDisposable: true,
        isFree: false,
        hasMxRecords: false,
        deliverabilityScore: 10,
      };
    }

    const isFree = FREE_DOMAINS.has(domain);

    // 3. Abstract API Check (if key configured)
    if (process.env.ABSTRACT_API_KEY) {
      try {
        const response = await axios.get('https://emailvalidation.abstractapi.com/v1/', {
          params: {
            api_key: process.env.ABSTRACT_API_KEY,
            email: cleanEmail,
          },
          timeout: 4000,
        });

        const data = response.data;
        const deliverability = data.deliverability; // "DELIVERABLE", "UNDELIVERABLE", "RISKY", "UNKNOWN"
        const qualityScore = Math.round((data.quality_score || 0.8) * 100);

        let status: EmailValidationStatus = 'VALID';
        if (deliverability === 'UNDELIVERABLE') status = 'INVALID';
        else if (deliverability === 'RISKY') status = 'RISKY';
        else if (deliverability === 'UNKNOWN') status = 'UNKNOWN';

        return {
          email: cleanEmail,
          status,
          reason: `Abstract API: ${deliverability} (Score: ${qualityScore}%)`,
          providerUsed: 'abstract_api',
          isDisposable: Boolean(data.is_disposable_email?.value),
          isFree: Boolean(data.is_free_email?.value),
          hasMxRecords: Boolean(data.is_mx_found?.value),
          deliverabilityScore: qualityScore,
        };
      } catch (err: any) {
        console.warn('[EmailValidationService] Abstract API request failed, falling back to DNS:', err.message);
      }
    }

    // 4. ZeroBounce API Check (if key configured)
    if (process.env.ZEROBOUNCE_API_KEY) {
      try {
        const response = await axios.get('https://api.zerobounce.net/v2/validate', {
          params: {
            api_key: process.env.ZEROBOUNCE_API_KEY,
            email: cleanEmail,
          },
          timeout: 4000,
        });

        const zbStatus = response.data.status?.toLowerCase();
        let status: EmailValidationStatus = 'VALID';
        if (zbStatus === 'invalid') status = 'INVALID';
        else if (zbStatus === 'spamtrap' || zbStatus === 'abuse' || zbStatus === 'do_not_mail') status = 'RISKY';
        else if (zbStatus === 'unknown') status = 'UNKNOWN';

        return {
          email: cleanEmail,
          status,
          reason: `ZeroBounce: ${response.data.sub_status || response.data.status}`,
          providerUsed: 'zerobounce_api',
          isDisposable: response.data.disposable || false,
          isFree: response.data.free_email || false,
          hasMxRecords: Boolean(response.data.mx_found),
          deliverabilityScore: status === 'VALID' ? 95 : status === 'RISKY' ? 50 : 15,
        };
      } catch (err: any) {
        console.warn('[EmailValidationService] ZeroBounce API failed, falling back to DNS:', err.message);
      }
    }

    // 5. Built-in Real DNS MX Record Lookup & Validation
    try {
      const mxRecords = await dns.promises.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        // MX record exists and is active
        return {
          email: cleanEmail,
          status: 'VALID',
          reason: `Verified DNS MX server (${mxRecords[0].exchange}, priority ${mxRecords[0].priority})`,
          providerUsed: 'builtin_verifier',
          isDisposable: false,
          isFree,
          hasMxRecords: true,
          deliverabilityScore: isFree ? 85 : 98,
        };
      } else {
        return {
          email: cleanEmail,
          status: 'INVALID',
          reason: `Domain ${domain} has no mail exchange (MX) records`,
          providerUsed: 'builtin_verifier',
          isDisposable: false,
          isFree,
          hasMxRecords: false,
          deliverabilityScore: 10,
        };
      }
    } catch (dnsErr: any) {
      if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA' || dnsErr.code === 'SERVFAIL') {
        return {
          email: cleanEmail,
          status: 'INVALID',
          reason: `Domain ${domain} has no DNS mail records (${dnsErr.code})`,
          providerUsed: 'builtin_verifier',
          isDisposable: false,
          isFree,
          hasMxRecords: false,
          deliverabilityScore: 0,
        };
      }

      return {
        email: cleanEmail,
        status: 'RISKY',
        reason: `DNS check inconclusive (${dnsErr.code || dnsErr.message})`,
        providerUsed: 'builtin_verifier',
        isDisposable: false,
        isFree,
        hasMxRecords: false,
        deliverabilityScore: 50,
      };
    }
  }
}

export const emailValidationService = new EmailValidationService();
