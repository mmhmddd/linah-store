import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// ✅ UPDATED: Arabic Statuses
export type OrderStatus = 'قيد الانتظار' | 'مسلم' | 'ملغي';

export interface OrderItem {
  book: {
    _id: string;
    name: string;
    title: string;
    price: number;
    imgs: string[];
    category: string;
  };
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  user?: { _id: string; fullName: string; email: string };
  items: OrderItem[];
  totalAmount: number;
  government: string;
  fullName: string;
  address: string;
  paymentMethod: 'cash' | 'visa';
  saleCode?: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  government: string;
  fullName: string;
  address: string;
  paymentMethod: 'cash' | 'visa';
  saleCode?: string;
  notes?: string;
}

export interface UpdateOrderData {
  government?: string;
  fullName?: string;
  address?: string;
  paymentMethod?: 'cash' | 'visa';
  saleCode?: string;
  notes?: string;
  status?: OrderStatus;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // CREATE ORDER
  createOrder(orderData: CreateOrderData): Observable<Order> {
    return this.http.post<{ message: string; order: Order }>(
      `${environment.apiUrl}${API_ENDPOINTS.orders.create}`,
      orderData,
      { headers: this.getHeaders(), withCredentials: true }
    ).pipe(
      map(response => response.order),
      catchError(error => throwError(() => new Error(error.error?.message || 'فشل في إنشاء الطلب')))
    );
  }

  // GET ALL ORDERS
  getAllOrders(): Observable<{ orders: Order[]; count: number }> {
    return this.http.get<{ message: string; orders: Order[]; count: number }>(
      `${environment.apiUrl}${API_ENDPOINTS.orders.getAll}`,
      { headers: this.getHeaders(), withCredentials: true }
    ).pipe(
      map(response => ({ orders: response.orders, count: response.count })),
      catchError(error => throwError(() => new Error(error.error?.message || 'فشل في جلب الطلبات')))
    );
  }

  // GET SINGLE ORDER
  getOrderById(id: string): Observable<Order> {
    return this.http.get<{ message: string; order: Order }>(
      `${environment.apiUrl}${API_ENDPOINTS.orders.getById(id)}`,
      { headers: this.getHeaders(), withCredentials: true }
    ).pipe(
      map(response => response.order),
      catchError(error => throwError(() => new Error(error.error?.message || 'فشل في جلب الطلب')))
    );
  }

  // UPDATE ORDER STATUS
  updateOrderStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.put<{ message: string; order: Order }>(
      `${environment.apiUrl}${API_ENDPOINTS.orders.updateStatus(id)}`,
      { status },
      { headers: this.getHeaders(), withCredentials: true }
    ).pipe(
      map(response => response.order),
      catchError(error => throwError(() => new Error(error.error?.message || 'فشل في تحديث حالة الطلب')))
    );
  }

  // UPDATE ORDER DETAILS (Admin only) - ✅ SINGLE METHOD ONLY
  updateOrder(id: string, updateData: UpdateOrderData): Observable<Order> {
    return this.http.put<{ message: string; order: Order }>(
      `${environment.apiUrl}${API_ENDPOINTS.orders.update(id)}`,
      updateData,
      { headers: this.getHeaders(), withCredentials: true }
    ).pipe(
      map(response => response.order),
      catchError(error => throwError(() => new Error(error.error?.message || 'فشل في تحديث الطلب')))
    );
  }

  // DELETE ORDER
  deleteOrder(id: string): Observable<void> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}${API_ENDPOINTS.orders.delete(id)}`,
      { headers: this.getHeaders(), withCredentials: true }
    ).pipe(
      map(() => void 0),
      catchError(error => throwError(() => new Error(error.error?.message || 'فشل في حذف الطلب')))
    );
  }
}
