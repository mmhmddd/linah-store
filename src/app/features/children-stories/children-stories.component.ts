import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BooksService, Book } from '../../core/services/books.service';
import { CartService, CartItem } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favourite.service';
import { environment } from '../../../environments/environment';
import { retry, catchError, Subscription } from 'rxjs';
import { throwError } from 'rxjs';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-children-stories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './children-stories.component.html',
  styleUrl: './children-stories.component.scss'
})
export class ChildrenStoriesComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  imageModalUrls: string[] | null = null;
  currentImageIndex = 0;
  stockFilter = '';
  sortBy = 'name';
  searchTerm = '';
  fallbackImage = '/assets/images/fallback.jpg';
  toasts: Toast[] = [];
  isSidebarOpen = false;
  private toastIdCounter = 0;
  private subscriptions = new Subscription();
  private cartItems: string[] = [];

  // الفئة المطلوب عرضها: "قصص الطفال"
  private readonly TARGET_CATEGORY = 'قصص الاطفال';

  constructor(
    private booksService: BooksService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadChildrenStories();
    this.loadCartItems();
    this.initializeFavorites();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadChildrenStories(): void {
    this.booksService.getAllBooks().pipe(
      retry(2),
      catchError(err => {
        this.showToast('فشل في تحميل قصص الأطفال', 'error');
        return throwError(() => err);
      })
    ).subscribe(books => {
      const childrenStories = books
        .filter(b => {
          // تصحيح أي قيمة قديمة + مطابقة الفئة المطلوبة
          const cat = b.category?.trim();
          return cat === this.TARGET_CATEGORY ||
                 cat === 'قصص أطفال' ||
                 cat === 'قصص اطفال';
        })
        .map(book => {
          // توحيد الفئة إلى "قصص الطفال" للعرض
          book.category = this.TARGET_CATEGORY;
          book.imgs = Array.isArray(book.imgs) ? book.imgs : [];
          book.stockStatus = book.quantity > 0 ? 'inStock' : 'outOfStock';
          return book;
        });

      this.books = childrenStories;
      this.filteredBooks = [...childrenStories];
      this.sortBooks();
      this.cdr.detectChanges();
    });
  }

  private loadCartItems(): void {
    this.subscriptions.add(
      this.cartService.cartItems$.subscribe({
        next: (items: CartItem[]) => {
          this.cartItems = items.map(item => item.book._id);
          this.cdr.detectChanges();
        },
        error: () => this.showToast('فشل في تحميل السلة', 'error')
      })
    );
  }

  private initializeFavorites(): void {
    this.subscriptions.add(
      this.favoritesService.favoriteItems$.subscribe(() => this.cdr.detectChanges())
    );
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const toast: Toast = { id: this.toastIdCounter++, message, type };
    this.toasts.push(toast);
    this.cdr.detectChanges();
    setTimeout(() => this.removeToast(toast.id), 3000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.cdr.detectChanges();
  }

  isBookFavorited(book: Book): boolean {
    return this.favoritesService.isFavorited(book._id);
  }

  toggleFavorite(book: Book): void {
    if (!book._id) return this.showToast('خطأ في المعرف', 'error');
    this.favoritesService.toggleFavorite(book._id).subscribe({
      next: (res) => {
        const msg = res.isAdded
          ? `تمت إضافة "${book.name}" إلى المفضلة`
          : `تمت إزالة "${book.name}" من المفضلة`;
        this.showToast(msg, res.isAdded ? 'success' : 'info');
        this.cdr.detectChanges();
      },
      error: () => this.showToast('فشل في تحديث المفضلة', 'error')
    });
  }

  isInCart(book: Book): boolean {
    return this.cartItems.includes(book._id);
  }

  addToCart(book: Book): void {
    if (!book._id) return this.showToast('خطأ في المعرف', 'error');
    if (book.stockStatus === 'outOfStock') return this.showToast('غير متوفر', 'error');

    this.cartService.addToCart(book._id, 1).subscribe({
      next: (res: any) => {
        if (res?.alreadyInCart) {
          this.showToast(`"${book.name}" موجود بالفعل في السلة`, 'info');
        } else {
          this.cartItems.push(book._id);
          this.showToast(`تمت إضافة "${book.name}" إلى السلة`, 'success');
          this.cdr.detectChanges();
        }
      },
      error: () => this.showToast('فشل في الإضافة للسلة', 'error')
    });
  }

  removeFromCart(book: Book): void {
    if (!book._id) return;
    this.cartService.removeFromCart(book._id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(id => id !== book._id);
        this.showToast(`تمت إزالة "${book.name}" من السلة`, 'info');
        this.cdr.detectChanges();
      },
      error: () => this.showToast('فشل في الإزالة', 'error')
    });
  }

  getImageUrl(img: string): string {
    if (!img) return this.fallbackImage;
    if (img.startsWith('http')) return img;
    const base = environment.apiUrl.replace('/api', '');
    return img.startsWith('/') ? `${base}${img}` : `${base}/uploads/${img}`;
  }

  handleImageError(bookId: string): void {
    // يمكن تحسينه لاحقًا لتغيير الصورة
    this.cdr.detectChanges();
  }

  calculateBookFinalPrice(book: Book): number {
    return book.price - (book.price * (book.offer || 0) / 100);
  }

  hasDiscount(book: Book): boolean {
    return (book.offer || 0) > 0;
  }

  openImageModal(img: string): void {
    const book = this.books.find(b => b.imgs.includes(img));
    this.imageModalUrls = book ? book.imgs : [img];
    this.currentImageIndex = book ? book.imgs.indexOf(img) : 0;
    this.cdr.detectChanges();
  }

  closeImageModal(): void {
    this.imageModalUrls = null;
    this.currentImageIndex = 0;
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

  getCategoryEmoji(category: string): string {
    return 'كتاب'; // جميعها قصص أطفال
  }

  filterBooks(): void {
    this.filteredBooks = this.books.filter(book => {
      const search = !this.searchTerm ||
        book.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        book.title?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const stock = !this.stockFilter || book.stockStatus === this.stockFilter;
      return search && stock;
    });
    this.sortBooks();
    this.cdr.detectChanges();
  }

  sortBooks(): void {
    this.filteredBooks.sort((a, b) => {
      switch (this.sortBy) {
        case 'price': return a.price - b.price;
        case 'quantity': return b.quantity - a.quantity;
        case 'name':
        default: return a.name.localeCompare(b.name, 'ar');
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
