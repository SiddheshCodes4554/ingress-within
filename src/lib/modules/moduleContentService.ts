import { ModuleContent, ModuleWeek, ModuleTouch } from '../../types/moduleContent';
import { MODULE_1_CONTENT } from './content/module1Data';
import { MODULE_2_CONTENT } from './content/module2Data';
import { MODULE_3_CONTENT } from './content/module3Data';

/**
 * Registry of active module content datasets.
 */
const MODULE_CONTENT_REGISTRY: Record<string, ModuleContent> = {
  'M1': MODULE_1_CONTENT,
  'self-worth-self-talk': MODULE_1_CONTENT,
  'M2': MODULE_2_CONTENT,
  'perfectionism-avoidance': MODULE_2_CONTENT,
  'M3': MODULE_3_CONTENT,
  'anxiety-worry': MODULE_3_CONTENT
};

export class ModuleContentService {
  /**
   * Retrieves complete content dataset for a module by ID (e.g. 'M1') or slug (e.g. 'self-worth-self-talk').
   */
  public static getModuleContent(idOrSlug: string): ModuleContent | null {
    if (!idOrSlug) return null;
    const key = idOrSlug.trim().toLowerCase();

    if (MODULE_CONTENT_REGISTRY[idOrSlug]) {
      return MODULE_CONTENT_REGISTRY[idOrSlug];
    }

    for (const content of Object.values(MODULE_CONTENT_REGISTRY)) {
      if (content.moduleId.toLowerCase() === key || content.slug?.toLowerCase() === key) {
        return content;
      }
    }

    return null;
  }

  /**
   * Returns all available module content objects.
   */
  public static getAllModuleContents(): ModuleContent[] {
    return [MODULE_1_CONTENT, MODULE_2_CONTENT, MODULE_3_CONTENT];
  }

  /**
   * Retrieves specific week content for a module.
   */
  public static getModuleWeek(idOrSlug: string, weekNum: number): ModuleWeek | null {
    const content = this.getModuleContent(idOrSlug);
    if (!content) return null;
    return content.weeks.find(w => w.num === weekNum) || null;
  }

  /**
   * Retrieves specific touch content by touch ID (e.g. 'w1t1').
   */
  public static getModuleTouch(idOrSlug: string, touchId: string): ModuleTouch | null {
    const content = this.getModuleContent(idOrSlug);
    if (!content) return null;
    for (const week of content.weeks) {
      const touch = week.touches.find(t => t.id === touchId);
      if (touch) return touch;
    }
    return null;
  }
}
