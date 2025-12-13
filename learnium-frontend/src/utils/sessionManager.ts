import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'learnium_session_id';

/**
 * Session Manager
 * Manages browser session ID that persists across page reloads
 * Session is stored in sessionStorage (cleared when tab/window is closed)
 */
export class SessionManager {
  private static instance: SessionManager;
  private sessionId: string;

  private constructor() {
    // Try to retrieve existing session from sessionStorage
    const existingSession = sessionStorage.getItem(SESSION_KEY);
    
    if (existingSession) {
      this.sessionId = existingSession;
    } else {
      // Create new session ID
      this.sessionId = uuidv4();
      sessionStorage.setItem(SESSION_KEY, this.sessionId);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Create new session (used on login/logout)
   */
  public createNewSession(): string {
    this.sessionId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, this.sessionId);
    return this.sessionId;
  }

  /**
   * Clear session (used on logout)
   */
  public clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    // Create new session immediately for next usage
    this.sessionId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, this.sessionId);
  }

  /**
   * Check if session exists
   */
  public hasSession(): boolean {
    return !!sessionStorage.getItem(SESSION_KEY);
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
