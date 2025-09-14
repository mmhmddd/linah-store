import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Add CommonModule
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationMessages {
  [key: string]: { [key: string]: string };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule], // Add CommonModule here
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  showPassword: boolean = false;
  showWelcome: boolean = true;
  isLoading: boolean = false;
  submitError: string = '';
  welcomeMessage: string = 'أهلاً وسهلاً! 👋';
  private subscriptions: Subscription = new Subscription();

  private validationMessages: ValidationMessages = {
    email: {
      required: 'البريد الإلكتروني مطلوب',
      email: 'يرجى إدخال بريد إلكتروني صحيح',
      pattern: 'تنسيق البريد الإلكتروني غير صحيح'
    },
    password: {
      required: 'كلمة المرور مطلوبة',
      minlength: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
      pattern: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام'
    }
  };

  private welcomeMessages: string[] = [
    '👋أهلاً وسهلاً',
    '👋مرحباً بك',
    '👋سعداء برؤيتك',
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loginForm = this.createForm();
  }

  // Rest of the component code remains unchanged
  // ... (ngOnInit, ngOnDestroy, createForm, etc.)
  // Include all methods from your original login.component.ts
  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('click', this.playClickSound.bind(this));
    }
  }

  private initializeComponent(): void {
    this.welcomeMessage = this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
    setTimeout(() => {
      this.showWelcome = false;
    }, 3000);

    if (isPlatformBrowser(this.platformId)) {
      this.addPageInteractivity();
    }
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
      ]],
      rememberMe: [false]
    });
  }

  private setupFormValidation(): void {
    this.subscriptions.add(
      this.loginForm.valueChanges.subscribe(() => {
        this.submitError = '';
        this.validateFormFields();
      })
    );
  }

  private validateFormFields(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control?.dirty && control.errors) {
        this.addShakeAnimation(key);
      }
    });
  }

  private addShakeAnimation(fieldName: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(fieldName);
      if (element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
      }
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      const firstErrorKey = Object.keys(field.errors)[0];
      return this.validationMessages[fieldName]?.[firstErrorKey] || 'خطأ في التحقق من البيانات';
    }
    return '';
  }

  onFieldFocus(fieldName: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(fieldName);
      if (element) {
        element.parentElement?.classList.add('focused');
      }
    }
  }

  onFieldBlur(fieldName: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(fieldName);
      if (element) {
        element.parentElement?.classList.remove('focused');
      }
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.playClickSound();
  }

  toggleRememberMe(): void {
    const currentValue = this.loginForm.get('rememberMe')?.value;
    this.loginForm.patchValue({ rememberMe: !currentValue });
    this.playClickSound();
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.submitError = '';

      try {
        const formData: LoginFormData = this.loginForm.value;
        await this.performLogin(formData);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.handleLoginError(error);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
      this.addShakeAnimation('loginForm');
    }
  }

  private async performLogin(formData: LoginFormData): Promise<void> {
    const credentials = {
      email: formData.email,
      password: formData.password
    };

    return new Promise((resolve, reject) => {
      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  private handleLoginError(error: any): void {
    this.submitError = error.message || 'حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.';
    this.addShakeAnimation('loginForm');
  }

  private markFormGroupTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/forgot-password']);
  }

  onSignup(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/register']);
  }

  private addPageInteractivity(): void {
    if (isPlatformBrowser(this.platformId)) {
      const shapes = document.querySelectorAll('.floating-shape');
      shapes.forEach(shape => {
        shape.addEventListener('mouseenter', () => {
          (shape as HTMLElement).style.animationDuration = '2s';
        });
        shape.addEventListener('mouseleave', () => {
          (shape as HTMLElement).style.animationDuration = '6s';
        });
      });
      document.addEventListener('click', this.playClickSound.bind(this));
    }
  }

  private playClickSound(): void {
    console.log('Click sound played');
  }

  get currentFormData(): LoginFormData {
    return this.loginForm.value;
  }

  get isFormReady(): boolean {
    return this.loginForm.valid && !this.isLoading;
  }
}
