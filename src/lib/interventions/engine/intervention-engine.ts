import { InterventionService } from '../services/intervention.service';
import { CatalogFilterParams, CompleteSessionDTO, StartSessionDTO } from '../types/dto';

export class InterventionEngine {
  private service: InterventionService;

  constructor(service?: InterventionService) {
    this.service = service || new InterventionService();
  }

  async getCatalog(params: CatalogFilterParams = {}) {
    return this.service.getCatalog(params);
  }

  async getCategories() {
    return this.service.getCategories();
  }

  async getIntervention(idOrSlug: string, userId?: string) {
    return this.service.getIntervention(idOrSlug, userId);
  }

  async startSession(userId: string, dto: StartSessionDTO) {
    return this.service.startSession(userId, dto);
  }

  async resumeSession(userId: string, dto: { session_id: string; last_position?: number; elapsed_seconds?: number }) {
    return this.service.resumeSession(userId, dto);
  }

  async completeSession(userId: string, dto: CompleteSessionDTO) {
    return this.service.completeSession(userId, dto);
  }

  async favourite(userId: string, interventionId: string) {
    return this.service.favourite(userId, interventionId);
  }

  async favorite(userId: string, interventionId: string) {
    return this.service.favourite(userId, interventionId);
  }

  async unfavourite(userId: string, interventionId: string) {
    return this.service.unfavourite(userId, interventionId);
  }

  async unfavorite(userId: string, interventionId: string) {
    return this.service.unfavourite(userId, interventionId);
  }

  async toggleFavourite(userId: string, interventionId: string) {
    return this.service.toggleFavourite(userId, interventionId);
  }

  async toggleFavorite(userId: string, interventionId: string) {
    return this.service.toggleFavourite(userId, interventionId);
  }

  async search(query: string, params: CatalogFilterParams = {}) {
    return this.service.search(query, params);
  }

  async getRecommendations(userId: string, limit = 5) {
    return this.service.getRecommendations(userId, limit);
  }

  async recentlyUsed(userId: string, limit = 5) {
    return this.service.recentlyUsed(userId, limit);
  }

  async getHistory(userId: string, params = {}) {
    return this.service.getUserHistory(userId, params);
  }

  async seedDatabase() {
    return this.service.seedDatabase();
  }
}

export const interventionEngine = new InterventionEngine();
