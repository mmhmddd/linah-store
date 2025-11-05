// books.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/constants/api-endpoints';

export interface Book {
  _id: string;
  name: string;
  title: string;
  category: string;
  imgs: string[];
  code: string;
  price: number;
  quantity: number;
  description: string;
  offer: number;
  stockStatus: 'inStock' | 'outOfStock';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  [x: string]: any;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}${API_ENDPOINTS.books.getAll}`, { headers: this.getHeaders() });
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}${API_ENDPOINTS.books.getById(id)}`, { headers: this.getHeaders() });
  }

  createBook(book: Partial<Book>, files: File[]): Observable<Book> {
    const formData = new FormData();
    formData.append('name', book.name?.trim() || '');
    formData.append('title', book.title?.trim() || '');
    formData.append('category', book.category?.trim() || '');
    formData.append('code', book.code?.trim() || '');
    formData.append('price', (book.price ?? 0).toString());
    formData.append('quantity', (book.quantity ?? 0).toString());
    formData.append('description', book.description?.trim() || '');
    formData.append('offer', (book.offer ?? 0).toString());

    if (files && files.length > 0) {
      files.forEach(file => formData.append('imgs', file, file.name));
    }

    console.log('FormData entries for createBook:');
    for (const [key, value] of (formData as any).entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    }

    return this.http.post<Book>(
      `${this.apiUrl}${API_ENDPOINTS.books.create}`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  updateBook(id: string, book: Partial<Book>, files: File[]): Observable<Book> {
    const formData = new FormData();
    formData.append('name', book.name?.trim() || '');
    formData.append('title', book.title?.trim() || '');
    formData.append('category', book.category?.trim() || '');
    formData.append('code', book.code?.trim() || '');
    formData.append('price', (book.price ?? 0).toString());
    formData.append('quantity', (book.quantity ?? 0).toString());
    formData.append('description', book.description?.trim() || '');
    formData.append('offer', (book.offer ?? 0).toString());

    if (files && files.length > 0) {
      files.forEach(file => formData.append('imgs', file, file.name));
    }

    console.log('FormData entries for updateBook:');
    for (const [key, value] of (formData as any).entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    }

    return this.http.put<Book>(
      `${this.apiUrl}${API_ENDPOINTS.books.update(id)}`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  deleteBook(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}${API_ENDPOINTS.books.delete(id)}`,
      { headers: this.getHeaders() }
    );
  }

  addOffer(id: string, offer: number): Observable<Book> {
    return this.http.put<Book>(
      `${this.apiUrl}${API_ENDPOINTS.books.addOffer(id)}`,
      { offer },
      { headers: this.getHeaders() }
    );
  }

  setStockStatus(id: string, quantity: number): Observable<Book> {
    return this.http.put<Book>(
      `${this.apiUrl}${API_ENDPOINTS.books.setStockStatus(id)}`,
      { quantity },
      { headers: this.getHeaders() }
    );
  }
  getBooksByCategory(category: string): Observable<Book[]> {
    return this.http.get<Book[]>(
      `${this.apiUrl}${API_ENDPOINTS.books.getAll}?category=${encodeURIComponent(category)}`,
      { headers: this.getHeaders() }
    );
  }
}
