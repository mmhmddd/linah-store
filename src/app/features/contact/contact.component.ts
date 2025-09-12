import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface FormData {
  name: string;
  subject: string;
  email: string;
  phone: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  faqs: FAQ[] = [
    {
      question: 'كيف يمكنني طلب الكتب؟',
      answer: 'يمكنك تصفح مجموعتنا من الكتب وإضافة ما يعجبك إلى السلة، ثم إتمام عملية الشراء بسهولة من خلال موقعنا.',
      isOpen: false
    },
    {
      question: 'ما هي مدة التوصيل؟',
      answer: 'نقوم بتوصيل الطلبات خلال 2-3 أيام عمل داخل القاهرة والجيزة، و3-5 أيام عمل للمحافظات الأخرى.',
      isOpen: false
    },
    {
      question: 'هل يمكنني إرجاع أو استبدال الكتب؟',
      answer: 'نعم، يمكنك إرجاع أو استبدال الكتب خلال 14 يوماً من تاريخ الاستلام، بشرط أن تكون في حالتها الأصلية.',
      isOpen: false
    },
    {
      question: 'ما هي وسائل الدفع المتاحة؟',
      answer: 'نقبل الدفع نقداً عند الاستلام، أو عن طريق التحويل البنكي، أو الدفع الإلكتروني من خلال فودافون كاش وأورانج موني.',
      isOpen: false
    },
    {
      question: 'هل تتوفر كتب لجميع الأعمار؟',
      answer: 'نعم، لدينا مجموعة واسعة من الكتب المناسبة لجميع الأعمار من سنة واحدة حتى 15 سنة، مقسمة حسب المرحلة العمرية.',
      isOpen: false
    },
    {
      question: 'كيف يمكنني معرفة الكتب المناسبة لعمر طفلي؟',
      answer: 'كل كتاب في موقعنا يحتوي على تصنيف عمري واضح، كما يمكنك التواصل معنا للحصول على استشارة شخصية لاختيار أفضل الكتب لطفلك.',
      isOpen: false
    }
  ];

  formData: FormData = {
    name: '',
    subject: '',
    email: '',
    phone: '',
    message: ''
  };

  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  onSubmit(): void {
    console.log('Form submitted:', this.formData);
    // Add your form submission logic here (e.g., API call)
    this.formData = { name: '', subject: '', email: '', phone: '', message: '' }; // Reset form
  }
}
