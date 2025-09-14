import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  description: string;
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();

  constructor() {
    // Initialize with sample data (optional, can be removed if cart starts empty)
    this.cartItems.next([
      {
        id: 1,
        title: 'مغامرات في الغابة السحرية',
        price: 200.00,
        quantity: 1,
        image: '/assets/images/home/book1.jpg',
        category: 'مغامرات',
        description: 'انطلق في رحلة مثيرة مع الأصدقاء في الغابة المليئة بالأسرار',
        rating: 5
      }
    ]);
  }

  addToCart(item: CartItem) {
    const currentItems = this.cartItems.getValue();
    const existingItem = currentItems.find(cartItem => cartItem.title === item.title);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentItems.push({ ...item, quantity: 1 });
    }
    this.cartItems.next([...currentItems]);
  }

  getCartItems(): CartItem[] {
    return this.cartItems.getValue();
  }

  updateQuantity(itemId: number, change: number) {
    const currentItems = this.cartItems.getValue();
    const item = currentItems.find(cartItem => cartItem.id === itemId);
    if (item) {
      item.quantity = Math.max(1, item.quantity + change);
      this.cartItems.next([...currentItems]);
    }
  }

  removeFromCart(itemId: number) {
    const currentItems = this.cartItems.getValue().filter(cartItem => cartItem.id !== itemId);
    this.cartItems.next([...currentItems]);
  }

  applyCoupon(couponCode: string): number {
    if (couponCode === 'DISCOUNT10') {
      const subtotal = this.getSubtotal();
      return subtotal * 0.1; // 10% discount
    }
    return 0;
  }

  getSubtotal(): number {
    return this.cartItems.getValue().reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getTotalPrice(discount: number): number {
    return this.getSubtotal() - discount;
  }

  clearCart() {
    this.cartItems.next([]);
  }
}
