import { InterventionRepository } from '../repositories/intervention.repository';
import { SessionRepository } from '../repositories/session.repository';
import { FavoriteRepository } from '../repositories/favorite.repository';
import { HistoryRepository } from '../repositories/history.repository';
import { CatalogProvider } from '../catalog/catalog-provider';
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  INDIA_CRISIS_RESOURCES,
} from '../constants/categories';
import {
  CatalogFilterParams,
  CompleteSessionDTO,
  InterventionDetailResponse,
  PaginatedResult,
  PaginationParams,
  ResumeSessionDTO,
  StartSessionDTO,
} from '../types/dto';
import { Intervention, InterventionCategoryMeta, InterventionHistory, InterventionSession } from '../types/intervention';
import { supabase } from '../../db';

export class InterventionService {
  private interventionRepo: InterventionRepository;
  private sessionRepo: SessionRepository;
  private favoriteRepo: FavoriteRepository;
  private historyRepo: HistoryRepository;

  constructor(
    interventionRepo?: InterventionRepository,
    sessionRepo?: SessionRepository,
    favoriteRepo?: FavoriteRepository,
    historyRepo?: HistoryRepository
  ) {
    this.interventionRepo = interventionRepo || new InterventionRepository();
    this.sessionRepo = sessionRepo || new SessionRepository();
    this.favoriteRepo = favoriteRepo || new FavoriteRepository();
    this.historyRepo = historyRepo || new HistoryRepository();
  }

  /**
   * 1. getCatalog(params?)
   * Returns paginated catalog with filters (category, max_duration, difficulty, search).
   */
  async getCatalog(params: CatalogFilterParams = {}): Promise<PaginatedResult<Intervention>> {
    return this.interventionRepo.findCatalog(params);
  }

  /**
   * 2. getCategories()
   * Returns list of category metadata with technique counts and crisis info.
   */
  async getCategories(): Promise<{ categories: InterventionCategoryMeta[]; crisis_resources: typeof INDIA_CRISIS_RESOURCES }> {
    const catalog = await CatalogProvider.getCatalog();
    const activeCatalog = catalog.filter((i) => !i.deleted_at && i.status === 'active');

    const counts: Record<string, number> = {};
    for (const item of activeCatalog) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }

    const categories: InterventionCategoryMeta[] = Object.keys(CATEGORY_LABELS).map((catId) => ({
      id: catId,
      slug: catId,
      label: CATEGORY_LABELS[catId] || catId,
      short_label: CATEGORY_SHORT_LABELS[catId] || catId,
      description: CATEGORY_DESCRIPTIONS[catId] || '',
      icon: CATEGORY_ICONS[catId] || 'help-circle',
      technique_count: counts[catId] || 0,
      is_crisis: catId === 'crisis_safety',
    }));

    return {
      categories,
      crisis_resources: INDIA_CRISIS_RESOURCES,
    };
  }

  /**
   * 3. getIntervention(idOrSlug, userId?)
   * Fetches single intervention detail, optionally attaching user's favorite status & active session.
   */
  async getIntervention(idOrSlug: string, userId?: string): Promise<InterventionDetailResponse | null> {
    const intervention = await this.interventionRepo.findByIdOrSlug(idOrSlug);
    if (!intervention) return null;

    let is_favorite = false;
    let active_session: InterventionSession | null = null;

    if (userId) {
      is_favorite = await this.favoriteRepo.isFavorite(userId, intervention.id);
      active_session = await this.sessionRepo.findActiveSession(userId, intervention.id);
    }

    return {
      intervention,
      is_favorite,
      active_session,
    };
  }

  /**
   * 4. startSession(userId, dto)
   * Starts a new session or returns existing active session, and logs history entry.
   */
  async startSession(userId: string, dto: StartSessionDTO): Promise<{ session: InterventionSession; history: InterventionHistory }> {
    const intervention = await this.interventionRepo.findByIdOrSlug(dto.intervention_id);
    if (!intervention) {
      throw new Error(`Intervention not found: ${dto.intervention_id}`);
    }

    // Check if there is already an active in-progress session
    let session = await this.sessionRepo.findActiveSession(userId, intervention.id);
    if (!session) {
      session = await this.sessionRepo.createSession(userId, intervention.id);
    }

    // Log history open event
    const history = await this.historyRepo.logOpen(userId, intervention.id, session.id);

    // Write audit log
    await this.logAudit(userId, 'start_session', 'intervention_session', session.id, { intervention_id: intervention.id });

    return { session, history };
  }

  /**
   * 5. resumeSession(userId, dto)
   * Updates last position and elapsed time for an active session.
   */
  async resumeSession(userId: string, dto: ResumeSessionDTO): Promise<InterventionSession> {
    const session = await this.sessionRepo.findById(userId, dto.session_id);
    if (!session) {
      throw new Error(`Session not found or unauthorized: ${dto.session_id}`);
    }

    const updated = await this.sessionRepo.updateSession(userId, dto.session_id, {
      last_position: dto.last_position !== undefined ? dto.last_position : session.last_position,
      elapsed_seconds: dto.elapsed_seconds !== undefined ? dto.elapsed_seconds : session.elapsed_seconds,
    });

    if (!updated) {
      throw new Error('Failed to update session');
    }

    await this.logAudit(userId, 'resume_session', 'intervention_session', session.id, {
      last_position: dto.last_position,
      elapsed_seconds: dto.elapsed_seconds,
    });

    return updated;
  }

  /**
   * 6. completeSession(userId, dto)
   * Marks session as completed, updates completion timestamps, and stores final responses.
   */
  async completeSession(userId: string, dto: CompleteSessionDTO): Promise<InterventionSession> {
    const session = await this.sessionRepo.findById(userId, dto.session_id);
    if (!session) {
      throw new Error(`Session not found or unauthorized: ${dto.session_id}`);
    }

    const now = new Date().toISOString();
    const finalElapsed = dto.elapsed_seconds !== undefined ? dto.elapsed_seconds : session.elapsed_seconds || 0;

    const updated = await this.sessionRepo.updateSession(userId, dto.session_id, {
      status: 'completed',
      completed_at: now,
      elapsed_seconds: finalElapsed,
      responses: dto.responses ? { ...(session.responses || {}), ...dto.responses } : session.responses,
    });

    if (!updated) {
      throw new Error('Failed to complete session');
    }

    // Update history record
    await this.historyRepo.logCompletion(userId, session.id, finalElapsed);

    // Audit log
    await this.logAudit(userId, 'complete_session', 'intervention_session', session.id, {
      intervention_id: session.intervention_id,
      elapsed_seconds: finalElapsed,
    });

    return updated;
  }

  /**
   * 7. favorite(userId, interventionId)
   * Adds intervention to user favorites.
   */
  async favorite(userId: string, interventionId: string): Promise<boolean> {
    const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
    if (!intervention) throw new Error(`Intervention not found: ${interventionId}`);

    const res = await this.favoriteRepo.addFavorite(userId, intervention.id);
    await this.logAudit(userId, 'favorite', 'intervention', intervention.id);
    return res;
  }

  /**
   * 8. unfavorite(userId, interventionId)
   * Removes intervention from user favorites.
   */
  async unfavorite(userId: string, interventionId: string): Promise<boolean> {
    const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
    if (!intervention) throw new Error(`Intervention not found: ${interventionId}`);

    const res = await this.favoriteRepo.removeFavorite(userId, intervention.id);
    await this.logAudit(userId, 'unfavorite', 'intervention', intervention.id);
    return res;
  }

  /**
   * Helper to toggle favorite status.
   */
  async toggleFavorite(userId: string, interventionId: string): Promise<{ is_favorite: boolean }> {
    const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
    if (!intervention) throw new Error(`Intervention not found: ${interventionId}`);

    const currentlyFavorite = await this.favoriteRepo.isFavorite(userId, intervention.id);
    if (currentlyFavorite) {
      await this.unfavorite(userId, intervention.id);
      return { is_favorite: false };
    } else {
      await this.favorite(userId, intervention.id);
      return { is_favorite: true };
    }
  }

  /**
   * 9. search(query, params?)
   * Convenience search method across titles, descriptions, categories, and tags.
   */
  async search(query: string, params: CatalogFilterParams = {}): Promise<PaginatedResult<Intervention>> {
    return this.interventionRepo.findCatalog({
      ...params,
      search: query,
    });
  }

  /**
   * 10. recentlyUsed(userId, limit?)
   * Gets list of interventions recently used by the authenticated user.
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
   * Gets user history with pagination.
   */
  async getUserHistory(userId: string, params: PaginationParams = {}): Promise<PaginatedResult<InterventionHistory>> {
    return this.historyRepo.getUserHistory(userId, params);
  }

  /**
   * Private helper for writing audit logs.
   */
  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await supabase.from('intervention_audit_logs').insert([
        {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      // Audit log failures should not block main application flow
      console.warn('[InterventionService] Audit log warning:', e);
    }
  }
}
