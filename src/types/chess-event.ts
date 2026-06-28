// src/types/chess-event.ts

export type ComputeAllocationTag = 'compute:local:macair' | 'compute:remote:aistudio';
export type TelemetryAllocationTag = 'telemetry:sync:firebase' | 'telemetry:ledger:local';
export type ApplicationAllocationTag = 'app:travguild:ranking' | 'app:portfolio:gen';

export type InstructionTag = 
  | ComputeAllocationTag 
  | TelemetryAllocationTag 
  | ApplicationAllocationTag;

export type VerificationState = 'PENDING' | 'YES' | 'NO';

export interface EventVerificationBlock {
  clientVerify: VerificationState;
  clientHardwareSignature: string;       // Proves origin node (e.g., MacAir)
  serverAttestationSignature?: string;   // Appended by the server holding the authoritative key
  errorReason?: string;                  // Populated if clientVerify evaluates to 'NO'
}

export interface AetherCanonicalEvent<T = any> {
  eventId: string;
  timestamp: string; // ISO-8601 UTC
  sourceNode: string; // e.g., 'NODE_MACAIR_01', 'XBOX_ONE_STREAM'
  eventType: 'CHESS_MATCH_INIT' | 'CHESS_MOVE_SUBMITTED' | 'CHESS_MATCH_CONCLUDED' | string;
  instructionTags: InstructionTag[];
  verification: EventVerificationBlock;  // Secure handshake block
  payload: T;
  signature?: string; // Sovereignty verification hash
}

export interface ChessMovePayload {
  matchId: string;
  moveSequence: number;
  notation: string; // e.g., "e4", "Nf3"
  playerType: 'human' | 'agent';
  playerIdentifier: string;
  boardStateSnapshotDelta: string; // FEN string or compressed bitboard delta
}
