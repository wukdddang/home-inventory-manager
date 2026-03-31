export interface ServiceResponse<T = unknown> {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
}

export abstract class BaseService {
  protected accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken ?? '';
  }

  protected async handleApiCall<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : errorMessage;
      return { success: false, message };
    }
  }

  protected authHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.accessToken && {
        Authorization: `Bearer ${this.accessToken}`,
      }),
    };
  }

  protected async parseErrorResponse(
    response: Response,
    fallback: string,
  ): Promise<never> {
    let message = fallback;
    try {
      const body = await response.json();
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
}
