// children-books.component.ts
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BooksService, Book } from '../../core/services/books.service';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';
import { retry, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../../core/services/favourite.service';  // ✅ NEW: Import FavoritesService

@Component({
  selector: 'app-children-books',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './children-books.component.html',
  styleUrls: ['./children-books.component.scss']
})
export class ChildrenBooksComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  categories: string[] = [];
  errorMessage: string | null = null;
  imageModalUrls: string[] | null = null;
  currentImageIndex: number = 0;
  stockFilter: string = '';
  categoryFilter: string = '';
  sortBy: string = 'name';
  searchTerm: string = '';
  fallbackImage: string = '/assets/images/fallback.jpg';
  activeSlides: { [key: string]: number } = {};
  private loadingImages = new Map<string, boolean>();

  // ✅ NEW: Track favorites state
  private subscriptions = new Subscription();

  constructor(
    private booksService: BooksService,
    private cartService: CartService,
    private favoritesService: FavoritesService,  // ✅ NEW: Inject FavoritesService
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBooks();
    this.loadCategories();
    this.initializeFavorites();  // ✅ NEW: Initialize favorites
  }

  // ✅ NEW: Initialize favorites tracking
  private initializeFavorites(): void {
    this.subscriptions.add(
      this.favoritesService.favoriteItems$.subscribe(() => {
        this.cdr.detectChanges();  // Trigger change detection when favorites change
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();  // ✅ NEW: Cleanup
  }

  loadBooks() {
    this.booksService.getAllBooks().pipe(
      retry(2),
      catchError(err => {
        this.errorMessage = 'فشل في تحميل الكتب. يرجى المحاولة مرة أخرى: ' + (err.error?.message || err.message || 'غير معروف');
        this.cdr.detectChanges();
        return throwError(() => err);
      })
    ).subscribe({
      next: (books) => {
        console.log('Books received from API:', books);
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
        this.errorMessage = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.booksService.getAllBooks().subscribe(books => {
      this.categories = [...new Set(books.map(book => book.category))];
      console.log('Available categories:', this.categories);
    });
  }

  // ✅ FIXED: Check if book is favorited
  isBookFavorited(book: Book): boolean {
    return this.favoritesService.isFavorited(book._id);
  }

  // ✅ FIXED: Toggle favorite (add/remove)
  toggleFavorite(book: Book): void {
    if (!book._id) {
      alert('خطأ: لا يمكن إضافة الكتاب بدون معرف');
      return;
    }

    this.favoritesService.toggleFavorite(book._id).subscribe({
      next: (result) => {
        if (result.isAdded) {
          console.log('Added to favorites:', book.name);
          alert(`تمت إضافة "${book.name}" إلى المفضلة`);
        } else if (result.isRemoved) {
          console.log('Removed from favorites:', book.name);
          alert(`تمت إزالة "${book.name}" من المفضلة`);
        }
        this.cdr.detectChanges();  // Update UI
      },
      error: (err) => {
        console.error('Error toggling favorite:', err);
        alert(`خطأ في ${this.isBookFavorited(book) ? 'إزالة' : 'إضافة'} الكتاب من المفضلة: ${err.message}`);
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

  handleImageError(bookId: string) {
    console.warn(`Image error for book ID: ${bookId}`);
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

  addToCart(book: Book): void {
    if (!book._id) {
      alert('خطأ: لا يمكن إضافة الكتاب بدون معرف');
      return;
    }
    this.cartService.addToCart(book._id, 1).subscribe({
      next: () => {
        console.log('Added to cart:', book.name);
        alert(`تمت إضافة "${book.name}" إلى السلة`);
      },
      error: err => {
        console.error('Error adding to cart:', err);
        alert(`خطأ في إضافة الكتاب إلى السلة: ${err.message}`);
      }
    });
  }

  // ✅ REMOVED: Old addToFavorites method (replaced with toggleFavorite)

  openImageModal(img: string) {
    const book = this.books.find(b => b.imgs.includes(img));
    this.imageModalUrls = book ? book.imgs : [img];
    this.currentImageIndex = book ? book.imgs.indexOf(img) : 0;
    console.log('Opening image modal with URLs:', this.imageModalUrls);
    this.cdr.detectChanges();
  }

  prevImage() {
    if (this.imageModalUrls && this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.cdr.detectChanges();
    }
  }

  nextImage() {
    if (this.imageModalUrls && this.currentImageIndex < this.imageModalUrls.length - 1) {
      this.currentImageIndex++;
      this.cdr.detectChanges();
    }
  }

  nextSlide(bookId: string, imgsLength: number): void {
    if (this.activeSlides[bookId] !== undefined) {
      this.activeSlides[bookId] = (this.activeSlides[bookId] + 1) % imgsLength;
      this.cdr.detectChanges();
    }
  }

  prevSlide(bookId: string, imgsLength: number): void {
    if (this.activeSlides[bookId] !== undefined) {
      this.activeSlides[bookId] = this.activeSlides[bookId] === 0
        ? imgsLength - 1
        : this.activeSlides[bookId] - 1;
      this.cdr.detectChanges();
    }
  }

  isActiveSlide(bookId: string, index: number): boolean {
    return this.activeSlides[bookId] === index;
  }

  getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'خيال': '🌊',
      'مغامرات': '🚀',
      'علوم': '🔬',
      'قصص': '📖',
      'تعليمي': '🎓',
      'فنون': '🎨',
      'أطفال': '👶'
    };
    return emojiMap[category] || '📚';
  }

  filterBooks() {
    console.log('Applying filters - Category:', this.categoryFilter, 'Stock:', this.stockFilter, 'Search:', this.searchTerm);
    this.filteredBooks = this.books.filter(book => {
      const categoryMatch = this.categoryFilter ? book.category === this.categoryFilter : true;
      const stockMatch = this.stockFilter ? book.stockStatus === this.stockFilter : true;
      const searchMatch = this.searchTerm ? book.name.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;
      console.log(`Book: ${book.name}, Category Match: ${categoryMatch}, Stock Match: ${stockMatch}, Search Match: ${searchMatch}`);
      return categoryMatch && stockMatch && searchMatch;
    });
    console.log('Filtered books:', this.filteredBooks);
    this.sortBooks();
    this.cdr.detectChanges();
  }

  sortBooks() {
    console.log('Sorting books by:', this.sortBy);
    this.filteredBooks.sort((a, b) => {
      if (this.sortBy === 'price') return a.price - b.price;
      if (this.sortBy === 'quantity') return a.quantity - b.quantity;
      return a.name.localeCompare(b.name, 'ar');
    });
    this.cdr.detectChanges();
  }
}
