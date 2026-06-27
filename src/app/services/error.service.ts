import { Injectable, signal } from '@angular/core';

export interface ApiError {
  status: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  currentError = signal<ApiError | null>(null);

  show(status: number, message: string): void {
    this.currentError.set({ status, message });
  }

  clear(): void {
    this.currentError.set(null);
  }
}
