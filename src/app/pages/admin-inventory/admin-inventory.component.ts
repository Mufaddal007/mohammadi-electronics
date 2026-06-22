import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Product } from '../../services/mock-data.service';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-inventory.component.html',
  styleUrl: './admin-inventory.component.css'
})
export class AdminInventoryComponent implements OnInit {
  private dataService = inject(MockDataService);

  products = signal<Product[]>([]);
  showForm = signal(false);
  isEditing = signal(false);
  editingId: string | null = null;
  rawSpecs = '';

  formData = {
    name: '',
    brand: '',
    category: '',
    price: 0,
    quantity: 0,
    stockStatus: 'in-stock' as Product['stockStatus'],
    imageUrl: ''
  };

  ngOnInit() {
    this.dataService.getProducts().subscribe(prods => {
      this.products.set(prods);
    });
  }

  toggleAddForm() {
    this.showForm.update(val => !val);
    if (!this.showForm()) {
      this.cancelForm();
    }
  }

  onQtyChange(qty: number) {
    if (qty === 0) {
      this.formData.stockStatus = 'out-of-stock';
    } else if (qty <= 3) {
      this.formData.stockStatus = 'low-stock';
    } else {
      this.formData.stockStatus = 'in-stock';
    }
  }

  onSubmit(form: any) {
    if (form.valid) {
      // parse raw specs into clean array
      const specsArray = this.rawSpecs
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const finalProductData = {
        name: this.formData.name,
        brand: this.formData.brand,
        category: this.formData.category,
        price: this.formData.price,
        quantity: this.formData.quantity,
        stockStatus: this.formData.stockStatus,
        specifications: specsArray,
        imageUrl: this.formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop&q=60'
      };

      if (this.isEditing() && this.editingId) {
        this.dataService.updateProduct({
          ...finalProductData,
          id: this.editingId
        });
      } else {
        this.dataService.addProduct(finalProductData);
      }

      this.cancelForm();
    }
  }

  editProduct(prod: Product) {
    this.isEditing.set(true);
    this.editingId = prod.id;
    this.rawSpecs = prod.specifications.join(', ');
    
    this.formData = {
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      price: prod.price,
      quantity: prod.quantity,
      stockStatus: prod.stockStatus,
      imageUrl: prod.imageUrl
    };
    
    this.showForm.set(true);
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product from the inventory?')) {
      this.dataService.deleteProduct(id);
    }
  }

  cancelForm() {
    this.formData = {
      name: '',
      brand: '',
      category: '',
      price: 0,
      quantity: 0,
      stockStatus: 'in-stock',
      imageUrl: ''
    };
    this.rawSpecs = '';
    this.isEditing.set(false);
    this.editingId = null;
    this.showForm.set(false);
  }

  getStockBadgeClass(status: Product['stockStatus']) {
    switch (status) {
      case 'in-stock':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'low-stock':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'out-of-stock':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
    }
  }

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="75" viewBox="0 0 100 75"><rect width="100%" height="100%" fill="%230b1329"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2314b8a6" font-family="monospace" font-size="8">Product</text></svg>';
  }
}
