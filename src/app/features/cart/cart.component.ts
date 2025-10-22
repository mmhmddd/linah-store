// cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CartItem, CartService } from '../../core/services/cart.service';
import { OrderService, Order } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  step: number = 1;
  shippingInfo = {
    government: '',
    fullName: '',
    address: '',
    paymentMethod: 'cash' as 'cash' | 'visa',
    saleCode: '',
    notes: ''
  };
  discount: number = 0;
  governorates: string[] = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
    'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الأقصر', 'أسوان',
    'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'السويس', 'الشرقية', 'كفر الشيخ',
    'مطروح', 'قنا', 'شمال سيناء', 'جنوب سيناء', 'سوهاج'
  ];
  fallbackImage: string = '/assets/images/fallback.jpg';

  private cartSubscription?: Subscription;
  private authReadySubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('🛒 CART COMPONENT - ngOnInit STARTED');

    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      console.log('🛒 Cart items updated:', items.length, 'items');
      this.cartItems = items;
    });
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.authReadySubscription) {
      this.authReadySubscription.unsubscribe();
    }
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

  getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'خيال': '🌊',
      'مغامرات': '🚀',
      'علوم': '🔬',
      'قصص': '📖',
      'تعليمي': '🎓',
      'فنون': '🎨'
    };
    return emojiMap[category] || '📚';
  }

  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => {
      const discountedPrice = item.book.price - (item.book.price * (item.book.offer / 100));
      return total + (discountedPrice * item.quantity);
    }, 0);
  }

  getTotalPrice(): number {
    return this.getSubtotal() - this.discount;
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = Math.max(1, item.quantity + change);
    this.cartService.updateQuantity(item.book._id, newQuantity).subscribe({
      error: (err) => alert('فشل في تحديث الكمية: ' + err.message)
    });
  }

  removeFromCart(bookId: string) {
    this.cartService.removeFromCart(bookId).subscribe({
      next: () => {
        if (this.cartItems.length === 0) {
          this.step = 1;
          this.discount = 0;
          this.shippingInfo.saleCode = '';
        }
      },
      error: (err) => alert('فشل في إزالة العنصر: ' + err.message)
    });
  }

  applyCoupon() {
    if (this.shippingInfo.saleCode === 'DISCOUNT10') {
      this.discount = this.getSubtotal() * 0.1;
    } else {
      this.discount = 0;
      alert('كوبون غير صالح');
    }
  }

  nextStep() {
    if (this.step < 2 && this.cartItems.length > 0) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  submitShipping() {
    if (this.shippingInfo.government &&
        this.shippingInfo.fullName &&
        this.shippingInfo.address &&
        this.shippingInfo.paymentMethod) {

      this.orderService.createOrder({
        government: this.shippingInfo.government,
        fullName: this.shippingInfo.fullName,
        address: this.shippingInfo.address,
        paymentMethod: this.shippingInfo.paymentMethod,
        saleCode: this.shippingInfo.saleCode || undefined,
        notes: this.shippingInfo.notes || undefined
      }).subscribe({
        next: (order: Order) => {
          alert('تم تأكيد الطلب بنجاح!');
          this.cartService.clearCart().subscribe(() => {
            this.resetForm();
          });
        },
        error: (err) => alert('فشل في إنشاء الطلب: ' + err.message)
      });
    } else {
      alert('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  private resetForm(): void {
    this.shippingInfo = {
      government: '',
      fullName: '',
      address: '',
      paymentMethod: 'cash',
      saleCode: '',
      notes: ''
    };
    this.discount = 0;
    this.step = 1;
  }

  scrollToOrderSummary(): void {
    const element = document.getElementById('order-summary');
    if (element) {
      const offset = 90;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }
}
