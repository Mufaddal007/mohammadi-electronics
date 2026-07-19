import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductCatalogItem, ProductSaveRequest, setGlobalCategories } from '../models/product.model';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  public domain: string = 'https://mohammadielectronics.com';
  private http = inject(HttpClient);

  constructor() {
    this.getCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          setGlobalCategories(cats);
        }
      },
      error: (err) => console.error('Failed to initialize global categories list', err)
    });
  }

  getProducts(): Observable<ProductCatalogItem[]> {
    return this.http.get<ProductCatalogItem[]>(this.domain + '/api/products').pipe(
      catchError(this.handleError)
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.domain + '/api/categories').pipe(
      catchError(this.handleError)
    );
  }

  saveOrUpdateProduct(payload: ProductSaveRequest): Observable<any> {
    return this.http.post<any>(this.domain + '/api/admin/products', payload).pipe(
      catchError(this.handleError)
    );
  }

  deleteProduct(productId: number): Observable<any> {
    return this.http.delete<any>(`${this.domain}/api/admin/products/${productId}`).pipe(
      catchError(this.handleError)
    );
  }

  uploadProductImage(file: File): Observable<{ status: string; message: string; relative_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ status: string; message: string; relative_url: string }>(
      `${this.domain}/api/admin/products/upload-image`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  generateInvoice(payload: any): Observable<Blob> {
    return this.http.post(`${this.domain}/api/invoices/generate`, payload, {
      responseType: 'blob'
    }).pipe(
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
