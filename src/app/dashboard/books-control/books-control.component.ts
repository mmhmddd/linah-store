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
  selectedFiles: { file: File | null; preview: string }[] = [];
  errorMessage: string | null = null;
  imageError: string | null = null;
  isLoading = false;
  imageModalUrls: string[] | null = null;
  currentImageIndex = 0;
  deleteModalId: string | null = null;
  offerModalId: string | null = null;
  offerModalValue = 0;
  stockModalId: string | null = null;
  stockModalValue = 0;
  categoryFilter = '';
  stockFilter = '';
  sortBy = 'name';

  // الفئات المسموح بها (بالألف الممدودة)
  readonly allowedCategories = ['كتاب اطفال', 'قصص أطفال'];
  uniqueCategories = this.allowedCategories;

  fallbackImage = '/assets/images/fallback.jpg';
  private loadingImages = new Map<string, boolean>();

  constructor(
    private booksService: BooksService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.bookForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      title: ['', [Validators.required, Validators.minLength(1)]],
      category: ['', [Validators.required]],
      code: [''],
      price: [0, [Validators.required, Validators.min(0.01)]],
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
          if (!Array.isArray(book.imgs)) book.imgs = [];

          // تصحيح الفئة من "قصص الطفال" إلى "قصص أطفال"
          if (book.category === 'قصص الطفال') {
            book.category = 'قصص أطفال';
          } else if (!this.allowedCategories.includes(book.category)) {
            book.category = this.allowedCategories[0];
          }
        });

        this.books = books;
        this.filteredBooks = [...books];
        this.sortBooks();
        this.isLoading = false;
        this.errorMessage = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'خطأ في تحميل الكتب: ' + (err.error?.message || err.message || 'غير معروف');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getImageUrl(img: string): string {
    if (!img) return this.fallbackImage;
    if (img.startsWith('http')) return img;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return img.startsWith('/uploads') ? `${baseUrl}${img}` : `${baseUrl}/uploads/${img}`;
  }

  isImageLoading(img: string): boolean {
    return this.loadingImages.get(this.getImageUrl(img)) === true;
  }

  onImageLoad(img: string) {
    this.loadingImages.set(this.getImageUrl(img), false);
    this.cdr.detectChanges();
  }

  handleImageError(index: number, bookId?: string) {
    if (index >= 0 && this.selectedFiles[index]) {
      this.selectedFiles[index].preview = this.fallbackImage;
      this.selectedFiles = [...this.selectedFiles];
    }
    if (bookId) {
      const book = this.books.find(b => b._id === bookId);
      if (book?.imgs[0]) {
        this.loadingImages.set(this.getImageUrl(book.imgs[0]), false);
      }
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
      name: '', title: '', category: '', code: '', price: 0, quantity: 0, description: '', offer: 0
    });
    this.selectedFiles = [];
    this.errorMessage = null;
    this.imageError = null;
  }

  editBook(book: Book) {
    this.showForm = true;
    this.editingBookId = book._id!;

    // تصحيح الفئة عند التعديل
    const correctedCategory = book.category === 'قصص الطفال' ? 'قصص أطفال' : book.category;

    this.bookForm.patchValue({
      name: book.name,
      title: book.title,
      category: this.allowedCategories.includes(correctedCategory) ? correctedCategory : this.allowedCategories[0],
      code: book.code || '',
      price: book.price,
      quantity: book.quantity,
      description: book.description || '',
      offer: book.offer || 0,
    });

    this.selectedFiles = book.imgs.map(img => ({ file: null, preview: this.getImageUrl(img) }));
    this.errorMessage = null;
    this.imageError = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFileChange(event: Event) {
    this.imageError = null;
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

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

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles];
    this.cdr.detectChanges();
  }

  isSubmitDisabled(): boolean {
    return this.bookForm.invalid || (!this.editingBookId && this.selectedFiles.length === 0);
  }

  submitBook() {
    if (this.isSubmitDisabled()) {
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح';
      return;
    }

    const bookData: Partial<Book> = {
      name: this.bookForm.value.name.trim(),
      title: this.bookForm.value.title.trim(),
      category: this.bookForm.value.category,
      code: this.bookForm.value.code?.trim() || '',
      price: Number(this.bookForm.value.price),
      quantity: Number(this.bookForm.value.quantity),
      description: this.bookForm.value.description?.trim() || '',
      offer: Number(this.bookForm.value.offer) || 0,
    };

    const files = this.selectedFiles.map(f => f.file).filter(f => f) as File[];

    this.isLoading = true;

    const action = this.editingBookId
      ? this.booksService.updateBook(this.editingBookId, bookData, files)
      : this.booksService.createBook(bookData, files);

    action.subscribe({
      next: () => this.resetAndReload(),
      error: (err) => this.handleError(this.editingBookId ? 'تحديث' : 'إض648', err)
    });
  }

  private resetAndReload() {
    this.loadBooks();
    this.showForm = false;
    this.bookForm.reset();
    this.selectedFiles = [];
    this.errorMessage = null;
    this.isLoading = false;
  }

  private handleError(action: string, err: any) {
    this.errorMessage = `خطأ في ${action} الكتاب: ` + (err.error?.message || err.message || 'غير معروف');
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  cancelForm() {
    this.showForm = false;
    this.bookForm.reset();
    this.editingBookId = null;
    this.selectedFiles = [];
    this.errorMessage = null;
    this.imageError = null;
  }

  openDeleteModal(id: string) { this.deleteModalId = id; }
  confirmDelete() {
    if (!this.deleteModalId) return;
    this.isLoading = true;
    this.booksService.deleteBook(this.deleteModalId).subscribe({
      next: () => { this.loadBooks(); this.deleteModalId = null; this.isLoading = false; },
      error: (err) => this.handleError('حذف', err)
    });
  }

  openOfferModal(id: string, offer: number) { this.offerModalId = id; this.offerModalValue = offer; }
  confirmOffer() {
    if (!this.offerModalId || this.offerModalValue < 0 || this.offerModalValue > 100) return;
    this.isLoading = true;
    this.booksService.addOffer(this.offerModalId, this.offerModalValue).subscribe({
      next: () => { this.loadBooks(); this.offerModalId = null; this.isLoading = false; },
      error: (err) => this.handleError('إضافة العرض', err)
    });
  }

  openStockModal(id: string, qty: number) { this.stockModalId = id; this.stockModalValue = qty; }
  confirmStock() {
    if (!this.stockModalId || this.stockModalValue < 0) return;
    this.isLoading = true;
    this.booksService.setStockStatus(this.stockModalId, this.stockModalValue).subscribe({
      next: () => { this.loadBooks(); this.stockModalId = null; this.isLoading = false; },
      error: (err) => this.handleError('تحديث المخزون', err)
    });
  }

  openImageModal(img: string) {
    const book = this.books.find(b => b.imgs.includes(img));
    this.imageModalUrls = book ? book.imgs : [img];
    this.currentImageIndex = book ? book.imgs.indexOf(img) : 0;
  }

  prevImage() { if (this.imageModalUrls && this.currentImageIndex > 0) this.currentImageIndex--; }
  nextImage() { if (this.imageModalUrls && this.currentImageIndex < this.imageModalUrls.length - 1) this.currentImageIndex++; }

  filterBooks() {
    this.filteredBooks = this.books.filter(book => {
      const catMatch = this.categoryFilter ? book.category === this.categoryFilter : true;
      const stockMatch = this.stockFilter ? book.stockStatus === this.stockFilter : true;
      return catMatch && stockMatch;
    });
    this.sortBooks();
  }

  sortBooks() {
    this.filteredBooks.sort((a, b) => {
      if (this.sortBy === 'price') return a.price - b.price;
      if (this.sortBy === 'quantity') return a.quantity - b.quantity;
      return a.name.localeCompare(b.name, 'ar');
    });
  }
}
