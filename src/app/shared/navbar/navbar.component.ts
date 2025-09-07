import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isLoggedIn: boolean = false;
  brandText: string = 'متجر لينا للأطفال';
  mainMenu = [
    { link: '/', text: 'الرئيسية', icon: 'bi-house-fill' },
    { link: '/about', text: 'من نحن', icon: 'bi-info-circle-fill' },
    { link: '/children-books', text: 'كتب الأطفال', icon: 'bi-book-fill' },
    { link: '/contact', text: 'اتصل بنا', icon: 'bi-telephone-fill' }
  ];
  favouriteText: string = 'المفضلة';
  cartText: string = 'عربة التسوق';
  loginText: string = 'تسجيل الدخول';
  dropdownItems = [
    { link: '/profile', text: 'الملف الشخصي', icon: 'bi-person-fill' },
    { link: '/orders', text: 'طلباتي', icon: 'bi-bag-fill' },
    { link: '/dashboard', text: 'لوحة التحكم', icon: 'bi-speedometer2' },
    { separator: true },
    { text: 'تسجيل الخروج', action: () => this.logout(), icon: 'bi-box-arrow-right' }
  ];

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout() {
    this.isLoggedIn = false;
    // Add logout logic here
  }
}
