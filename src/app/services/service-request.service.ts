import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TicketSubmitPayload, TicketResponseItem } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceRequestService {
  public domain: string = 'https://mohammadielectronics.com';
  private http = inject(HttpClient);

  raiseTicket(payload: TicketSubmitPayload): Observable<any> {
    return this.http.post<any>(this.domain + '/api/service-requests', payload).pipe(
      catchError(this.handleError)
    );
  }

  getTickets(): Observable<TicketResponseItem[]> {
    return this.http.get<TicketResponseItem[]>(this.domain + '/api/admin/service-requests').pipe(
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
