import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductCatalogItem, ProductSaveRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  public domain: string = 'https://mohammadielectronics.com';
  private http = inject(HttpClient);

  getProducts(): Observable<ProductCatalogItem[]> {
    return this.http.get<ProductCatalogItem[]>(this.domain + '/api/products').pipe(
      catchError(this.handleError)
    );
  }

  saveOrUpdateProduct(payload: ProductSaveRequest): Observable<any> {
    return this.http.post<any>(this.domain + '/api/admin/products', payload).pipe(
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
