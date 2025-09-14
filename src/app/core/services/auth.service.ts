import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('Environment API URL:', environment.apiUrl);
    console.log('API_ENDPOINTS:', API_ENDPOINTS);
    console.log('API_ENDPOINTS.register:', API_ENDPOINTS.register);

    // Initialize with null user by default
    let storedUser: User | null = null;

    // Only attempt to access localStorage in the browser
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('currentUser');
      storedUser = userData ? JSON.parse(userData) : null;
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = error.error.message || `Server error: ${error.status} - ${error.message}`;
    }
    console.error('AuthService Error:', errorMessage, 'URL:', error.url);
    return throwError(() => new Error(errorMessage));
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    const url = `${this.apiUrl}${API_ENDPOINTS.register}`;
    console.log('Register Request URL:', url);
    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const url = `${this.apiUrl}${API_ENDPOINTS.login}`;
    console.log('Login Request URL:', url);
    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  forgotPassword(email: ForgotPasswordRequest): Observable<any> {
    const url = `${this.apiUrl}${API_ENDPOINTS.forgotPassword}`;
    console.log('Forgot Password Request URL:', url);
    return this.http.post(url, email).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(token: string, password: ResetPasswordRequest): Observable<any> {
    const url = `${this.apiUrl}${API_ENDPOINTS.resetPassword}/${token}`;
    console.log('Reset Password Request URL:', url);
    return this.http.put(url, password).pipe(
      catchError(this.handleError)
    );
  }

  private setSession(authResult: AuthResponse): void {
    // Only access localStorage in the browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', authResult.token);
      localStorage.setItem('currentUser', JSON.stringify(authResult.user));
    }
    this.currentUserSubject.next(authResult.user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === 'admin' : false;
  }

  getToken(): string | null {
    // Only access localStorage in the browser
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  logout(): void {
    // Only access localStorage in the browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }
}
