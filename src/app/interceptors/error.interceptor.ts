import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorService } from '../services/error.service';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 1. Handle 401 Unauthorized redirect
      if (error.status === 401) {
        authService.signOut();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // 2. Handle other 4xx and 5xx API errors
      if (error.status >= 400) {
        let msg = 'An unexpected system error occurred. Please try again.';
        if (error.error && typeof error.error === 'object') {
          msg = error.error.detail || error.error.message || msg;
        } else if (error.error && typeof error.error === 'string') {
          try {
            const parsed = JSON.parse(error.error);
            msg = parsed.detail || parsed.message || msg;
          } catch {
            msg = error.error;
          }
        }
        
        errorService.show(error.status, msg);
      }

      return throwError(() => error);
    })
  );
};
