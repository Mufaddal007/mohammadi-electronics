import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderPlacementRequest, AdminOrderItem } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = 'https://mohammadielectronics.com/api';

  placeOrder(req: OrderPlacementRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders`, req).pipe(
      catchError(this.handleError)
    );
  }

  getAdminOrders(): Observable<AdminOrderItem[]> {
    return this.http.get<AdminOrderItem[]>(`${this.baseUrl}/admin/orders`).pipe(
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
