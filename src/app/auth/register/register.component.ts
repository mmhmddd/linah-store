import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAgreement: boolean;
}

interface ValidationMessages {
  [key: string]: { [key: string]: string };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  showPassword: boolean = false;
  showWelcome: boolean = true;
  isLoading: boolean = false;
  submitError: string = '';
  welcomeMessage: string = 'مرحباً بك';
  formProgress: number = 0;
  private subscriptions: Subscription = new Subscription();

  private validationMessages: ValidationMessages = {
    name: {
      required: 'الاسم الكامل مطلوب',
      minlength: 'الاسم يجب أن يكون 3 أحرف على الأقل'
    },
    email: {
      required: 'البريد الإلكتروني مطلوب',
      email: 'يرجى إدخال بريد إلكتروني صحيح',
      pattern: 'تنسيق البريد الإلكتروني غير صحيح'
    },
    password: {
      required: 'كلمة المرور مطلوبة',
      minlength: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
      pattern: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام'
    },
    confirmPassword: {
      required: 'تأكيد كلمة المرور مطلوب',
      mismatch: 'كلمة المرور غير متطابقة'
    },
    termsAgreement: {
      requiredTrue: 'يجب الموافقة على الشروط وسياسة الخصوصية'
    }
  };

  private welcomeMessages: string[] = [
    '🎉مرحباً بك ',
    '🚀انضم إلينا',
    '🌟ابدأ رحلتك'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.registerForm = this.createForm();
  }

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
      name: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
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
      confirmPassword: ['', [Validators.required]],
      termsAgreement: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  private setupFormValidation(): void {
    this.subscriptions.add(
      this.registerForm.valueChanges.subscribe(() => {
        this.submitError = '';
        this.validateFormFields();
        this.updateFormProgress();
      })
    );
  }

  private validateFormFields(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control?.dirty && control.errors) {
        this.addShakeAnimation(key);
      }
    });
  }

  private updateFormProgress(): void {
    const totalFields = Object.keys(this.registerForm.controls).length;
    let validFields = 0;
    Object.keys(this.registerForm.controls).forEach(key => {
      if (this.registerForm.get(key)?.valid) {
        validFields++;
      }
    });
    this.formProgress = (validFields / totalFields) * 100;
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
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors) {
      const firstErrorKey = Object.keys(field.errors)[0];
      return this.validationMessages[fieldName]?.[firstErrorKey] || 'خطأ في التحقق من البيانات';
    }
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['mismatch']) {
      return this.validationMessages['confirmPassword']['mismatch'];
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

  toggleTermsAgreement(): void {
    const currentValue = this.registerForm.get('termsAgreement')?.value;
    this.registerForm.patchValue({ termsAgreement: !currentValue });
    this.registerForm.get('termsAgreement')?.markAsDirty();
    this.registerForm.get('termsAgreement')?.markAsTouched();
    this.playClickSound();
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.submitError = '';

      try {
        const formData: RegisterFormData = this.registerForm.value;
        await this.performRegister(formData);
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      } catch (error: any) {
        this.handleRegisterError(error);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
      this.addShakeAnimation('registerForm');
    }
  }

  private async performRegister(formData: RegisterFormData): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (formData.email && formData.password && formData.name && formData.termsAgreement) {
          resolve();
        } else {
          reject({ message: 'بيانات غير صحيحة' });
        }
      }, 1500);
    });
  }

  private handleRegisterError(error: any): void {
    this.submitError = error.message || 'حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى.';
    this.addShakeAnimation('registerForm');
  }

  private markFormGroupTouched(): void {
    Object.values(this.registerForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  onLogin(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/login']);
  }

  private addPageInteractivity(): void {
    if (isPlatformBrowser(this.platformId)) {
      const shapes = document.querySelectorAll('.floating-shape');
      shapes.forEach(shape => {
        shape.addEventListener('mouseenter', () => {
          (shape as HTMLElement).style.animationDuration = '3s';
        });
        shape.addEventListener('mouseleave', () => {
          (shape as HTMLElement).style.animationDuration = '8s';
        });
      });
      document.addEventListener('click', this.playClickSound.bind(this));
    }
  }

  private playClickSound(): void {
    console.log('Click sound played');
  }

  get currentFormData(): RegisterFormData {
    return this.registerForm.value;
  }

  get isFormReady(): boolean {
    return this.registerForm.valid && !this.isLoading;
  }
}
