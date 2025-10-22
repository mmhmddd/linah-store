// features/favourite/favourite.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Book } from '../../core/services/books.service';
import { CartService, CartItem } from '../../core/services/cart.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FavoriteItem, FavoritesService } from '../../core/services/favourite.service';

@Component({
  selector: 'app-favourite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favourite.component.html',
  styleUrls: ['./favourite.component.scss']
})
export class FavouriteComponent implements OnInit, OnDestroy {
  favouriteItems: Book[] = [];
  showClearModal: boolean = false;
  cartItems: CartItem[] = [];
  imageModalUrls: string[] | null = null;
  currentImageIndex: number = 0;
  fallbackImage: string = '/assets/images/fallback.jpg';
  activeSlides: { [key: string]: number } = {};

  private subscriptions = new Subscription();

  constructor(
    private favoritesService: FavoritesService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.favoritesService.favoriteItems$.subscribe((items: FavoriteItem[]) => {
        this.favouriteItems = items.map(item => {
          const book = item.book;
          book.imgs = Array.isArray(book.imgs) ? book.imgs : [];
          book.stockStatus = book.quantity > 0 ? 'inStock' : 'outOfStock';
          if (book._id) {
            this.activeSlides[book._id] = 0;
          }
          return book;
        });
      })
    );

    this.subscriptions.add(
      this.cartService.cartItems$.subscribe((items: CartItem[]) => {
        this.cartItems = items;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  trackById(index: number, item: Book): string {
    return item._id;
  }

  // ✅ ALL CHILDREN-BOOKS METHODS
  getImageUrl(img: string): string {
    if (!img) return this.fallbackImage;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const baseUrl = environment.apiUrl.replace('/api', '');
    if (img.startsWith('/uploads')) return `${baseUrl}${img}`;
    if (!img.startsWith('/')) return `${baseUrl}/uploads/${img}`;
    return `${baseUrl}${img}`;
  }

  handleImageError(bookId: string): void {
    console.warn(`Image error for book ID: ${bookId}`);
  }

  calculateBookFinalPrice(book: Book): number {
    return book.price - (book.price * (book.offer || 0) / 100);
  }

  hasDiscount(book: Book): boolean {
    return book.offer > 0;
  }

  getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'خيال': '🌊', 'مغامرات': '🚀', 'علوم': '🔬', 'قصص': '📖',
      'تعليمي': '🎓', 'فنون': '🎨', 'أطفال': '👶'
    };
    return emojiMap[category] || '📚';
  }

  isInCart(item: Book): boolean {
    return this.cartItems.some(cartItem => cartItem.book._id === item._id);
  }

  toggleCart(item: Book): void {
    if (this.isInCart(item)) {
      this.cartService.removeFromCart(item._id).subscribe({
        next: () => console.log('Removed from cart'),
        error: (err) => alert(err.message)
      });
    } else {
      this.cartService.addToCart(item._id, 1).subscribe({
        next: () => console.log('Added to cart'),
        error: (err) => alert(err.message)
      });
    }
  }

  removeFromFavorites(item: Book): void {
    this.favoritesService.removeFromFavorites(item._id).subscribe({
      next: () => console.log('Removed from favorites'),
      error: (err) => alert(err.message)
    });
  }

  // ✅ IMAGE MODAL METHODS
  openImageModal(img: string, book: Book): void {
    this.imageModalUrls = book.imgs;
    this.currentImageIndex = book.imgs.indexOf(img);
  }

  prevImage(): void {
    if (this.imageModalUrls && this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage(): void {
    if (this.imageModalUrls && this.currentImageIndex < this.imageModalUrls.length - 1) {
      this.currentImageIndex++;
    }
  }

  // Modal methods
  openClearModal(): void { this.showClearModal = true; }
  closeClearModal(): void { this.showClearModal = false; }

  clearFavourites(): void {
    this.favoritesService.clearFavorites().subscribe({
      next: () => {
        this.showClearModal = false;
        alert('تم مسح جميع المفضلة بنجاح!');
      },
      error: (err) => alert('خطأ في مسح المفضلة: ' + err.message)
    });
  }

  exploreBooks(): void {
    this.router.navigate(['/books']);
  }
}
