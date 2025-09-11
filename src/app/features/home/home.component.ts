import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  contactForm: FormGroup;
  private heroSlideInterval: any;
  private bookSlideshowIntervals: any[] = [];
  private observer: IntersectionObserver | null = null;
  private swiper: Swiper | null = null;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.startHeroSlider();
    this.startBookSlider();
    this.startBookCardSlideshows();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.heroSlideInterval) {
      clearInterval(this.heroSlideInterval);
    }
    this.bookSlideshowIntervals.forEach(interval => clearInterval(interval));
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
  }

  startHeroSlider(): void {
    const slides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;

    this.heroSlideInterval = setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 3000);
  }

  startBookSlider(): void {
    this.swiper = new Swiper('.books-slider', {
      modules: [Navigation, Pagination],
      direction: 'horizontal',
      loop: true,
      slidesPerView: 3,
      slidesPerGroup: 1,
      spaceBetween: 20,
      navigation: {
        nextEl: '.slider-nav.next',
        prevEl: '.slider-nav.prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
          slidesPerGroup: 1,
          spaceBetween: 10,
        },
        768: {
          slidesPerView: 2,
          slidesPerGroup: 1,
          spaceBetween: 15,
        },
        1024: {
          slidesPerView: 3,
          slidesPerGroup: 1,
          spaceBetween: 20,
        },
      },
    });
  }

  startBookCardSlideshows(): void {
    const cards = document.querySelectorAll('.book-card');
    cards.forEach((card, index) => {
      const slides = card.querySelectorAll('.book-slide');
      let currentSlide = 0;

      const updateCardSlideshow = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
      };

      this.bookSlideshowIntervals[index] = setInterval(updateCardSlideshow, 2000);
    });
  }

  setupIntersectionObserver(): void {
    const achievementsSection = document.querySelector('.achievements-section');
    if (!achievementsSection) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.startCounterAnimation();
          this.observer?.unobserve(achievementsSection);
        }
      });
    }, { threshold: 0.5 });

    this.observer.observe(achievementsSection);
  }

  startCounterAnimation(): void {
    const counters = [
      { id: 'years-experience', target: 15, duration: 2000 },
      { id: 'books', target: 100, duration: 2000 },
      { id: 'stories', target: 250, duration: 2000 },
      { id: 'awards', target: 30, duration: 2000 }
    ];

    counters.forEach(counter => {
      const element = document.getElementById(counter.id);
      if (!element) return;

      let start = 0;
      const increment = counter.target / (counter.duration / 16);
      const updateCounter = () => {
        start += increment;
        if (start >= counter.target) {
          element.textContent = counter.target + '+';
        } else {
          element.textContent = Math.ceil(start) + '+';
          requestAnimationFrame(updateCounter);
        }
      };
      requestAnimationFrame(updateCounter);
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      console.log('Form Submitted:', this.contactForm.value);
      // Replace with actual API call to submit form data
      alert('تم إرسال الرسالة بنجاح!');
      this.contactForm.reset();
    }
  }

  addToCart(bookTitle: string): void {
    console.log(`Added to cart: ${bookTitle}`);
    // Replace with actual cart service logic
    alert(`تم إضافة "${bookTitle}" إلى السلة`);
  }

  addToFavorites(bookTitle: string): void {
    console.log(`Added to favorites: ${bookTitle}`);
    // Replace with actual favorites service logic
    alert(`تم إضافة "${bookTitle}" إلى المفضلة`);
  }
}
