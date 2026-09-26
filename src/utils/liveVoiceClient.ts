import { NativeModules } from 'react-native';
import { BASE_URL } from '../api/client';

/**
 * CuraTera Live Voice Client
 * ============================
 * Connects to the WebSocket-based Live Voice Server.
 * 
 * Protocol:
 * Client → Server:
 *   { type: "start", thread_id: "..." }      Start session
 *   { type: "transcript", text: "..." }       User speech transcript
 *   { type: "interrupt" }                      Mid-sentence interruption
 *   { type: "end" }                            End session
 * 
 * Server → Client:
 *   { type: "connected" }                      Session ready
 *   { type: "state", state: "listening|thinking|speaking" }
 *   { type: "ai_response", text: "..." }       AI text response
 *   { type: "audio_done" }                     TTS playback complete
 *   { type: "interruption" }                   Interruption acknowledged
 *   { type: "ended" }                          Session terminated
 *   <binary>                                   TTS audio bytes (MP3)
 */

// Extract the host from BASE_URL (e.g., "http://192.168.1.5:5000" → "192.168.1.5")
const getWsUrl = () => {
  try {
    const url = new URL(BASE_URL);
    return `ws://${url.hostname}:8765`;
  } catch {
    return 'ws://localhost:8765';
  }
};

export type LiveState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended';

export interface LiveVoiceCallbacks {
  onStateChange: (state: LiveState) => void;
  onTranscript: (text: string) => void;
  onAiResponse: (text: string) => void;
  onAudioData: (audioBytes: ArrayBuffer) => void;
  onAudioDone: () => void;
  onError: (error: string) => void;
  onDisconnect: () => void;
}

export class LiveVoiceClient {
  private ws: WebSocket | null = null;
  private callbacks: LiveVoiceCallbacks;
  private threadId: string;
  private reconnectAttempts = 0;
  private maxReconnects = 3;

  constructor(threadId: string, callbacks: LiveVoiceCallbacks) {
    this.threadId = threadId;
    this.callbacks = callbacks;
  }

  connect(): void {
    const wsUrl = getWsUrl();
    console.log(`[LiveVoice] Connecting to ${wsUrl}`);
    this.callbacks.onStateChange('connecting');

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[LiveVoice] Connected');
        this.reconnectAttempts = 0;
        // Start session
        this.send({ type: 'start', thread_id: this.threadId });
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Binary data = TTS audio
          this.callbacks.onAudioData(event.data);
          return;
        }

        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.warn('[LiveVoice] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[LiveVoice] WebSocket error:', error);
        this.callbacks.onError('Connection error');
      };

      this.ws.onclose = () => {
        console.log('[LiveVoice] Disconnected');
        this.callbacks.onStateChange('ended');
        this.callbacks.onDisconnect();
      };
    } catch (e) {
      console.error('[LiveVoice] Connection failed:', e);
      this.callbacks.onError('Failed to connect to voice server');
    }
  }

  private handleServerMessage(msg: any): void {
    switch (msg.type) {
      case 'connected':
        console.log('[LiveVoice] Session started');
        break;

      case 'state':
        this.callbacks.onStateChange(msg.state as LiveState);
        break;

      case 'ai_response':
        this.callbacks.onAiResponse(msg.text || '');
        break;

      case 'audio_done':
        this.callbacks.onAudioDone();
        break;

      case 'interruption':
        console.log('[LiveVoice] Interruption acknowledged');
        break;

      case 'ended':
        this.callbacks.onStateChange('ended');
        break;

      default:
        console.log('[LiveVoice] Unknown message type:', msg.type);
    }
  }

  sendTranscript(text: string): void {
    this.callbacks.onTranscript(text);
    this.send({ type: 'transcript', text });
  }

  interrupt(): void {
    this.send({ type: 'interrupt' });
  }

  disconnect(): void {
    this.send({ type: 'end' });
    setTimeout(() => {
      this.ws?.close();
      this.ws = null;
    }, 100);
  }

  private send(data: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
