import { InterventionRepository } from '../repositories/intervention.repository';
import { SessionRepository } from '../repositories/session.repository';
import { FavoriteRepository } from '../repositories/favorite.repository';
import { HistoryRepository } from '../repositories/history.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { ResponseRepository } from '../repositories/response.repository';
import { RecommendationService } from './recommendation.service';
import { InterventionSeeder } from '../catalog/seeder';
import { CATEGORY_LABELS, INDIA_CRISIS_RESOURCES } from '../constants/categories';
import {
  CatalogFilterParams,
  CompleteSessionDTO,
  InterventionDetailResponse,
  PaginatedResult,
  PaginationParams,
  RecommendationResponse,
  StartSessionDTO,
} from '../types/dto';
import { Intervention, InterventionCategory, InterventionHistory, InterventionResponse, InterventionSession } from '../types/intervention';

export class InterventionService {
  private interventionRepo: InterventionRepository;
  private sessionRepo: SessionRepository;
  private favoriteRepo: FavoriteRepository;
  private historyRepo: HistoryRepository;
  private categoryRepo: CategoryRepository;
  private responseRepo: ResponseRepository;
  private recommendationService: RecommendationService;

  constructor(
    interventionRepo?: InterventionRepository,
    sessionRepo?: SessionRepository,
    favoriteRepo?: FavoriteRepository,
    historyRepo?: HistoryRepository,
    categoryRepo?: CategoryRepository,
    responseRepo?: ResponseRepository,
    recommendationService?: RecommendationService
  ) {
    this.interventionRepo = interventionRepo || new InterventionRepository();
    this.sessionRepo = sessionRepo || new SessionRepository();
    this.favoriteRepo = favoriteRepo || new FavoriteRepository();
    this.historyRepo = historyRepo || new HistoryRepository();
    this.categoryRepo = categoryRepo || new CategoryRepository();
    this.responseRepo = responseRepo || new ResponseRepository();
    this.recommendationService = recommendationService || new RecommendationService(this.interventionRepo);
  }

  /**
   * 1. getCatalog(params?)
   */
  async getCatalog(params: CatalogFilterParams = {}): Promise<PaginatedResult<Intervention>> {
    return this.interventionRepo.findCatalog(params);
  }

  /**
   * 2. getCategories()
   * Loads categories from database with technique counts.
   */
  async getCategories(): Promise<{ categories: InterventionCategory[]; crisis_resources: typeof INDIA_CRISIS_RESOURCES }> {
    const categories = await this.categoryRepo.findAll();
    const catalog = await this.interventionRepo.findCatalog({ limit: 100 });

    const counts: Record<string, number> = {};
    catalog.data.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    const enriched = categories.map((cat) => ({
      ...cat,
      name: cat.name || CATEGORY_LABELS[cat.id] || cat.id,
      label: cat.name || CATEGORY_LABELS[cat.id] || cat.id,
      technique_count: counts[cat.id] || 0,
    }));

    return {
      categories: enriched,
      crisis_resources: INDIA_CRISIS_RESOURCES,
    };
  }

  /**
   * 3. getIntervention(idOrSlug, userId?)
   */
  async getIntervention(idOrSlug: string, userId?: string): Promise<InterventionDetailResponse | null> {
    const intervention = await this.interventionRepo.findByIdOrSlug(idOrSlug);
    if (!intervention) return null;

    let is_favourite = false;
    let active_session: InterventionSession | null = null;
    let previous_responses: InterventionResponse[] | undefined = undefined;

    if (userId) {
      is_favourite = await this.favoriteRepo.isFavorite(userId, intervention.id);
      active_session = await this.sessionRepo.findActiveSession(userId, intervention.id);

      if (active_session) {
        previous_responses = await this.responseRepo.findBySessionId(active_session.id);
      }
    }

    return {
      intervention,
      is_favourite,
      active_session,
      previous_responses,
    };
  }

  /**
   * 4. startSession(userId, dto)
   */
  async startSession(userId: string, dto: StartSessionDTO): Promise<{ session: InterventionSession; history: InterventionHistory }> {
    const intervention = await this.interventionRepo.findByIdOrSlug(dto.intervention_id);
    if (!intervention) throw new Error(`Intervention not found: ${dto.intervention_id}`);

    let session = await this.sessionRepo.findActiveSession(userId, intervention.id);
    if (!session) {
      session = await this.sessionRepo.createSession(userId, intervention.id);
    }

    const history = await this.historyRepo.logOpen(userId, intervention.id, session.id);
    return { session, history };
  }

  /**
   * resumeSession(userId, dto)
   */
  async resumeSession(
    userId: string,
    dto: { session_id: string; last_position?: number; elapsed_seconds?: number }
  ): Promise<InterventionSession & { last_position?: number }> {
    const session = await this.sessionRepo.findById(userId, dto.session_id);
    if (!session) throw new Error(`Session not found or unauthorized: ${dto.session_id}`);

    const updated = await this.sessionRepo.updateSession(userId, dto.session_id, {
      last_step: dto.last_position !== undefined ? dto.last_position : session.last_step,
      elapsed_seconds: dto.elapsed_seconds !== undefined ? dto.elapsed_seconds : session.elapsed_seconds,
    });

    if (!updated) throw new Error('Failed to update session');

    return {
      ...updated,
      last_position: updated.last_step,
    };
  }

  /**
   * 5. completeSession(userId, dto)
   * Completes session, updates history, and stores reflection answers in intervention_responses table.
   * STRICT GUARANTEE: Responses are STORED ONLY. They are NEVER sent to AI or analyzed.
   */
  async completeSession(userId: string, dto: CompleteSessionDTO): Promise<InterventionSession> {
    const session = await this.sessionRepo.findById(userId, dto.session_id);
    if (!session) throw new Error(`Session not found or unauthorized: ${dto.session_id}`);

    const now = new Date().toISOString();
    const elapsed = dto.elapsed_seconds !== undefined ? dto.elapsed_seconds : session.elapsed_seconds || 0;

    const updated = await this.sessionRepo.updateSession(userId, dto.session_id, {
      status: 'completed',
      completed_at: now,
      elapsed_seconds: elapsed,
    });

    if (!updated) throw new Error('Failed to complete session');

    // Store responses (STORED ONLY - ZERO AI)
    if (dto.responses && dto.responses.length > 0) {
      await this.responseRepo.storeResponses(session.id, dto.responses);
    }

    // Update history
    await this.historyRepo.logCompletion(userId, session.id, elapsed);

    return updated;
  }

  /**
   * 6. favourite / unfavourite / toggle
   */
  async favourite(userId: string, interventionId: string): Promise<boolean> {
    const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
    if (!intervention) throw new Error(`Intervention not found: ${interventionId}`);
    return this.favoriteRepo.addFavorite(userId, intervention.id);
  }

  async unfavourite(userId: string, interventionId: string): Promise<boolean> {
    const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
    if (!intervention) throw new Error(`Intervention not found: ${interventionId}`);
    return this.favoriteRepo.removeFavorite(userId, intervention.id);
  }

  async toggleFavourite(userId: string, interventionId: string): Promise<{ is_favourite: boolean }> {
    const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
    if (!intervention) throw new Error(`Intervention not found: ${interventionId}`);

    const isFav = await this.favoriteRepo.isFavorite(userId, intervention.id);
    if (isFav) {
      await this.unfavourite(userId, intervention.id);
      return { is_favourite: false };
    } else {
      await this.favourite(userId, intervention.id);
      return { is_favourite: true };
    }
  }

  /**
   * 7. search(query, params?)
   */
  async search(query: string, params: CatalogFilterParams = {}): Promise<PaginatedResult<Intervention>> {
    return this.interventionRepo.findCatalog({
      ...params,
      search: query,
    });
  }

  /**
   * 8. getRecommendations(userId, limit?)
   * Deterministic rule-based recommendation engine (Zero AI).
   */
  async getRecommendations(userId: string, limit = 5): Promise<RecommendationResponse> {
    return this.recommendationService.getRecommendations(userId, limit);
  }

  async getPostJournalRecommendations(userId: string, isCrisis = false) {
    return this.recommendationService.getPostJournalRecommendations(userId, isCrisis);
  }

  /**
   * 9. recentlyUsed(userId, limit?)
   */
  async recentlyUsed(userId: string, limit = 5): Promise<Intervention[]> {
    const recentIds = await this.historyRepo.getRecentlyUsed(userId, limit);
    const list: Intervention[] = [];
    for (const id of recentIds) {
      const item = await this.interventionRepo.findByIdOrSlug(id);
      if (item) list.push(item);
    }
    return list;
  }

  /**
   * 10. getUserHistory(userId, params?)
   */
  async getUserHistory(userId: string, params: PaginationParams = {}): Promise<PaginatedResult<InterventionHistory>> {
    return this.historyRepo.getUserHistory(userId, params);
  }

  /**
   * Idempotent Seeder Invocation
   */
  async seedDatabase() {
    return InterventionSeeder.seedAll();
  }
}
