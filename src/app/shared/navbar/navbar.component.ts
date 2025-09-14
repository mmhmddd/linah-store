import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service'; // Adjust path as needed

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  loginText: string = 'تسجيل الدخول';
  mainMenu = [
    { link: '/', text: 'الرئيسية', icon: 'bi-house-fill' },
    { link: '/about', text: 'من نحن', icon: 'bi-info-circle-fill' },
    { link: '/children-books', text: 'كتب الأطفال', icon: 'bi-book-fill' },
    { link: '/contact', text: 'اتصل بنا', icon: 'bi-telephone-fill' }
  ];
  favouriteText: string = 'المفضلة';
  cartText: string = 'عربة التسوق';

  isMobileMenuOpen = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to AuthService to update login state and button text
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user && this.authService.isLoggedIn(); // Check token existence
      this.loginText = this.isLoggedIn ? 'تسجيل الخروج' : 'تسجيل الدخول';
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  handleAuthAction() {
    if (this.isLoggedIn) {
      this.authService.logout(); // Remove token and user data
    }
    this.toggleMobileMenu(); // Close mobile menu
  }
}
