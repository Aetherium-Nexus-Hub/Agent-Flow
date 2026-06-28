// src/core/receptor-hub.ts

import { AetherCanonicalEvent, InstructionTag } from '../types/chess-event';

type ReceptorCallback = (event: AetherCanonicalEvent) => Promise<void>;

export class ReceptorHub {
  private registry: Map<InstructionTag, ReceptorCallback[]> = new Map();

  constructor() {
    this.initializeDefaultReceptors();
  }

  /**
   * Registers a dedicated listener/receptor for a specific instruction tag.
   */
  public registerReceptor(tag: InstructionTag, callback: ReceptorCallback): void {
    if (!this.registry.has(tag)) {
      this.registry.set(tag, []);
    }
    this.registry.get(tag)!.push(callback);
  }

  /**
   * Evaluates an incoming event and triggers the mapped allocations concurrently.
   */
  public async ingest(event: AetherCanonicalEvent): Promise<void> {
    console.log(`[ReceptorHub] Ingesting Event: ${event.eventId} [${event.eventType}]`);
    
    const verification = event.verification;
    console.log(`[ReceptorHub] Event Verification Status: ${verification.clientVerify}`);

    if (verification.clientVerify === 'NO') {
      console.warn(`[ReceptorHub] Event Ingestion REJECTED for event ${event.eventId}. Reason: ${verification.errorReason || "Failed verification"}`);
      return;
    }

    const allocationPromises: Promise<void>[] = [];

    for (const tag of event.instructionTags) {
      const receptors = this.registry.get(tag);
      if (receptors && receptors.length > 0) {
        receptors.forEach(receptor => {
          allocationPromises.push(receptor(event));
        });
      } else {
        console.warn(`[ReceptorHub] Ghost Tag Warning: No active receptor registered for '${tag}'`);
      }
    }

    // Process all telemetry, application, and compute allocations in parallel
    await Promise.all(allocationPromises);
  }

  /**
   * Binds system-native tasks to the standard baseline receptors.
   */
  private initializeDefaultReceptors(): void {
    // ---- COMPUTE RECEPTORS ----
    this.registerReceptor('compute:local:macair', async (event) => {
      const isPending = event.verification.clientVerify === 'PENDING';
      if (isPending) {
        console.log(` -> [Allocation: Compute] Event ${event.eventId} is PENDING. Buffering local model evaluation request...`);
      } else {
        console.log(` -> [Allocation: Compute] HARDENED: Routing execution to local MacAir model orchestration core...`);
      }
    });

    this.registerReceptor('compute:remote:aistudio', async (event) => {
      const isPending = event.verification.clientVerify === 'PENDING';
      if (isPending) {
        console.log(` -> [Allocation: Compute] Event ${event.eventId} is PENDING. Queueing remote AI Studio evaluation...`);
      } else {
        console.log(` -> [Allocation: Compute] HARDENED: Pushing payload over the AI Studio remote bridge token stream...`);
      }
    });

    // ---- TELEMETRY RECEPTORS ----
    this.registerReceptor('telemetry:sync:firebase', async (event) => {
      const isPending = event.verification.clientVerify === 'PENDING';
      if (isPending) {
        console.log(` -> [Allocation: Telemetry] Event ${event.eventId} is PENDING. Simulating sync buffering for offline ledger...`);
      } else {
        console.log(` -> [Allocation: Telemetry] HARDENED: Broadcasting event block to live cloud Firebase synchronized ledger.`);
      }
    });

    this.registerReceptor('telemetry:ledger:local', async (event) => {
      const isPending = event.verification.clientVerify === 'PENDING';
      if (isPending) {
        console.log(` -> [Allocation: Telemetry] Event ${event.eventId} is PENDING. Writing temp record to local filesystem cache.`);
      } else {
        console.log(` -> [Allocation: Telemetry] HARDENED: Stashing permanent move record inside local ledger storage.`);
      }
    });

    // ---- APPLICATION RECEPTORS ----
    this.registerReceptor('app:travguild:ranking', async (event) => {
      const isPending = event.verification.clientVerify === 'PENDING';
      if (isPending) {
        console.log(` -> [Allocation: Application] Event ${event.eventId} is PENDING. Staging matchmaking metrics...`);
      } else {
        console.log(` -> [Allocation: Application] HARDENED: Updating TravGuild matchmaking database metrics and profile stats.`);
      }
    });
  }
}
