import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DemandSubmitPayload, DemandResponseItem } from '../models/demand.model';

@Injectable({
  providedIn: 'root'
})
export class SourcingService {
  public domain: string = 'https://mohammadielectronics.com';
  private http = inject(HttpClient);

  submitDemand(payload: DemandSubmitPayload): Observable<any> {
    return this.http.post<any>(this.domain + '/api/product-demands', payload).pipe(
      catchError(this.handleError)
    );
  }

  getDemands(): Observable<DemandResponseItem[]> {
    return this.http.get<DemandResponseItem[]>(this.domain + '/api/admin/product-demands').pipe(
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
