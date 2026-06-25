import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SourcingService } from '../../services/sourcing.service';

@Component({
  selector: 'app-product-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-request.component.html',
  styleUrl: './product-request.component.css'
})
export class ProductRequestComponent {
  private sourcingService = inject(SourcingService);

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
      const contactInfo = `${this.phone.trim()} (${this.contactMethod})`;
      const requestedItem = (this.brand.trim() ? `${this.brand.trim()} ` : '') + this.productName.trim();

      this.sourcingService.submitDemand({
        customer_name: this.name.trim(),
        contact_info: contactInfo,
        requested_item_name: requestedItem,
        specifications: this.description.trim()
      }).subscribe({
        next: () => {
          this.successMessage.set('Sourcing request logged successfully! Our team will contact you shortly.');
          form.resetForm();
          this.contactMethod = 'Call';
        },
        error: (err) => {
          this.errorMessage.set('Failed to submit request: ' + err.message);
        }
      });
    } else {
      this.errorMessage.set('Please fill out all required fields correctly.');
    }
  }
}
