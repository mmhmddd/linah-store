import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  description: string;
  rating: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  step: number = 1;
  shippingInfo = {
    governorate: '',
    name: '',
    address: '',
    notes: ''
  };
  couponCode: string = '';
  discount: number = 0;
  governorates: string[] = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'البحر الأحمر',
    'البحيرة',
    'الفيوم',
    'الغربية',
    'الإسماعيلية',
    'المنوفية',
    'المنيا',
    'القليوبية',
    'الأقصر',
    'أسوان',
    'أسيوط',
    'بني سويف',
    'بورسعيد',
    'دمياط',
    'السويس',
    'الشرقية',
    'كفر الشيخ',
    'مطروح',
    'قنا',
    'شمال سيناء',
    'جنوب سيناء',
    'سوهاج'
  ];

  ngOnInit() {
    this.cartItems = [
      {
        id: 1,
        title: 'مغامرات في الغابة السحرية',
        price: 200.00,
        quantity: 1,
        image: '/assets/images/home/book1.jpg',
        category: 'مغامرات',
        description: 'انطلق في رحلة مثيرة مع الأصدقاء في الغابة المليئة بالأسرار',
        rating: 5
      },
      {
        id: 2,
        title: 'أسرار القلعة القديمة',
        price: 150.00,
        quantity: 1,
        image: '/assets/images/home/book2.jpg',
        category: 'غموض',
        description: 'استكشف أسرار قلعة قديمة مليئة بالألغاز والمفاجآت',
        rating: 4
      },
      {
        id: 3,
        title: 'رحلة إلى المجهول',
        price: 180.00,
        quantity: 1,
        image: '/assets/images/home/book3.jpg',
        category: 'مغامرات',
        description: 'رحلة ملحمية عبر عوالم غريبة ومثيرة',
        rating: 5
      },
      {
        id: 4,
        title: 'حكايات من الزمن الجميل',
        price: 120.00,
        quantity: 1,
        image: '/assets/images/home/book4.jpg',
        category: 'روايات',
        description: 'مجموعة قصص تأخذك إلى أيام الزمن الجميل',
        rating: 3
      }
    ];
  }

  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getTotalPrice(): number {
    return this.getSubtotal() - this.discount;
  }

  updateQuantity(item: CartItem, change: number) {
    item.quantity = Math.max(1, item.quantity + change);
  }

  removeFromCart(itemId: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    if (this.cartItems.length === 0) {
      this.step = 1;
    }
  }

  applyCoupon() {
    if (this.couponCode === 'DISCOUNT10') {
      this.discount = this.getSubtotal() * 0.1; // 10% discount
    } else {
      this.discount = 0;
      alert('كوبون غير صالح');
    }
  }

  nextStep() {
    if (this.step < 2) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  submitShipping() {
    if (this.shippingInfo.governorate && this.shippingInfo.name && this.shippingInfo.address) {
      console.log('Order submitted:', {
        cartItems: this.cartItems,
        shippingInfo: this.shippingInfo,
        totalPrice: this.getTotalPrice()
      });
      alert('تم تأكيد الطلب بنجاح!');
      this.cartItems = [];
      this.shippingInfo = { governorate: '', name: '', address: '', notes: '' };
      this.couponCode = '';
      this.discount = 0;
      this.step = 1;
    }
  }

  addToCart(title: string) {
    const existingItem = this.cartItems.find(item => item.title === title);
    if (existingItem) {
      this.updateQuantity(existingItem, 1);
    } else {
      this.cartItems.push({
        id: this.cartItems.length + 1,
        title,
        price: 200.00,
        quantity: 1,
        image: '/assets/images/home/book5.jpg',
        category: 'مغامرات',
        description: 'انطلق في رحلة مثيرة مع الأصدقاء في الغابة المليئة بالأسرار',
        rating: 5
      });
    }
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
