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

  // ✅ FIXED: Proper initialization
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser: Observable<User | null> = this.currentUserSubject.asObservable();

  private authReady = new BehaviorSubject<boolean>(false);
  public authReady$ = this.authReady.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('🔐 AUTH SERVICE INITIALIZATION STARTED');

    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuthFromStorage();
    } else {
      // Server-side: mark ready
      this.authReady.next(true);
    }
  }

  private initializeAuthFromStorage(): void {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('currentUser');

      let storedUser: User | null = null;
      if (userData && token) {
        storedUser = JSON.parse(userData);
        console.log('✅ Loaded user from storage:', storedUser?.email || 'unknown');
      } else {
        console.log('❌ No valid auth data found');
      }

      this.currentUserSubject.next(storedUser);

      // ✅ FIXED: Mark ready IMMEDIATELY
      this.authReady.next(true);
      console.log('🔐 AUTH SERVICE READY - User:', !!storedUser);

    } catch (error) {
      console.error('❌ Auth storage error:', error);
      this.authReady.next(true);
    }
  }

  isReady(): Observable<boolean> {
    return this.authReady$;
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
    console.log('📝 Register Request URL:', url);
    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const url = `${this.apiUrl}${API_ENDPOINTS.login}`;
    console.log('🔑 Login Request URL:', url);
    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  forgotPassword(email: ForgotPasswordRequest): Observable<any> {
    const url = `${this.apiUrl}${API_ENDPOINTS.forgotPassword}`;
    console.log('🔒 Forgot Password Request URL:', url);
    return this.http.post(url, email).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(token: string, password: ResetPasswordRequest): Observable<any> {
    const url = `${this.apiUrl}${API_ENDPOINTS.resetPassword}/${token}`;
    console.log('🔓 Reset Password Request URL:', url);
    return this.http.put(url, password).pipe(
      catchError(this.handleError)
    );
  }

  private setSession(authResult: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', authResult.token);
      localStorage.setItem('currentUser', JSON.stringify(authResult.user));
    }
    this.currentUserSubject.next(authResult.user);
    console.log('✅ Session set for user:', authResult.user.email);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const token = this.getToken();
    const user = this.getCurrentUser();

    console.log('🔍 isLoggedIn check:', { token: !!token, user: !!user });
    return !!token && !!user;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === 'admin' : false;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  logout(): void {
    console.log('🚪 Logging out user');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.authReady.next(true);
  }

  checkAuthStatus(): void {
    const isLoggedIn = this.isLoggedIn();
    console.log('🔍 Auth Status Check:', {
      tokenExists: !!this.getToken(),
      userExists: !!this.getCurrentUser(),
      isLoggedIn
    });
  }
}
