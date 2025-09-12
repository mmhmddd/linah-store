import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit, AfterViewInit {
  @ViewChildren('animatedElement') animatedElements!: QueryList<ElementRef>;

  // Statistics data
  stats = {
    books: { count: 500, label: 'كتاب متنوع', increment: 0, target: 500 },
    happyChildren: { count: 50000, label: 'طفل سعيد', increment: 0, target: 50000 },
    authors: { count: 25, label: 'مؤلف متميز', increment: 0, target: 25 },
    experience: { count: 5, label: 'سنوات خبرة', increment: 0, target: 5 }
  };

  // Features data
  features = [
    {
      icon: 'fas fa-book-open',
      title: 'محتوى تعليمي متميز',
      description: 'قصص تجمع بين المتعة والتعلم بأساليب تفاعلية حديثة'
    },
    {
      icon: 'fas fa-palette',
      title: 'رسوم فنية جذابة',
      description: 'رسوم ملونة عالية الجودة تأسر خيال الأطفال'
    },
    {
      icon: 'fas fa-heart',
      title: 'قيم إيجابية',
      description: 'نزرع القيم النبيلة والأخلاق الحميدة في نفوس الأطفال'
    },
    {
      icon: 'fas fa-users',
      title: 'تفاعل اجتماعي',
      description: 'قصص تعزز مهارات التواصل والتفاعل مع الآخرين'
    }
  ];

  // Values data
  values = [
    {
      icon: 'fas fa-gem',
      title: 'الجودة',
      description: 'نقدم أعلى مستويات الجودة في المحتوى والخدمة'
    },
    {
      icon: 'fas fa-lightbulb',
      title: 'الإبداع',
      description: 'أساليب مبتكرة وحديثة في تقديم المحتوى التعليمي'
    },
    {
      icon: 'fas fa-heart',
      title: 'الحب',
      description: 'نصنع كل قصة بحب وشغف حقيقي للأطفال'
    },
    {
      icon: 'fas fa-crown',
      title: 'التميز',
      description: 'نسعى للتميز والريادة في كل ما نقدمه'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'الأمان',
      description: 'محتوى آمن ومناسب لجميع الأعمار'
    },
    {
      icon: 'fas fa-handshake',
      title: 'الثقة',
      description: 'بناء علاقات طويلة الأمد مع عملائنا الأعزاء'
    }
  ];

  // Benefits data
  benefits = [
    {
      icon: 'fas fa-shipping-fast',
      title: 'توصيل سريع',
      description: 'خدمة توصيل سريعة وموثوقة لجميع المناطق'
    },
    {
      icon: 'fas fa-headset',
      title: 'دعم مستمر',
      description: 'فريق دعم متخصص لمساعدتكم على مدار الساعة'
    },
    {
      icon: 'fas fa-certificate',
      title: 'ضمان الجودة',
      description: 'جميع منتجاتنا معتمدة وحاصلة على ضمان الجودة'
    },
    {
      icon: 'fas fa-tags',
      title: 'أسعار تنافسية',
      description: 'أفضل الأسعار مع عروض وخصومات مستمرة'
    }
  ];

  // Achievements data
  achievements = [
    {
      icon: 'fas fa-trophy',
      text: 'أفضل متجر كتب للأطفال 2024'
    },
    {
      icon: 'fas fa-star',
      text: 'تقييم 4.9 من أصل 5'
    },
    {
      icon: 'fas fa-medal',
      text: 'شهادة الجودة الذهبية'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Component initialization
    this.initializeAnimations();
  }

  ngAfterViewInit(): void {
    // Setup intersection observer for scroll animations
    this.setupScrollAnimations();

    // Start counter animations
    setTimeout(() => {
      this.startCounterAnimations();
    }, 1000);
  }

  private initializeAnimations(): void {
    // Initialize any required animations or setup
    console.log('Initializing About page animations...');
  }

  private setupScrollAnimations(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
            }
          });
        },
        { threshold: 0.2 }
      );

      // Observe animated elements
      const elementsToAnimate = document.querySelectorAll(
        '.feature-card, .value-card, .benefit-card, .vision-card, .mission-card'
      );

      elementsToAnimate.forEach(element => {
        observer.observe(element);
      });
    }
  }

  private startCounterAnimations(): void {
    // Animate statistics counters
    Object.keys(this.stats).forEach(key => {
      const stat = this.stats[key as keyof typeof this.stats];
      this.animateCounter(stat);
    });
  }

  private animateCounter(stat: any): void {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepValue = stat.target / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      stat.count = Math.min(Math.floor(stepValue * currentStep), stat.target);

      if (currentStep >= steps) {
        stat.count = stat.target;
        clearInterval(timer);
      }
    }, stepDuration);
  }

  // Method to handle smooth scrolling to sections
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // Method to format numbers with Arabic separators
  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toString() + '+';
  }

  // Method to handle card hover effects
  onCardHover(event: MouseEvent, cardType: string): void {
    const card = event.currentTarget as HTMLElement;

    // Add custom hover effects if needed
    if (cardType === 'feature') {
      // Custom logic for feature cards
    } else if (cardType === 'value') {
      // Custom logic for value cards
    }
  }

  // Method to handle card click events
  onCardClick(item: any, cardType: string): void {
    // Handle card clicks for potential future interactivity
    console.log(`${cardType} card clicked:`, item);
  }

  // Method to get current year for dynamic content
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  // Method to check if animations should be enabled based on user preferences
  private shouldEnableAnimations(): boolean {
    if (typeof window !== 'undefined') {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  }

  // Method to handle responsive behavior
  private handleResponsive(): void {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        // Handle any responsive logic here
        const isMobile = window.innerWidth <= 768;
        // Adjust animations or layout based on screen size
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Initial call
    }
  }

  // Cleanup method
  ngOnDestroy(): void {
    // Clean up any subscriptions or event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResponsive);
    }
  }
}
