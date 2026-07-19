import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ProductCatalogItem } from '../../models/product.model';

export interface InvoiceItem {
  name: string;
  rate: number;
  qty: number;
}

@Component({
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-invoices.component.html',
  styleUrl: './admin-invoices.component.css'
})
export class AdminInvoicesComponent implements OnInit {
  private productService = inject(ProductService);

  // Lists
  catalogProducts = signal<ProductCatalogItem[]>([]);
  paymentModes = ['UPI / Online', 'Cash', 'Card', 'Net Banking'];

  // Form State
  invoiceNo = '';
  invoiceDate = '';
  paymentMode = 'UPI / Online';
  
  customerName = '';
  customerAddress = '';
  customerMobile = '';

  items = signal<InvoiceItem[]>([
    { name: '', rate: 0, qty: 1 }
  ]);

  // Loading / Messages
  generating = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    // Set default values
    this.invoiceDate = new Date().toISOString().substring(0, 10);
    this.generateAutoInvoiceNo();

    // Fetch catalog products to allow auto-fill suggestions
    this.productService.getProducts().subscribe({
      next: (prods) => {
        this.catalogProducts.set(prods);
      },
      error: (err) => {
        console.error('Failed to load products for autofill suggestions', err);
      }
    });
  }

  generateAutoInvoiceNo() {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.invoiceNo = `ME-${year}-${rand}`;
  }

  addItem() {
    this.items.update(curr => [...curr, { name: '', rate: 0, qty: 1 }]);
  }

  removeItem(index: number) {
    if (this.items().length <= 1) {
      this.errorMessage.set('At least one item is required in the invoice.');
      return;
    }
    this.items.update(curr => curr.filter((_, idx) => idx !== index));
    this.errorMessage.set('');
  }

  onProductSelect(index: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    const prodId = Number(target.value);
    const prod = this.catalogProducts().find(p => p.id === prodId);
    if (prod) {
      this.items.update(curr => {
        const updated = [...curr];
        updated[index].name = prod.name;
        updated[index].rate = prod.price;
        return updated;
      });
    }
  }

  get grandTotal(): number {
    return this.items().reduce((total, item) => total + (item.rate * item.qty), 0);
  }

  generateInvoice() {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validations
    if (!this.invoiceNo.trim()) {
      this.errorMessage.set('Invoice number is required.');
      return;
    }
    if (!this.invoiceDate.trim()) {
      this.errorMessage.set('Invoice date is required.');
      return;
    }
    if (!this.customerName.trim()) {
      this.errorMessage.set('Customer name is required.');
      return;
    }
    if (!this.customerMobile.trim()) {
      this.errorMessage.set('Customer mobile number is required.');
      return;
    }
    if (this.items().length === 0) {
      this.errorMessage.set('Please add at least one item.');
      return;
    }

    for (let i = 0; i < this.items().length; i++) {
      const item = this.items()[i];
      if (!item.name.trim()) {
        this.errorMessage.set(`Description for item ${i + 1} is empty.`);
        return;
      }
      if (item.rate <= 0) {
        this.errorMessage.set(`Rate for item ${i + 1} must be positive.`);
        return;
      }
      if (item.qty <= 0) {
        this.errorMessage.set(`Quantity for item ${i + 1} must be at least 1.`);
        return;
      }
    }

    const payload = {
      invoice_no: this.invoiceNo.trim(),
      date: this.invoiceDate,
      payment_mode: this.paymentMode,
      customer: {
        name: this.customerName.trim(),
        address: this.customerAddress.trim(),
        mobile: this.customerMobile.trim()
      },
      items: this.items().map(it => ({
        name: it.name.trim(),
        rate: it.rate,
        qty: it.qty
      }))
    };

    this.generating.set(true);

    this.productService.generateInvoice(payload).subscribe({
      next: (blobResponse: Blob) => {
        this.generating.set(false);
        this.successMessage.set('Invoice generated successfully! Starting download...');

        // Trigger PDF Download
        const blob = new Blob([blobResponse], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Invoice_${this.invoiceNo.trim()}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);

        // Reset forms optionally or generate new no
        setTimeout(() => {
          this.successMessage.set('');
          this.generateAutoInvoiceNo();
        }, 3000);
      },
      error: (err) => {
        this.generating.set(false);
        this.errorMessage.set(err.message || 'Failed to connect to invoice backend server. Please verify reportlab package is installed.');
      }
    });
  }
}
