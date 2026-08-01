import { InterventionService } from '../services/intervention.service';
import { InterventionSessionService } from '../services/session.service';
import { CatalogFilterParams, CompleteSessionDTO, StartSessionDTO } from '../types/dto';

export class InterventionEngine {
  private service: InterventionService;
  private sessionService: InterventionSessionService;

  constructor(service?: InterventionService, sessionService?: InterventionSessionService) {
    this.service = service || new InterventionService();
    this.sessionService = sessionService || new InterventionSessionService();
  }

  // Catalog & Discovery API
  async getCatalog(params: CatalogFilterParams = {}) {
    return this.service.getCatalog(params);
  }

  async getCategories() {
    return this.service.getCategories();
  }

  async getIntervention(idOrSlug: string, userId?: string) {
    return this.service.getIntervention(idOrSlug, userId);
  }

  async search(query: string, params: CatalogFilterParams = {}) {
    return this.service.search(query, params);
  }

  async getRecommendations(userId: string, limit = 5) {
    return this.service.getRecommendations(userId, limit);
  }

  async getPostJournalRecommendations(userId: string, isCrisis = false) {
    return this.service.getPostJournalRecommendations(userId, isCrisis);
  }

  async recentlyUsed(userId: string, limit = 5) {
    return this.service.recentlyUsed(userId, limit);
  }

  async getHistory(userId: string, params = {}) {
    return this.service.getUserHistory(userId, params);
  }

  // Favourites API
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

  // Phase 3 Session Engine API
  async startSession(userId: string, dto: StartSessionDTO) {
    return this.sessionService.startSession(userId, dto.intervention_id);
  }

  async resumeSession(userId: string, sessionInput: string | { session_id: string; last_position?: number; elapsed_seconds?: number }) {
    const sessionId = typeof sessionInput === 'string' ? sessionInput : sessionInput.session_id;
    return this.sessionService.resumeSession(userId, sessionId);
  }

  async pauseSession(userId: string, sessionId: string, elapsedSeconds?: number) {
    return this.sessionService.pauseSession(userId, sessionId, elapsedSeconds);
  }

  async nextStep(
    userId: string,
    sessionId: string,
    payload?: { question_id?: string; answer?: string; elapsed_seconds?: number }
  ) {
    return this.sessionService.nextStep(userId, sessionId, payload);
  }

  async previousStep(userId: string, sessionId: string) {
    return this.sessionService.previousStep(userId, sessionId);
  }

  async completeSession(
    userId: string,
    dto: CompleteSessionDTO & { responses?: Array<{ question_id: string; answer: string }> }
  ) {
    return this.sessionService.completeSession(userId, dto.session_id, {
      elapsed_seconds: dto.elapsed_seconds,
      responses: dto.responses,
    });
  }

  async abandonSession(userId: string, sessionId: string) {
    return this.sessionService.abandonSession(userId, sessionId);
  }

  async getSession(userId: string, sessionId: string) {
    return this.sessionService.getSessionState(userId, sessionId);
  }

  async seedDatabase() {
    return this.service.seedDatabase();
  }
}

export const interventionEngine = new InterventionEngine();
