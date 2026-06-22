import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-product-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-request.component.html',
  styleUrl: './product-request.component.css'
})
export class ProductRequestComponent {
  private dataService = inject(MockDataService);

  // Form Fields
  name = '';
  phone = '';
  productName = '';
  brand = '';
  description = '';
  contactMethod: 'Call' | 'WhatsApp' | 'Email' = 'Call';
  contactMethods: ('Call' | 'WhatsApp' | 'Email')[] = ['Call', 'WhatsApp', 'Email'];

  successMessage = signal('');
  errorMessage = signal('');

  onSubmit(form: any) {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (form.valid) {
      this.dataService.addProductRequest({
        name: this.name.trim(),
        phone: this.phone.trim(),
        productName: this.productName.trim(),
        brand: this.brand.trim(),
        description: this.description.trim(),
        contactMethod: this.contactMethod
      });

      this.successMessage.set('Sourcing request logged successfully! Our team will contact you shortly.');
      
      // Reset Form
      form.resetForm();
      this.contactMethod = 'Call';
    } else {
      this.errorMessage.set('Please fill out all required fields correctly.');
    }
  }
}
