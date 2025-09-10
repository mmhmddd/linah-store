import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
  mainMenu = [
    { link: '/', text: 'الرئيسية', icon: 'bi-house-fill' },
    { link: '/about', text: 'من نحن', icon: 'bi-info-circle-fill' },
    { link: '/children-books', text: 'كتب الأطفال', icon: 'bi-book-fill' },
    { link: '/contact', text: 'اتصل بنا', icon: 'bi-telephone-fill' }
  ];
}
