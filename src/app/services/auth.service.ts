import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserSignUp } from '../models/auth.model';

function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  currentUserToken = signal<string | null>(localStorage.getItem('access_token'));

  currentUserRole = computed(() => {
    const token = this.currentUserToken();
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded?.role || null;
  });

  currentUserUsername = computed(() => {
    const token = this.currentUserToken();
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded?.sub || null; // standard OAuth2 'sub' claim
  });

  currentUserFullName = computed(() => {
    const token = this.currentUserToken();
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded?.full_name || null;
  });

  currentUserPhone = computed(() => {
    const token = this.currentUserToken();
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded?.phone || decoded?.mobile_number || null;
  });

  currentUserEmail = computed(() => {
    const token = this.currentUserToken();
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded?.email || null;
  });

  isAuthenticated = computed(() => !!this.currentUserToken());
  isAdmin = computed(() => this.currentUserRole() === 'admin');

  // Observables for compatibility
  private authStateSubject = new BehaviorSubject<string | null>(localStorage.getItem('access_token'));
  isAuthenticated$ = this.authStateSubject.pipe(tap(() => {}));

  signUp(credentials: UserSignUp): Observable<any> {
    return this.http.post('https://mohammadielectronics.com/api/signup', credentials).pipe(
      catchError(this.handleError)
    );
  }

  login(username: string, password: string): Observable<any> {
    const body = new HttpParams()
      .set('username', username)
      .set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<{ access_token: string, token_type: string }>('https://mohammadielectronics.com/api/login', body.toString(), { headers }).pipe(
      tap(res => {
        if (res && res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          this.currentUserToken.set(res.access_token);
          this.authStateSubject.next(res.access_token);
        }
      }),
      catchError(this.handleError)
    );
  }

  signOut(): void {
    localStorage.removeItem('access_token');
    this.currentUserToken.set(null);
    this.authStateSubject.next(null);
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
