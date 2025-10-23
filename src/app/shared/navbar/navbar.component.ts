import { Component, OnInit, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

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
    { link: '/', text: 'الرئيسية', icon: 'bi-house-fill', hasDropdown: false },
    { link: '/about', text: 'من نحن', icon: 'bi-info-circle-fill', hasDropdown: false },
    {
      link: '/all-books',
      text: 'جميع الكتب',
      icon: 'bi-book-fill',
      hasDropdown: true,
      subMenu: [
        { link: '/all-books', text: 'جميع الكتب', icon: 'bi-collection-fill' },
        { link: '/children-books', text: 'كتب الأطفال', icon: 'bi-book-half' },
        { link: '/children-stories', text: 'قصص الأطفال', icon: 'bi-journal-text' }
      ]
    },
    { link: '/contact', text: 'اتصل بنا', icon: 'bi-telephone-fill', hasDropdown: false }
  ];
  favouriteText: string = 'المفضلة';
  cartText: string = 'عربة التسوق';

  isMobileMenuOpen = false;
  isDropdownOpen = false;

  // Example counts - replace with actual service data
  favouriteCount: number = 0;
  cartCount: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to AuthService to update login state and button text
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user && this.authService.isLoggedIn();
      this.loginText = this.isLoggedIn ? 'تسجيل الخروج' : 'تسجيل الدخول';
    });

    // Close dropdown on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isDropdownOpen = false;
      this.isMobileMenuOpen = false;
    });

    // TODO: Subscribe to cart and favorite services to update counts
    // Example:
    // this.cartService.cartItems$.subscribe(items => {
    //   this.cartCount = items.length;
    // });
    // this.favouriteService.favourites$.subscribe(items => {
    //   this.favouriteCount = items.length;
    // });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
    this.isMobileMenuOpen = false;
  }

  isDropdownActive(): boolean {
    const booksRoutes = ['/all-books', '/children-books', '/children-stories'];
    return booksRoutes.some(route => this.router.url.includes(route));
  }

  handleAuthAction(): void {
    if (this.isLoggedIn) {
      this.authService.logout();
    }
    this.toggleMobileMenu();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.isDropdownOpen = false;
    }
  }
}
