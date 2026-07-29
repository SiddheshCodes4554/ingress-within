import { InterventionDefinition } from '../../validators/content.validator';

export class ContentMigrator {
  public static CURRENT_VERSION = 1;

  /**
   * Migrates older intervention JSON definitions to the latest content_version schema.
   */
  static migrate(rawJson: any): InterventionDefinition {
    const version = rawJson.content_version || 1;

    let updated = { ...rawJson };

    // Normalize property aliases
    if (updated.duration === undefined) {
      updated.duration = updated.estimated_duration || updated.duration_minutes || 5;
    }
    if (updated.coverImage === undefined) {
      updated.coverImage = updated.cover_image || null;
    }
    if (!updated.description) {
      updated.description = updated.short_description || updated.long_description || updated.title || '';
    }

    // Ensure step formatting matches latest schema
    if (Array.isArray(updated.steps)) {
      updated.steps = updated.steps.map((step: any, index: number) => {
        const stepNum = index + 1;
        if (typeof step === 'string') {
          return {
            step_id: `step_${updated.id || 'def'}_${stepNum}`,
            step_number: stepNum,
            step_type: 'instruction',
            title: `Step ${stepNum}`,
            content: step,
            estimated_duration: 60,
            allow_previous: true,
            auto_advance: false,
          };
        }
        return {
          step_id: step.step_id || `step_${updated.id || 'def'}_${stepNum}`,
          step_number: step.step_number || stepNum,
          step_type: step.step_type || 'instruction',
          title: step.title || `Step ${stepNum}`,
          content: step.content || '',
          optional_question: step.optional_question,
          optional_media: step.optional_media,
          items: step.items,
          estimated_duration: step.estimated_duration || 60,
          allow_previous: step.allow_previous !== undefined ? step.allow_previous : true,
          auto_advance: step.auto_advance !== undefined ? step.auto_advance : false,
        };
      });
    }

    updated.content_version = Math.max(version, ContentMigrator.CURRENT_VERSION);
    return updated as InterventionDefinition;
  }
}
