import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BooksService, Book } from '../../core/services/books.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-books-control',
  standalone: true,
  imports: [SidebarComponent, CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  templateUrl: './books-control.component.html',
  styleUrls: ['./books-control.component.scss']
})
export class BooksControlComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  bookForm: FormGroup;
  showForm = false;
  editingBookId: string | null = null;
  selectedFiles: { file: File | null, preview: string }[] = [];
  errorMessage: string | null = null;
  imageError: string | null = null;
  isLoading = false;
  imageModalUrls: string[] | null = null;
  currentImageIndex: number = 0;
  deleteModalId: string | null = null;
  offerModalId: string | null = null;
  offerModalValue: number = 0;
  stockModalId: string | null = null;
  stockModalValue: number = 0;
  categoryFilter: string = '';
  stockFilter: string = '';
  sortBy: string = 'name';
  uniqueCategories: string[] = [];
  fallbackImage: string = '/assets/images/fallback.jpg';
  private loadingImages = new Map<string, boolean>();

  constructor(
    private booksService: BooksService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.bookForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      title: ['', [Validators.required, Validators.minLength(1)]],
      category: ['', [Validators.required, Validators.minLength(1)]],
      code: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      offer: [0, [Validators.min(0), Validators.max(100)]],
    });
  }

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.isLoading = true;
    this.booksService.getAllBooks().subscribe({
      next: (books) => {
        books.forEach(book => {
          if (!Array.isArray(book.imgs)) {
            book.imgs = [];
          }
        });
        this.books = books;
        this.filteredBooks = [...books];
        this.uniqueCategories = [...new Set(books.map(book => book.category))];
        this.sortBooks();
        this.isLoading = false;
        this.errorMessage = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'خطأ في تحميل الكتب: ' + (err.error?.message || err.message || 'غير معروف');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getImageUrl(img: string): string {
    if (!img) {
      return this.fallbackImage;
    }

    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }

    const baseUrl = environment.apiUrl.replace('/api', '');

    if (img.startsWith('/uploads')) {
      return `${baseUrl}${img}`;
    }

    if (!img.startsWith('/')) {
      return `${baseUrl}/uploads/${img}`;
    }

    return `${baseUrl}${img}`;
  }

  isImageLoading(img: string): boolean {
    const url = this.getImageUrl(img);
    return this.loadingImages.get(url) === true;
  }

  onImageLoad(img: string) {
    const url = this.getImageUrl(img);
    this.loadingImages.set(url, false);
    this.cdr.detectChanges();
  }

  handleImageError(index: number, bookId?: string) {
    if (index >= 0 && this.selectedFiles[index]) {
      this.selectedFiles[index].preview = this.fallbackImage;
      this.selectedFiles = [...this.selectedFiles];
    }

    const book = bookId ? this.books.find(b => b._id === bookId) : null;
    if (book && book.imgs[0]) {
      const url = this.getImageUrl(book.imgs[0]);
      this.loadingImages.set(url, false);
    }

    this.cdr.detectChanges();
  }

  calculateFinalPrice(): number {
    const price = this.bookForm.get('price')?.value || 0;
    const offer = this.bookForm.get('offer')?.value || 0;
    return price - (price * offer / 100);
  }

  calculateBookFinalPrice(book: Book): number {
    return book.price - (book.price * (book.offer || 0) / 100);
  }

  openAddBookForm() {
    this.showForm = true;
    this.editingBookId = null;
    this.bookForm.reset({
      name: '',
      title: '',
      category: '',
      code: '',
      price: 0,
      quantity: 0,
      description: '',
      offer: 0,
    });
    this.selectedFiles = [];
    this.errorMessage = null;
    this.imageError = null;
  }

  editBook(book: Book) {
    this.showForm = true;
    this.editingBookId = book._id!;
    this.bookForm.reset({
      name: book.name,
      title: book.title,
      category: book.category,
      code: book.code || '',
      price: book.price,
      quantity: book.quantity,
      description: book.description || '',
      offer: book.offer || 0,
    });

    this.selectedFiles = book.imgs.map(img => ({
      file: null,
      preview: this.getImageUrl(img)
    }));

    this.errorMessage = null;
    this.imageError = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFileChange(event: Event) {
    this.imageError = null;
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files).slice(0, 5 - this.selectedFiles.length);

      if (files.length + this.selectedFiles.length > 5) {
        this.imageError = 'الحد الأقصى 5 صور';
        return;
      }

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          this.imageError = `حجم الصورة "${file.name}" يجب أن يكون أقل من 5 ميجابايت`;
          return;
        }

        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
          this.imageError = `الصورة "${file.name}" يجب أن تكون من نوع JPEG، PNG، GIF، أو WebP`;
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          this.selectedFiles.push({ file, preview: reader.result as string });
          this.selectedFiles = [...this.selectedFiles];
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles];
    this.imageError = null;
    this.cdr.detectChanges();
  }

  isSubmitDisabled(): boolean {
    if (this.bookForm.invalid) return true;
    if (!this.editingBookId && this.selectedFiles.length === 0) return true;
    return false;
  }

  submitBook() {
    if (this.isSubmitDisabled()) {
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح';
      return;
    }

    const bookData: Partial<Book> = {
      name: this.bookForm.value.name.trim(),
      title: this.bookForm.value.title.trim(),
      category: this.bookForm.value.category.trim(),
      code: this.bookForm.value.code?.trim() || '',
      price: Number(this.bookForm.value.price),
      quantity: Number(this.bookForm.value.quantity),
      description: this.bookForm.value.description?.trim() || '',
      offer: Number(this.bookForm.value.offer) || 0,
    };

    const files = this.selectedFiles.map(f => f.file).filter(f => f) as File[];

    this.isLoading = true;

    if (this.editingBookId) {
      this.booksService.updateBook(this.editingBookId, bookData, files).subscribe({
        next: () => {
          this.loadBooks();
          this.showForm = false;
          this.bookForm.reset();
          this.selectedFiles = [];
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'خطأ في تحديث الكتاب: ' + (err.error?.message || err.message || 'غير معروف');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.booksService.createBook(bookData, files).subscribe({
        next: () => {
          this.loadBooks();
          this.showForm = false;
          this.bookForm.reset();
          this.selectedFiles = [];
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'خطأ في إضافة الكتاب: ' + (err.error?.message || err.message || 'غير معروف');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  cancelForm() {
    this.showForm = false;
    this.bookForm.reset();
    this.editingBookId = null;
    this.selectedFiles = [];
    this.errorMessage = null;
    this.imageError = null;
    this.cdr.detectChanges();
  }

  openDeleteModal(id: string) {
    this.deleteModalId = id;
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (this.deleteModalId) {
      this.isLoading = true;
      this.booksService.deleteBook(this.deleteModalId).subscribe({
        next: () => {
          this.loadBooks();
          this.deleteModalId = null;
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'خطأ في حذف الكتاب: ' + (err.error?.message || err.message || 'غير معروف');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  openOfferModal(id: string, currentOffer: number) {
    this.offerModalId = id;
    this.offerModalValue = currentOffer;
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  confirmOffer() {
    if (this.offerModalId && this.offerModalValue >= 0 && this.offerModalValue <= 100) {
      this.isLoading = true;
      this.booksService.addOffer(this.offerModalId, this.offerModalValue).subscribe({
        next: () => {
          this.loadBooks();
          this.offerModalId = null;
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'خطأ في إضافة العرض: ' + (err.error?.message || err.message || 'غير معروف');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  openStockModal(id: string, currentQuantity: number) {
    this.stockModalId = id;
    this.stockModalValue = currentQuantity;
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  confirmStock() {
    if (this.stockModalId && this.stockModalValue >= 0) {
      this.isLoading = true;
      this.booksService.setStockStatus(this.stockModalId, this.stockModalValue).subscribe({
        next: () => {
          this.loadBooks();
          this.stockModalId = null;
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'خطأ في تحديث المخزون: ' + (err.error?.message || err.message || 'غير معروف');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  openImageModal(img: string) {
    const book = this.books.find(b => b.imgs.includes(img));
    this.imageModalUrls = book ? book.imgs : [img];
    this.currentImageIndex = book ? book.imgs.indexOf(img) : 0;
    this.cdr.detectChanges();
  }

  prevImage() {
    if (this.imageModalUrls && this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.cdr.detectChanges();
    }
  }

  nextImage() {
    if (this.imageModalUrls && this.currentImageIndex < this.imageModalUrls.length - 1) {
      this.currentImageIndex++;
      this.cdr.detectChanges();
    }
  }

  filterBooks() {
    this.filteredBooks = this.books.filter(book => {
      const matchesCategory = this.categoryFilter ? book.category === this.categoryFilter : true;
      const matchesStock = this.stockFilter ? book.stockStatus === this.stockFilter : true;
      return matchesCategory && matchesStock;
    });
    this.sortBooks();
    this.cdr.detectChanges();
  }

  sortBooks() {
    this.filteredBooks.sort((a, b) => {
      if (this.sortBy === 'price') return a.price - b.price;
      if (this.sortBy === 'quantity') return a.quantity - b.quantity;
      return a.name.localeCompare(b.name, 'ar');
    });
    this.cdr.detectChanges();
  }
}
