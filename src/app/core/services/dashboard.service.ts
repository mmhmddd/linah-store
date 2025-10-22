// dashboard.service.ts - ✅ FIXED VERSION
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { BooksService } from './books.service';
import { OrderService } from './order.service';


export interface DashboardStats {
  totalBooks: number;
  totalOrders: number;
  todayRevenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private booksService: BooksService,
    private orderService: OrderService
  ) {}

  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      books: this.booksService.getAllBooks().pipe(map(books => books.length)),
      orders: this.orderService.getAllOrders().pipe(map(result => result.count)),
      ordersData: this.orderService.getAllOrders()
    }).pipe(
      map(({ books, orders, ordersData }) => {
        console.log('🔍 ALL ORDERS:', ordersData.orders); // DEBUG
        console.log('📅 TODAY:', new Date().toISOString().split('T')[0]); // DEBUG

        // ✅ FIXED: Get today's date as STRING (YYYY-MM-DD)
        const todayString = new Date().toISOString().split('T')[0];

        // ✅ FIXED: Filter CONFIRMED ORDERS TODAY
        const confirmedTodayOrders = ordersData.orders.filter(order => {
          // Get order date as YYYY-MM-DD string
          const orderDateString = new Date(order.createdAt).toISOString().split('T')[0];

          console.log(`Order ${order._id}: Status=${order.status}, Date=${orderDateString}, Amount=${order.totalAmount}`); // DEBUG

          return order.status === 'مسلم' && orderDateString === todayString;
        });

        console.log('✅ CONFIRMED TODAY ORDERS:', confirmedTodayOrders); // DEBUG

        // Calculate revenue
        const todayRevenue = confirmedTodayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        console.log('💰 FINAL REVENUE:', todayRevenue); // DEBUG

        return {
          totalBooks: books,
          totalOrders: orders,
          todayRevenue: todayRevenue
        };
      })
    );
  }
}
