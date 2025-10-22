import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, EMPTY } from 'rxjs';
import { catchError, map, tap, switchMap, finalize, take } from 'rxjs/operators'; // ✅ FIXED: Added missing imports
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { BooksService, Book } from './books.service';
import { AuthService } from './auth.service';

export interface CartItem {
  book: {
    _id: string;
    name: string;
    title: string;
    price: number;
    imgs: string[];
    category: string;
    description: string;
    offer: number;
    stockStatus: 'inStock' | 'outOfStock';
    quantity: number;
  };
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();
  private localCartKey = 'guestCart';
  private isInitialized = false;

  constructor(
    private http: HttpClient,
    private booksService: BooksService,
    private authService: AuthService
  ) {
    this.initializeCart();
  }

  private initializeCart(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('=== 🛒 CART SERVICE INITIALIZATION ===');
    console.log('🔑 Token exists:', !!localStorage.getItem('token'));
    console.log('👤 User logged in:', this.authService.isLoggedIn());
    console.log('👤 Current user:', this.authService.getCurrentUser()?.email);

    if (this.authService.isLoggedIn()) {
      console.log('👤 LOGGED IN - Loading from BACKEND');
      this.loadCartFromBackend();
    } else {
      console.log('👤 GUEST - Loading from LOCAL');
      this.loadCartFromLocal();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  private loadCartFromBackend(): void {
    console.log('🔄 Loading cart from BACKEND');

    this.http.get<{ cart: CartItem[] }>(`${environment.apiUrl}${API_ENDPOINTS.cart.get}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      tap(response => console.log('✅ Backend cart loaded:', response.cart?.length || 0, 'items')),
      catchError(error => {
        console.error('❌ BACKEND CART ERROR:', error);

        if (error.status === 401 || error.status === 403) {
          console.log('🔓 Invalid token, switching to guest');
          localStorage.removeItem('token');
          this.authService.logout();
          this.loadCartFromLocal();
          return of({ cart: [] });
        }

        alert(`خطأ في تحميل السلة: ${error.error?.message || 'Unknown error'}`);
        return of({ cart: [] });
      })
    ).subscribe(response => {
      this.cartItems.next(response.cart || []);
    });
  }

  private loadCartFromLocal(): void {
    const saved = localStorage.getItem(this.localCartKey);
    const cart: CartItem[] = saved ? JSON.parse(saved) : [];
    console.log('💾 Local cart loaded:', cart.length, 'items');
    this.cartItems.next(cart);
  }

  private saveToLocal(cart: CartItem[]): void {
    localStorage.setItem(this.localCartKey, JSON.stringify(cart));
  }

  addToCart(bookId: string, quantity: number = 1): Observable<void> {
    console.log('➕ Adding to cart:', { bookId, quantity });

    if (this.authService.isLoggedIn()) {
      return this.http.post<{ message: string; cart: CartItem[] }>(
        `${environment.apiUrl}${API_ENDPOINTS.cart.add}`,
        { bookId, quantity },
        { headers: this.getHeaders(), withCredentials: true }
      ).pipe(
        tap(response => {
          console.log('✅ Backend add success');
          this.cartItems.next(response.cart);
        }),
        map(() => void 0),
        catchError(this.handleError)
      );
    } else {
      return this.booksService.getBookById(bookId).pipe(
        map(book => {
          if (!book) throw new Error('Book not found');

          let current = [...this.cartItems.value];
          const index = current.findIndex(item => item.book._id === bookId);
          const existingQty = index > -1 ? current[index].quantity : 0;
          const newQty = existingQty + quantity;

          if (book.quantity < newQty) {
            throw new Error('Insufficient stock');
          }

          if (index > -1) {
            current[index].quantity = newQty;
          } else {
            current.push({
              book: {
                _id: book._id!,
                name: book.name,
                title: book.title || '',
                price: book.price,
                imgs: book.imgs || [],
                category: book.category,
                description: book.description || '',
                offer: book.offer || 0,
                stockStatus: book.quantity > 0 ? 'inStock' : 'outOfStock',
                quantity: book.quantity
              },
              quantity: newQty
            });
          }

          this.cartItems.next(current);
          this.saveToLocal(current);
          console.log('✅ Local add success');
          return void 0;
        }),
        catchError(this.handleError)
      );
    }
  }

  updateQuantity(bookId: string, quantity: number): Observable<void> {
    if (this.authService.isLoggedIn()) {
      return this.http.put<{ message: string; cart: CartItem[] }>(
        `${environment.apiUrl}${API_ENDPOINTS.cart.update}`,
        { bookId, quantity },
        { headers: this.getHeaders(), withCredentials: true }
      ).pipe(
        tap(response => this.cartItems.next(response.cart)),
        map(() => void 0),
        catchError(this.handleError)
      );
    } else {
      return of(null).pipe(
        map(() => {
          let current = [...this.cartItems.value];
          const index = current.findIndex(item => item.book._id === bookId);

          if (index === -1) throw new Error('Book not in cart');
          if (current[index].book.quantity < quantity) {
            throw new Error('Insufficient stock');
          }

          current[index].quantity = quantity;
          this.cartItems.next(current);
          this.saveToLocal(current);
          return void 0;
        }),
        catchError(this.handleError)
      );
    }
  }

  removeFromCart(bookId: string): Observable<void> {
    if (this.authService.isLoggedIn()) {
      return this.http.delete<{ message: string; cart: CartItem[] }>(
        `${environment.apiUrl}${API_ENDPOINTS.cart.remove(bookId)}`,
        { headers: this.getHeaders(), withCredentials: true }
      ).pipe(
        tap(response => this.cartItems.next(response.cart)),
        map(() => void 0),
        catchError(this.handleError)
      );
    } else {
      return of(null).pipe(
        map(() => {
          let current = [...this.cartItems.value];
          const index = current.findIndex(item => item.book._id === bookId);

          if (index === -1) throw new Error('Book not in cart');

          current.splice(index, 1);
          this.cartItems.next(current);
          this.saveToLocal(current);
          return void 0;
        }),
        catchError(this.handleError)
      );
    }
  }

  // ✅ FIXED: Proper merge with switchMap and finalize
  mergeCartOnLogin(): void {
    if (this.authService.isLoggedIn()) {
      const localCart = JSON.parse(localStorage.getItem(this.localCartKey) || '[]');
      if (localCart.length === 0) {
        this.loadCartFromBackend();
        return;
      }

      console.log('🔄 Merging', localCart.length, 'guest items to account');

      localCart.reduce((obs: Observable<void>, item: CartItem) => {
        return obs.pipe(
          switchMap(() => this.addToCart(item.book._id, item.quantity))
        );
      }, of(void 0)).pipe(
        finalize(() => {
          localStorage.removeItem(this.localCartKey);
          this.loadCartFromBackend();
        })
      ).subscribe({
        next: () => console.log('✅ Cart merged successfully'),
        error: (err: any) => {
          console.error('❌ Merge failed:', err);
          alert('فشل في نقل السلة. أعد إضافة العناصر');
        }
      });
    }
  }

  clearCart(): Observable<void> {
    if (this.authService.isLoggedIn()) {
      return this.http.post<{ message: string; cart: [] }>(
        `${environment.apiUrl}${API_ENDPOINTS.cart.clear}`,
        {},
        { headers: this.getHeaders(), withCredentials: true }
      ).pipe(
        tap(() => this.cartItems.next([])),
        map(() => void 0),
        catchError(this.handleError)
      );
    } else {
      this.cartItems.next([]);
      localStorage.removeItem(this.localCartKey);
      return of(void 0);
    }
  }

  getSubtotal(): number {
    return this.cartItems.value.reduce((total, item) => {
      const discountedPrice = item.book.price * (1 - item.book.offer / 100);
      return total + (discountedPrice * item.quantity);
    }, 0);
  }

  getTotalPrice(discount: number = 0): number {
    return this.getSubtotal() - discount;
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Cart Error:', error);
    const message = error.error?.message || `Error: ${error.status}`;
    return throwError(() => new Error(message));
  }

  reloadCart(): void {
    this.isInitialized = false;
    this.initializeCart();
  }
}
