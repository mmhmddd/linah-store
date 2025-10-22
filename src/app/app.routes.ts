// routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { ChildrenBooksComponent } from './features/children-books/children-books.component';
import { BookDetailsComponent } from './features/book-details/book-details.component';
import { CartComponent } from './features/cart/cart.component';
import { FavouriteComponent } from './features/favourite/favourite.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { BooksControlComponent } from './dashboard/books-control/books-control.component';
import { UsersControlComponent } from './dashboard/users-control/users-control.component';
import { OrdersControlComponent } from './dashboard/orders-control/orders-control.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'LinaStore | Home' },
  { path: 'about', component: AboutComponent, title: 'LinaStore | About Us' },
  { path: 'contact', component: ContactComponent, title: 'LinaStore | Contact' },
  { path: 'children-books', component: ChildrenBooksComponent, title: 'LinaStore | Children Books' },
  { path: 'book/:id', component: BookDetailsComponent, title: 'LinaStore | Book Details' },
  { path: 'cart', component: CartComponent, title: 'LinaStore | Cart' },
  { path: 'favourite', component: FavouriteComponent, title: 'LinaStore | Favourite' },
  { path: 'login', component: LoginComponent, title: 'LinaStore | Login' },
  { path: 'register', component: RegisterComponent, title: 'LinaStore | Register' },
  { path: 'dashboard', component: DashboardComponent, title: 'LinaStore | Dashboard' },
  { path: 'books-control', component: BooksControlComponent, title: 'LinaStore | Books Control' },
  { path: 'users-control', component: UsersControlComponent, title: 'LinaStore | Users Control' }, 
  { path: 'orders-control', component: OrdersControlComponent, title: 'LinaStore | Orders Control' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
