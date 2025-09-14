import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Book, FavoriteService } from '../../core/services/favourite.service';
import { CartService, CartItem } from '../../core/services/cart.service';

@Component({
  selector: 'app-favourite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favourite.component.html',
  styleUrls: ['./favourite.component.scss']
})
export class FavouriteComponent implements OnInit {
  favouriteItems: Book[] = [];
  showClearModal: boolean = false;

  constructor(
    private favoriteService: FavoriteService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.favoriteService.favoriteItems$.subscribe(items => {
      this.favouriteItems = items;
    });
  }

  trackById(index: number, item: Book): number {
    return item.id;
  }

  isFavourite(item: Book): boolean {
    return this.favoriteService.getFavorites().some(fav => fav.id === item.id);
  }

  toggleFavourite(item: Book): void {
    this.favoriteService.toggleFavorite(item);
  }

  isInCart(item: Book): boolean {
    return this.cartService.getCartItems().some(cartItem => cartItem.id === item.id);
  }

  toggleCart(item: Book): void {
    const cartItem: CartItem = { ...item }; // Ensure compatibility with CartItem interface
    if (this.isInCart(item)) {
      this.cartService.removeFromCart(item.id);
      alert('تمت إزالة الكتاب من السلة');
    } else {
      this.cartService.addToCart(cartItem);
      alert('تمت إضافة الكتاب إلى السلة');
    }
  }

  openClearModal(): void {
    this.showClearModal = true;
  }

  closeClearModal(): void {
    this.showClearModal = false;
  }

  clearFavourites(): void {
    this.favoriteService.clearFavorites();
    this.showClearModal = false;
    alert('تم مسح جميع المفضلة بنجاح!');
  }

  exploreBooks(): void {
    this.router.navigate(['/books']);
  }
}
