import { prisma } from '../db.js';
import { getProvider } from '../providers/index.js';
import { getRateLimiterForProvider, withExponentialBackoff } from '../resilience/rateLimiter.js';
import { IngestionJobConfig, LeadQueryParams, PipelineProgressCallback } from '../types.js';
import { deduplicationEngine } from './deduplicator.js';

export class IngestionPipeline {
  /**
   * Starts an ingestion job in the background and returns the IngestionJob ID.
   */
  async startJob(config: IngestionJobConfig, onProgress?: PipelineProgressCallback): Promise<string> {
    const job = await prisma.ingestionJob.create({
      data: {
        provider: config.providerId,
        query_params: JSON.stringify(config.queryParams),
        total_found: 0,
        total_imported: 0,
        status: 'PENDING',
      },
    });

    // Execute in background so the API responds immediately with job details
    this.executeJob(job.id, config, onProgress).catch(async (err) => {
      console.error(`[IngestionPipeline] Job ${job.id} failed:`, err);
      try {
        await prisma.ingestionJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            error_message: err.message || 'Unknown ingestion pipeline error',
          },
        });
      } catch (dbErr) {
        console.error('[IngestionPipeline] Failed to record job failure in DB:', dbErr);
      }
    });

    return job.id;
  }

  /**
   * Executes the pagination, rate-limiting, deduplication, and enrichment loop.
   */
  async executeJob(
    jobId: string,
    config: IngestionJobConfig,
    onProgress?: PipelineProgressCallback
  ): Promise<void> {
    const provider = getProvider(config.providerId);
    const rateLimiter = getRateLimiterForProvider(config.providerId);
    const targetCount = config.targetCount || 10;

    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING' },
    });

    let currentCursor: string | undefined = undefined;
    let currentPage = 1;
    let totalImported = 0;
    let totalFoundFromProvider = 0;
    let hasMore = true;

    try {
      while (totalImported < targetCount && hasMore) {
        const pageSize = Math.min(10, targetCount - totalImported);
        const queryParams: LeadQueryParams = {
          ...config.queryParams,
          limit: pageSize,
          page: currentPage,
          cursor: currentCursor,
        };

        // Resilient fetch via Rate Limiter + Exponential Backoff
        const batch = await rateLimiter.schedule(() =>
          withExponentialBackoff(() => provider.search(queryParams), {
            maxRetries: 3,
            baseDelayMs: 400,
          })
        );

        totalFoundFromProvider = Math.max(totalFoundFromProvider, batch.totalFound || 0);

        if (!batch.leads || batch.leads.length === 0) {
          break;
        }

        for (const rawLead of batch.leads) {
          if (totalImported >= targetCount) break;

          let leadToProcess = rawLead;

          // Optional on-the-fly enrichment
          if (config.autoEnrich) {
            try {
              leadToProcess = await rateLimiter.schedule(() =>
                withExponentialBackoff(() => provider.enrich(rawLead), {
                  maxRetries: 2,
                  baseDelayMs: 300,
                })
              );
            } catch (enrichErr: any) {
              console.warn('[IngestionPipeline] Auto-enrich failed for lead:', enrichErr.message);
            }
          }

          // Deduplicate and upsert
          await deduplicationEngine.upsertLead(leadToProcess, provider.id);
          totalImported++;

          // Update progress in DB every 2 items or when finished
          if (totalImported % 2 === 0 || totalImported === targetCount) {
            await prisma.ingestionJob.update({
              where: { id: jobId },
              data: {
                total_found: totalFoundFromProvider,
                total_imported: totalImported,
              },
            });

            onProgress?.({
              jobId,
              totalFound: totalFoundFromProvider,
              totalImported,
              status: 'RUNNING',
            });
          }
        }

        hasMore = Boolean(batch.hasMore && batch.nextCursor);
        currentCursor = batch.nextCursor;
        currentPage++;
      }

      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          total_found: totalFoundFromProvider,
          total_imported: totalImported,
          status: 'COMPLETED',
        },
      });

      onProgress?.({
        jobId,
        totalFound: totalFoundFromProvider,
        totalImported,
        status: 'COMPLETED',
      });
    } catch (error: any) {
      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error_message: error.message || 'Ingestion encountered an unexpected error.',
        },
      });
      throw error;
    }
  }
}

export const ingestionPipeline = new IngestionPipeline();
