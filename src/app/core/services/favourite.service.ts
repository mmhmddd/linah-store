// core/services/favorites.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { BooksService, Book } from './books.service';
import { AuthService } from './auth.service';

export interface FavoriteItem {
  book: Book;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoriteItems = new BehaviorSubject<FavoriteItem[]>([]);
  favoriteItems$ = this.favoriteItems.asObservable();
  private localFavoritesKey = 'guestFavorites';
  private isInitialized = false;

  constructor(
    private http: HttpClient,
    private booksService: BooksService,
    private authService: AuthService
  ) {
    this.initializeFavorites();
  }

  private initializeFavorites(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('=== ❤️ FAVORITES SERVICE INITIALIZATION ===');
    console.log('🔑 Token exists:', !!localStorage.getItem('token'));
    console.log('👤 User logged in:', this.authService.isLoggedIn());

    if (this.authService.isLoggedIn()) {
      console.log('👤 LOGGED IN - Loading from BACKEND');
      this.loadFavoritesFromBackend();
    } else {
      console.log('👤 GUEST - Loading from LOCAL');
      this.loadFavoritesFromLocal();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  private loadFavoritesFromBackend(): void {
    console.log('🔄 Loading favorites from BACKEND');

    this.http.get<{ favorites: FavoriteItem[] }>(
      `${environment.apiUrl}${API_ENDPOINTS.favorites.get}`,
      { headers: this.getHeaders(), withCredentials: true }
    ).pipe(
      tap(response => console.log('✅ Backend favorites loaded:', response.favorites?.length || 0, 'items')),
      catchError(error => {
        console.error('❌ BACKEND FAVORITES ERROR:', error);

        if (error.status === 401 || error.status === 403) {
          console.log('🔓 Invalid token, switching to guest');
          localStorage.removeItem('token');
          this.authService.logout();
          this.loadFavoritesFromLocal();
          return of({ favorites: [] });
        }

        alert(`خطأ في تحميل المفضلة: ${error.error?.message || 'Unknown error'}`);
        return of({ favorites: [] });
      })
    ).subscribe(response => {
      this.favoriteItems.next(response.favorites || []);
    });
  }

  private loadFavoritesFromLocal(): void {
    const saved = localStorage.getItem(this.localFavoritesKey);
    const favorites: FavoriteItem[] = saved ? JSON.parse(saved) : [];
    console.log('💾 Local favorites loaded:', favorites.length, 'items');
    this.favoriteItems.next(favorites);
  }

  private saveToLocal(favorites: FavoriteItem[]): void {
    localStorage.setItem(this.localFavoritesKey, JSON.stringify(favorites));
  }

  // ➕ ADD TO FAVORITES - ✅ FIXED: Store COMPLETE book data
  addToFavorites(bookId: string): Observable<{ isAdded: boolean }> {
    console.log('➕ Adding to favorites:', { bookId });

    if (this.authService.isLoggedIn()) {
      return this.http.post<{ message: string; isAdded: boolean; favorites: FavoriteItem[] }>(
        `${environment.apiUrl}${API_ENDPOINTS.favorites.add}`,
        { bookId },
        { headers: this.getHeaders(), withCredentials: true }
      ).pipe(
        tap(response => {
          console.log('✅ Backend add success:', response.isAdded);
          this.favoriteItems.next(response.favorites);
        }),
        map(response => ({ isAdded: response.isAdded })),
        catchError(this.handleError)
      );
    } else {
      // ✅ FIXED: Get COMPLETE book from API and store it
      return this.booksService.getBookById(bookId).pipe(
        map(book => {
          if (!book) throw new Error('Book not found');

          let current = [...this.favoriteItems.value];
          const exists = current.some(item => item.book._id === bookId);

          if (!exists) {
            // ✅ FIXED: Store COMPLETE book object
            const favoriteItem: FavoriteItem = {
              book: { ...book }  // Clone COMPLETE book data
            };

            current.push(favoriteItem);
            this.favoriteItems.next(current);
            this.saveToLocal(current);
            console.log('✅ Local add success - Complete book stored:', book.title);
          }

          return { isAdded: !exists };
        }),
        catchError(this.handleError)
      );
    }
  }

  // 🗑️ REMOVE FROM FAVORITES
  removeFromFavorites(bookId: string): Observable<{ isRemoved: boolean }> {
    console.log('🗑️ Removing from favorites:', { bookId });

    if (this.authService.isLoggedIn()) {
      return this.http.delete<{ message: string; isRemoved: boolean; favorites: FavoriteItem[] }>(
        `${environment.apiUrl}${API_ENDPOINTS.favorites.remove(bookId)}`,
        { headers: this.getHeaders(), withCredentials: true }
      ).pipe(
        tap(response => {
          console.log('✅ Backend remove success:', response.isRemoved);
          this.favoriteItems.next(response.favorites);
        }),
        map(response => ({ isRemoved: response.isRemoved })),
        catchError(this.handleError)
      );
    } else {
      return of(null).pipe(
        map(() => {
          let current = [...this.favoriteItems.value];
          const index = current.findIndex(item => item.book._id === bookId);

          if (index === -1) {
            throw new Error('Book not in favorites');
          }

          current.splice(index, 1);
          this.favoriteItems.next(current);
          this.saveToLocal(current);
          console.log('✅ Local remove success');
          return { isRemoved: true };
        }),
        catchError(this.handleError)
      );
    }
  }

  // 🔄 TOGGLE FAVORITE
  toggleFavorite(bookId: string): Observable<{ isAdded: boolean; isRemoved: boolean }> {
    const currentFavorites = this.favoriteItems.value;
    const exists = currentFavorites.some(item => item.book._id === bookId);

    if (exists) {
      return this.removeFromFavorites(bookId).pipe(
        map(result => ({ isAdded: false, isRemoved: result.isRemoved }))
      );
    } else {
      return this.addToFavorites(bookId).pipe(
        map(result => ({ isAdded: result.isAdded, isRemoved: false }))
      );
    }
  }

  // ❓ CHECK IF BOOK IS FAVORITED
  isFavorited(bookId: string): boolean {
    return this.favoriteItems.value.some(item => item.book._id === bookId);
  }

  // 🧹 CLEAR ALL FAVORITES
  clearFavorites(): Observable<void> {
    if (this.authService.isLoggedIn()) {
      return this.http.post<{ message: string; favorites: [] }>(
        `${environment.apiUrl}${API_ENDPOINTS.favorites.clear}`,
        {},
        { headers: this.getHeaders(), withCredentials: true }
      ).pipe(
        tap(() => {
          this.favoriteItems.next([]);
          console.log('✅ Backend clear success');
        }),
        map(() => void 0),
        catchError(this.handleError)
      );
    } else {
      this.favoriteItems.next([]);
      localStorage.removeItem(this.localFavoritesKey);
      console.log('✅ Local clear success');
      return of(void 0);
    }
  }

  // 🔄 MERGE FAVORITES ON LOGIN
  mergeFavoritesOnLogin(): void {
    if (this.authService.isLoggedIn()) {
      const localFavorites = JSON.parse(localStorage.getItem(this.localFavoritesKey) || '[]');
      if (localFavorites.length === 0) {
        this.loadFavoritesFromBackend();
        return;
      }

      console.log('🔄 Merging', localFavorites.length, 'guest favorites to account');

      localFavorites.reduce((obs: Observable<any>, item: FavoriteItem) => {
        return obs.pipe(
          switchMap(() => this.addToFavorites(item.book._id))
        );
      }, of(void 0)).pipe(
        finalize(() => {
          localStorage.removeItem(this.localFavoritesKey);
          this.loadFavoritesFromBackend();
        })
      ).subscribe({
        next: () => console.log('✅ Favorites merged successfully'),
        error: (err: any) => {
          console.error('❌ Merge failed:', err);
          alert('فشل في نقل المفضلة. أعد إضافتها');
        }
      });
    }
  }

  reloadFavorites(): void {
    this.isInitialized = false;
    this.initializeFavorites();
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Favorites Error:', error);
    const message = error.error?.message || `Error: ${error.status}`;
    return throwError(() => new Error(message));
  }
}
