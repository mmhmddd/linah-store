import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BooksService, Book } from '../../core/services/books.service';
import { CartService, CartItem } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favourite.service';
import { environment } from '../../../environments/environment';
import { retry, catchError } from 'rxjs/operators';
import { throwError, Subscription } from 'rxjs';

// Cart Response Interface
interface CartResponse {
  success?: boolean;
  alreadyInCart?: boolean;
  message?: string;
  item?: any;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-children-books-and-stories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './children-books.component.html',
  styleUrls: ['./children-books.component.scss']
})
export class ChildrenBooksComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  categories: string[] = [];
  imageModalUrls: string[] | null = null;
  currentImageIndex: number = 0;
  stockFilter: string = '';
  categoryFilter: string = '';
  sortBy: string = 'name';
  searchTerm: string = '';
  fallbackImage: string = '/assets/images/fallback.jpg';
  activeSlides: { [key: string]: number } = {};
  toasts: Toast[] = [];
  isSidebarOpen: boolean = false;
  private toastIdCounter = 0;
  private loadingImages = new Map<string, boolean>();
  private subscriptions = new Subscription();
  private cartItems: string[] = []; // Track cart item IDs

  constructor(
    private booksService: BooksService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isSidebarOpen = false;
    console.log('Initial sidebar state:', this.isSidebarOpen);
    this.loadBooks();
    this.loadCategories();
    this.initializeFavorites();
    this.loadCartItems();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadCartItems(): void {
    this.subscriptions.add(
      this.cartService.cartItems$.subscribe({
        next: (items: CartItem[]) => {
          this.cartItems = items.map((item: CartItem) => item.book._id);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error loading cart items:', err);
          this.showToast('فشل في تحميل عناصر السلة', 'error');
        }
      })
    );
  }

  private initializeFavorites(): void {
    this.subscriptions.add(
      this.favoritesService.favoriteItems$.subscribe(() => {
        this.cdr.detectChanges();
      })
    );
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const toast: Toast = {
      id: this.toastIdCounter++,
      message,
      type
    };

    this.toasts.push(toast);
    this.cdr.detectChanges();

    setTimeout(() => {
      this.removeToast(toast.id);
    }, 3000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.cdr.detectChanges();
  }

  loadBooks(): void {
    this.booksService.getAllBooks().pipe(
      retry(2),
      catchError(err => {
        this.showToast('فشل في تحميل الكتب والقصص. يرجى المحاولة مرة أخرى', 'error');
        console.error('Error loading books and stories:', err);
        return throwError(() => err);
      })
    ).subscribe({
      next: (books) => {
        console.log('Books and stories received from API:', books);
        books.forEach(book => {
          book.imgs = Array.isArray(book.imgs) ? book.imgs : [];
          book.stockStatus = book.quantity > 0 ? 'inStock' : 'outOfStock';
          if (book._id) {
            this.activeSlides[book._id] = 0;
          }
        });
        this.books = books;
        this.filteredBooks = [...this.books];
        this.sortBooks();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load books and stories:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories(): void {
    this.booksService.getAllBooks().subscribe({
      next: (books) => {
        this.categories = [...new Set(books.map(book => book.category))];
        if (!this.categories.includes('قصص')) {
          this.categories.push('قصص');
        }
        console.log('Available categories:', this.categories);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  isBookFavorited(book: Book): boolean {
    return this.favoritesService.isFavorited(book._id);
  }

  toggleFavorite(book: Book): void {
    if (!book._id) {
      this.showToast('خطأ: لا يمكن إضافة الكتاب أو القصة بدون معرف', 'error');
      return;
    }

    this.favoritesService.toggleFavorite(book._id).subscribe({
      next: (result) => {
        if (result.isAdded) {
          this.showToast(`تمت إضافة "${book.name}" إلى المفضلة ♥`, 'success');
        } else if (result.isRemoved) {
          this.showToast(`تمت إزالة "${book.name}" من المفضلة`, 'info');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
        this.showToast(`خطأ في ${this.isBookFavorited(book) ? 'إزالة' : 'إضافة'} الكتاب أو القصة`, 'error');
      }
    });
  }

  isInCart(book: Book): boolean {
    return this.cartItems.includes(book._id);
  }

  addToCart(book: Book): void {
    if (!book._id) {
      this.showToast('خطأ: لا يمكن إضافة الكتاب أو القصة بدون معرف', 'error');
      return;
    }

    if (book.stockStatus === 'outOfStock') {
      this.showToast('هذا الكتاب أو القصة غير متوفر حالياً', 'error');
      return;
    }

    this.cartService.addToCart(book._id, 1).subscribe({
      next: (response: CartResponse | any) => {
        console.log('Cart response FULL:', JSON.stringify(response, null, 2));

        if (response) {
          if (response.alreadyInCart === true) {
            this.showToast(`"${book.name}" موجود بالفعل في السلة 🛒`, 'info');
            return;
          }

          if (response.success === true) {
            this.cartItems.push(book._id); // Update local cart items
            this.showToast(`تمت إضافة "${book.name}" إلى السلة 🛒`, 'success');
            this.cdr.detectChanges();
            return;
          }

          if (response.message && (
            response.message.includes('already') ||
            response.message.includes('موجود') ||
            response.message.includes('duplicate')
          )) {
            this.showToast(`"${book.name}" موجود بالفعل في السلة 🛒`, 'info');
            return;
          }
        }

        this.cartItems.push(book._id); // Update local cart items
        this.showToast(`تمت إضافة "${book.name}" إلى السلة 🛒`, 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Cart ERROR FULL:', JSON.stringify(err, null, 2));

        if (err) {
          if (err.error && err.error.message) {
            const msg = err.error.message.toLowerCase();
            if (
              msg.includes('already') ||
              msg.includes('موجود') ||
              msg.includes('duplicate') ||
              msg.includes('exists')
            ) {
              this.showToast(`"${book.name}" موجود بالفعل في السلة 🛒`, 'info');
              return;
            }
          }

          if (err.status === 409) {
            this.showToast(`"${book.name}" موجود بالفعل في السلة 🛒`, 'info');
            return;
          }

          if (err.status >= 400 && err.status < 500 && err.error) {
            const fullError = JSON.stringify(err.error).toLowerCase();
            if (
              fullError.includes('already') ||
              fullError.includes('موجود') ||
              fullError.includes('duplicate')
            ) {
              this.showToast(`"${book.name}" موجود بالفعل في السلة 🛒`, 'info');
              return;
            }
          }
        }

        this.showToast('الكتاب أو القصة مضاف بالفعل راجع السلة الخاصة بك', 'error');
      }
    });
  }

  removeFromCart(book: Book): void {
    if (!book._id) {
      this.showToast('خطأ: لا يمكن إزالة الكتاب أو القصة بدون معرف', 'error');
      return;
    }

    this.cartService.removeFromCart(book._id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(id => id !== book._id);
        this.showToast(`تمت إزالة "${book.name}" من السلة 🛒`, 'info');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error removing from cart:', err);
        this.showToast('فشل في إزالة الكتاب أو القصة من السلة', 'error');
      }
    });
  }

  getImageUrl(img: string): string {
    if (!img) {
      console.warn('No image provided, using fallback');
      return this.fallbackImage;
    }

    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }

    const baseUrl = environment.apiUrl.replace('/api', '');

    if (img.startsWith('/uploads')) {
      return `${baseUrl}${img}`;
    }

    if (!img.startsWith('/')) {
      return `${baseUrl}/uploads/${img}`;
    }

    return `${baseUrl}${img}`;
  }

  handleImageError(bookId: string): void {
    console.warn(`Image error for book/story ID: ${bookId}`);
    const book = this.books.find(b => b._id === bookId);
    if (book && book.imgs[0]) {
      const url = this.getImageUrl(book.imgs[0]);
      this.loadingImages.set(url, false);
    }
    this.cdr.detectChanges();
  }

  calculateBookFinalPrice(book: Book): number {
    return book.price - (book.price * (book.offer || 0) / 100);
  }

  hasDiscount(book: Book): boolean {
    return book.offer > 0;
  }

  openImageModal(img: string): void {
    const book = this.books.find(b => b.imgs.includes(img));
    this.imageModalUrls = book ? book.imgs : [img];
    this.currentImageIndex = book ? book.imgs.indexOf(img) : 0;
    console.log('Opening image modal with URLs:', this.imageModalUrls);
    this.cdr.detectChanges();
  }

  closeImageModal(): void {
    this.imageModalUrls = null;
    this.currentImageIndex = 0;
    this.cdr.detectChanges();
  }

  prevImage(): void {
    if (this.imageModalUrls && this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.cdr.detectChanges();
    }
  }

  nextImage(): void {
    if (this.imageModalUrls && this.currentImageIndex < this.imageModalUrls.length - 1) {
      this.currentImageIndex++;
      this.cdr.detectChanges();
    }
  }

  setImageIndex(index: number): void {
    if (this.imageModalUrls && index >= 0 && index < this.imageModalUrls.length) {
      this.currentImageIndex = index;
      this.cdr.detectChanges();
    }
  }

  getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'خيال': '🌊',
      'مغامرات': '🚀',
      'علوم': '🔬',
      'قصص': '📖',
      'تعليمي': '🎓',
      'فنون': '🎨',
      'أطفال': '👶',
      'تاريخ': '📜',
      'رياضيات': '🔢',
      'لغة': '📝',
      'تراثي': '👵'
    };
    return emojiMap[category] || '📚';
  }

  filterBooks(): void {
    console.log('Applying filters - Category:', this.categoryFilter, 'Stock:', this.stockFilter, 'Search:', this.searchTerm);

    this.filteredBooks = this.books.filter(book => {
      const categoryMatch = this.categoryFilter ? book.category === this.categoryFilter : true;
      const stockMatch = this.stockFilter ? book.stockStatus === this.stockFilter : true;
      const searchMatch = this.searchTerm
        ? book.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          book.title?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return categoryMatch && stockMatch && searchMatch;
    });

    console.log('Filtered books and stories count:', this.filteredBooks.length);
    this.sortBooks();
    this.cdr.detectChanges();
  }

  sortBooks(): void {
    console.log('Sorting books and stories by:', this.sortBy);

    this.filteredBooks.sort((a, b) => {
      switch (this.sortBy) {
        case 'price':
          return a.price - b.price;
        case 'quantity':
          return b.quantity - a.quantity;
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'ar');
      }
    });

    this.cdr.detectChanges();
  }

  trackByBookId(index: number, book: Book): string {
    return book._id || index.toString();
  }

  trackByToastId(index: number, toast: Toast): number {
    return toast.id;
  }
}
