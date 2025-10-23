import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import { BooksService, Book } from '../../core/services/books.service';
import { CartService } from '../../core/services/cart.service';
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

// Toast Interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  contactForm: FormGroup;
  latestBooks: Book[] = [];
  private heroSlideInterval: any;
  private bookSlideshowIntervals: any[] = [];
  private observer: IntersectionObserver | null = null;
  private swiper: Swiper | null = null;
  private subscriptions = new Subscription();
  toasts: Toast[] = [];
  private toastIdCounter = 0;
  fallbackImage: string = '/assets/images/fallback.jpg';
  activeSlides: { [key: string]: number } = {};

  constructor(
    private fb: FormBuilder,
    private booksService: BooksService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.startHeroSlider();
    this.loadLatestBooks();
    this.setupIntersectionObserver();
    this.initializeFavorites();
  }

  ngOnDestroy(): void {
    if (this.heroSlideInterval) {
      clearInterval(this.heroSlideInterval);
    }
    this.bookSlideshowIntervals.forEach(interval => clearInterval(interval));
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
    this.subscriptions.unsubscribe();
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

  loadLatestBooks(): void {
    this.booksService.getAllBooks().pipe(
      retry(2),
      catchError(err => {
        this.showToast('فشل في تحميل أحدث الكتب. يرجى المحاولة مرة أخرى', 'error');
        console.error('Error loading latest books:', err);
        return throwError(() => err);
      })
    ).subscribe({
      next: (books: Book[]) => {
        // Filter out books with undefined createdAt and sort by createdAt descending
        this.latestBooks = books
          .filter(book => book.createdAt !== undefined)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 4) // Changed to 4 books
          .map(book => ({
            ...book,
            imgs: Array.isArray(book.imgs) ? book.imgs : [],
            stockStatus: book.quantity > 0 ? 'inStock' : 'outOfStock'
          }));
        // Initialize active slides
        this.latestBooks.forEach(book => {
          if (book._id) {
            this.activeSlides[book._id] = 0;
          }
        });
        // Start slideshows and Swiper after books are loaded
        this.startBookCardSlideshows();
        this.initializeSwiper();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load latest books:', err);
        this.cdr.detectChanges();
      }
    });
  }

  startHeroSlider(): void {
    const slides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;

    this.heroSlideInterval = setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 3000);
  }

  initializeSwiper(): void {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }

    // Wait for DOM to update
    setTimeout(() => {
      this.swiper = new Swiper('.books-slider', {
        modules: [Navigation, Pagination],
        direction: 'horizontal',
        loop: this.latestBooks.length >= 4, // Loop if 4 or more books
        slidesPerView: 4, // Changed to 4 cards
        slidesPerGroup: 1,
        spaceBetween: 20,
        navigation: {
          nextEl: '.slider-nav.next',
          prevEl: '.slider-nav.prev',
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        breakpoints: {
          320: {
            slidesPerView: 1,
            slidesPerGroup: 1,
            spaceBetween: 10,
          },
          768: {
            slidesPerView: 2,
            slidesPerGroup: 1,
            spaceBetween: 15,
          },
          1024: {
            slidesPerView: 4, // Changed to 4 cards
            slidesPerGroup: 1,
            spaceBetween: 20,
          },
        },
      });

      // Debugging: Log Swiper initialization
      console.log('Swiper initialized:', this.swiper);
      console.log('Navigation elements:', {
        next: document.querySelector('.slider-nav.next'),
        prev: document.querySelector('.slider-nav.prev'),
      });

      // Update Swiper after initialization
      this.swiper.update();
    }, 0);
  }

  startBookCardSlideshows(): void {
    // Clear previous intervals
    this.bookSlideshowIntervals.forEach(interval => clearInterval(interval));
    this.bookSlideshowIntervals = [];

    const cards = document.querySelectorAll('.book-card');
    cards.forEach((card, index) => {
      const slides = card.querySelectorAll('.book-slide');
      let currentSlide = 0;

      const updateCardSlideshow = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
        // Update activeSlides for the book
        const bookId = this.latestBooks[index]?._id;
        if (bookId) {
          this.activeSlides[bookId] = currentSlide;
        }
      };

      this.bookSlideshowIntervals[index] = setInterval(updateCardSlideshow, 2000);
    });
  }

  setupIntersectionObserver(): void {
    const achievementsSection = document.querySelector('.achievements-section');
    if (!achievementsSection) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.startCounterAnimation();
          this.observer?.unobserve(achievementsSection);
        }
      });
    }, { threshold: 0.5 });

    this.observer.observe(achievementsSection);
  }

  startCounterAnimation(): void {
    const counters = [
      { id: 'years-experience', target: 15, duration: 2000 },
      { id: 'books', target: 100, duration: 2000 },
      { id: 'stories', target: 250, duration: 2000 },
      { id: 'awards', target: 30, duration: 2000 }
    ];

    counters.forEach(counter => {
      const element = document.getElementById(counter.id);
      if (!element) return;

      let start = 0;
      const increment = counter.target / (counter.duration / 16);
      const updateCounter = () => {
        start += increment;
        if (start >= counter.target) {
          element.textContent = counter.target + '+';
        } else {
          element.textContent = Math.ceil(start) + '+';
          requestAnimationFrame(updateCounter);
        }
      };
      requestAnimationFrame(updateCounter);
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      console.log('Form Submitted:', this.contactForm.value);
      this.showToast('تم إرسال الرسالة بنجاح!', 'success');
      this.contactForm.reset();
    } else {
      this.showToast('يرجى ملء جميع الحقول بشكل صحيح', 'error');
    }
  }

  addToCart(book: Book): void {
    if (!book._id) {
      this.showToast('خطأ: لا يمكن إضافة الكتاب بدون معرف', 'error');
      return;
    }

    if (book.stockStatus === 'outOfStock') {
      this.showToast('هذا الكتاب غير متوفر حالياً', 'error');
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
            this.showToast(`تمت إضافة "${book.name}" إلى السلة 🛒`, 'success');
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

        this.showToast(`تمت إضافة "${book.name}" إلى السلة 🛒`, 'success');
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

        this.showToast('الكتاب مضاف بالفعل راجع السله الخاصه بك', 'error');
      }
    });
  }

  toggleFavorite(book: Book): void {
    if (!book._id) {
      this.showToast('خطأ: لا يمكن إضافة الكتاب بدون معرف', 'error');
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
        this.showToast(`خطأ في ${this.isBookFavorited(book) ? 'إزالة' : 'إضافة'} الكتاب`, 'error');
      }
    });
  }

  isBookFavorited(book: Book): boolean {
    return this.favoritesService.isFavorited(book._id);
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

  calculateBookFinalPrice(book: Book): number {
    return book.price - (book.price * (book.offer || 0) / 100);
  }

  hasDiscount(book: Book): boolean {
    return book.offer > 0;
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

  trackByBookId(index: number, book: Book): string {
    return book._id || index.toString();
  }

  trackByToastId(index: number, toast: Toast): number {
    return toast.id;
  }
}
