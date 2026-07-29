import { InterventionService } from '../services/intervention.service';
import { CatalogFilterParams, CompleteSessionDTO, ResumeSessionDTO, StartSessionDTO } from '../types/dto';
import { Intervention, InterventionHistory, InterventionSession } from '../types/intervention';

export class InterventionEngine {
  private service: InterventionService;

  constructor(service?: InterventionService) {
    this.service = service || new InterventionService();
  }

  /**
   * Retrieves catalog for display in User App, Therapist Portal, or Advisor Portal.
   */
  async getCatalog(params: CatalogFilterParams = {}) {
    return this.service.getCatalog(params);
  }

  /**
   * Retrieves category list and crisis helplines.
   */
  async getCategories() {
    return this.service.getCategories();
  }

  /**
   * Single technique lookup.
   */
  async getIntervention(idOrSlug: string, userId?: string) {
    return this.service.getIntervention(idOrSlug, userId);
  }

  /**
   * Starts a session.
   */
  async startSession(userId: string, dto: StartSessionDTO) {
    return this.service.startSession(userId, dto);
  }

  /**
   * Resumes or updates a session step/position.
   */
  async resumeSession(userId: string, dto: ResumeSessionDTO) {
    return this.service.resumeSession(userId, dto);
  }

  /**
   * Completes a session.
   */
  async completeSession(userId: string, dto: CompleteSessionDTO) {
    return this.service.completeSession(userId, dto);
  }

  /**
   * Favorites an intervention.
   */
  async favorite(userId: string, interventionId: string) {
    return this.service.favorite(userId, interventionId);
  }

  /**
   * Unfavorites an intervention.
   */
  async unfavorite(userId: string, interventionId: string) {
    return this.service.unfavorite(userId, interventionId);
  }

  /**
   * Toggles favorite status.
   */
  async toggleFavorite(userId: string, interventionId: string) {
    return this.service.toggleFavorite(userId, interventionId);
  }

  /**
   * Searches interventions.
   */
  async search(query: string, params: CatalogFilterParams = {}) {
    return this.service.search(query, params);
  }

  /**
   * Retrieves recently used interventions for a user.
   */
  async recentlyUsed(userId: string, limit = 5) {
    return this.service.recentlyUsed(userId, limit);
  }

  /**
   * Retrieves intervention history for a user.
   */
  async getHistory(userId: string, params = {}) {
    return this.service.getUserHistory(userId, params);
  }
}

export const interventionEngine = new InterventionEngine();
