import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Book {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  description: string;
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private favoriteItemsSubject = new BehaviorSubject<Book[]>([
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
    }
  ]);

  favoriteItems$: Observable<Book[]> = this.favoriteItemsSubject.asObservable();

  constructor() {}

  getFavorites(): Book[] {
    return this.favoriteItemsSubject.getValue();
  }

  toggleFavorite(item: Book): void {
    const currentFavorites = this.favoriteItemsSubject.getValue();
    const index = currentFavorites.findIndex(fav => fav.id === item.id);

    if (index > -1) {
      currentFavorites.splice(index, 1);
    } else {
      currentFavorites.push({ ...item, quantity: 1 });
    }

    this.favoriteItemsSubject.next([...currentFavorites]);
  }

  clearFavorites(): void {
    this.favoriteItemsSubject.next([]);
  }
}
