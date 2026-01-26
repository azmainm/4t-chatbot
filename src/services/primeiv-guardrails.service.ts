import { Injectable, Logger } from '@nestjs/common';

/**
 * Prime IV Guardrails Service
 * 
 * Enforces safety rules, medical escalation detection, and hallucination prevention
 * for Prime IV chatbot responses.
 */

@Injectable()
export class PrimeIVGuardrailsService {
  private readonly logger = new Logger(PrimeIVGuardrailsService.name);

  // Medical escalation trigger keywords
  private readonly MEDICAL_TRIGGERS = [
    // Pregnancy/breastfeeding
    'pregnant', 'pregnancy', 'breastfeeding', 'nursing', 'expecting',
    
    // Medical conditions
    'kidney disease', 'heart failure', 'hypertension', 'high blood pressure',
    'cancer', 'chemotherapy', 'chemo', 'immunotherapy', 'autoimmune',
    'pots', 'seizure', 'epilepsy', 'diabetes', 'insulin',
    
    // Medications
    'blood thinner', 'warfarin', 'coumadin', 'medication', 'drug interaction',
    'prescription', 'taking medicine',
    
    // Allergies/reactions
    'allergic', 'allergy', 'reaction', 'anaphylaxis',
    
    // Safety questions
    'is it safe', 'is this safe', 'can i have', 'should i get',
  ];

  // Red-flag emergency keywords
  private readonly EMERGENCY_KEYWORDS = [
    'chest pain', 'can\'t breathe', 'cannot breathe', 'shortness of breath',
    'fainting', 'fainted', 'passed out', 'stroke', 'seizure',
    'severe pain', 'allergic reaction', 'throat closing', 'swelling',
  ];

  // Words that suggest the bot might be inventing information
  private readonly INVENTION_INDICATORS = [
    'i think', 'probably', 'maybe', 'might be', 'could be',
    'i believe', 'it seems', 'i assume', 'i guess', 'likely',
  ];

  /**
   * Check if query requires medical team escalation
   */
  checkMedicalEscalation(query: string): {
    shouldEscalate: boolean;
    isEmergency: boolean;
    matchedTriggers: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const matchedTriggers: string[] = [];
    let isEmergency = false;

    // Check for emergency keywords
    for (const keyword of this.EMERGENCY_KEYWORDS) {
      if (lowerQuery.includes(keyword)) {
        isEmergency = true;
        matchedTriggers.push(keyword);
      }
    }

    // Check for medical escalation triggers
    for (const trigger of this.MEDICAL_TRIGGERS) {
      if (lowerQuery.includes(trigger)) {
        matchedTriggers.push(trigger);
      }
    }

    const shouldEscalate = matchedTriggers.length > 0;

    if (shouldEscalate) {
      this.logger.warn(
        `Medical escalation detected. Emergency: ${isEmergency}, Triggers: ${matchedTriggers.join(', ')}`,
      );
    }

    return { shouldEscalate, isEmergency, matchedTriggers };
  }

  /**
   * Check if response might contain invented information
   */
  checkForHallucination(response: string): {
    hasWarningSignals: boolean;
    signals: string[];
  } {
    const lowerResponse = response.toLowerCase();
    const signals: string[] = [];

    for (const indicator of this.INVENTION_INDICATORS) {
      if (lowerResponse.includes(indicator)) {
        signals.push(indicator);
      }
    }

    if (signals.length > 0) {
      this.logger.warn(`Potential hallucination detected. Signals: ${signals.join(', ')}`);
    }

    return {
      hasWarningSignals: signals.length > 0,
      signals,
    };
  }

  /**
   * Generate medical escalation response
   */
  getMedicalEscalationResponse(isEmergency: boolean): string {
    if (isEmergency) {
      return "That sounds urgent. Please seek immediate medical care (ER/911) right now. Once you're safe, we can help with next steps.";
    }

    return "I want you to be safe — our medical team can give guidance based on your health history. Would you like me to connect you with the clinic team?";
  }

  /**
   * Generate "I don't know" fallback response
   */
  getIDontKnowResponse(): string {
    return "I don't want to guess and give you bad info. Let me check with our medical team and get you a solid answer. Would you like me to have someone reach out to you?";
  }

  /**
   * Check if response seems too confident about medical information
   */
  checkMedicalOverconfidence(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    
    const overconfidencePatterns = [
      'this will cure',
      'this will fix',
      'definitely will',
      'guaranteed to',
      'always works',
      'you should take',
      'you need to',
      'i recommend',
      'this treats',
      'this cures',
    ];

    for (const pattern of overconfidencePatterns) {
      if (lowerResponse.includes(pattern)) {
        this.logger.warn(`Medical overconfidence detected: "${pattern}"`);
        return true;
      }
    }

    return false;
  }

  /**
   * Apply guardrails to query and response
   */
  applyGuardrails(query: string, response: string): {
    shouldBlock: boolean;
    modifiedResponse?: string;
    reason?: string;
  } {
    // Check 1: Medical escalation needed?
    const escalation = this.checkMedicalEscalation(query);
    if (escalation.shouldEscalate) {
      return {
        shouldBlock: true,
        modifiedResponse: this.getMedicalEscalationResponse(escalation.isEmergency),
        reason: escalation.isEmergency ? 'emergency_detected' : 'medical_escalation_required',
      };
    }

    // Check 2: Response contains hallucination signals?
    const hallucination = this.checkForHallucination(response);
    if (hallucination.hasWarningSignals) {
      return {
        shouldBlock: true,
        modifiedResponse: this.getIDontKnowResponse(),
        reason: 'potential_hallucination',
      };
    }

    // Check 3: Response shows medical overconfidence?
    const overconfident = this.checkMedicalOverconfidence(response);
    if (overconfident) {
      return {
        shouldBlock: true,
        modifiedResponse: this.getIDontKnowResponse(),
        reason: 'medical_overconfidence',
      };
    }

    // All checks passed
    return { shouldBlock: false };
  }

  /**
   * Check if response is too generic (might indicate no good context)
   */
  isResponseTooGeneric(response: string, minLength: number = 50): boolean {
    return (
      response.length < minLength ||
      response.includes("I don't have that information") ||
      response.includes("I couldn't find relevant information")
    );
  }
}
