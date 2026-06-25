import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FeedbackSubmitPayload, FeedbackResponseItem } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  public domain: string = 'https://mohammadielectronics.com';
  private http = inject(HttpClient);

  submitFeedback(payload: FeedbackSubmitPayload): Observable<any> {
    return this.http.post<any>(this.domain + '/api/feedback', payload).pipe(
      catchError(this.handleError)
    );
  }

  getFeedbacks(): Observable<FeedbackResponseItem[]> {
    return this.http.get<FeedbackResponseItem[]>(this.domain + '/api/admin/feedback').pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMsg = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMsg = `Client error: ${error.error.message}`;
    } else {
      errorMsg = error.error?.detail || error.error?.message || `Server error: ${error.status}`;
    }
    return throwError(() => new Error(errorMsg));
  }
}
