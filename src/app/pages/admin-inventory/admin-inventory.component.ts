import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Product } from '../../services/mock-data.service';
import { ProductService } from '../../services/product.service';
import { ProductSaveRequest, ProductCatalogItem, ProductSpec } from '../../models/product.model';

function getCategoryId(category: string): number {
  switch (category.toLowerCase()) {
    case 'inverters': return 1;
    case 'batteries': return 2;
    case 'coolers': return 3;
    case 'fans': return 4;
    case 'stabilizers': return 5;
    default: return 1;
  }
}

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-inventory.component.html',
  styleUrl: './admin-inventory.component.css'
})
export class AdminInventoryComponent implements OnInit {
  private dataService = inject(MockDataService);
  private productService = inject(ProductService);

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
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (apiProducts) => {
        const mapped: Product[] = apiProducts.map(p => {
          const brandSpec = p.specs?.find(s => s.spec_key.toLowerCase() === 'brand');
          const brand = brandSpec ? brandSpec.spec_value : (p.name.split(' ')[0] || 'Generic');
          
          const specifications = p.specs?.map(s => `${s.spec_key}: ${s.spec_value}`) || [];
          
          let stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
          if (p.stock_qty <= 0) {
            stockStatus = 'out-of-stock';
          } else if (p.stock_qty <= p.low_stock_threshold) {
            stockStatus = 'low-stock';
          }

          return {
            id: String(p.id),
            name: p.name,
            brand: brand,
            category: p.category_name,
            price: p.price,
            specifications: specifications,
            stockStatus: stockStatus,
            quantity: p.stock_qty,
            imageUrl: p.image_url
          };
        });
        this.products.set(mapped);
      },
      error: (err) => {
        console.error('Error loading products from REST API', err);
      }
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

      const specsObjArray: ProductSpec[] = specsArray.map(spec => {
        const colonIndex = spec.indexOf(':');
        if (colonIndex > -1) {
          return {
            spec_key: spec.substring(0, colonIndex).trim(),
            spec_value: spec.substring(colonIndex + 1).trim()
          };
        } else {
          return {
            spec_key: 'Feature',
            spec_value: spec
          };
        }
      });

      // Add default specs if brand is not in spec list
      const brandSpecIndex = specsObjArray.findIndex(s => s.spec_key.toLowerCase() === 'brand');
      if (brandSpecIndex === -1 && this.formData.brand) {
        specsObjArray.push({
          spec_key: 'Brand',
          spec_value: this.formData.brand.trim()
        });
      } else if (brandSpecIndex > -1 && this.formData.brand) {
        specsObjArray[brandSpecIndex].spec_value = this.formData.brand.trim();
      }

      const slug = this.formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload: ProductSaveRequest = {
        id: this.isEditing() && this.editingId ? Number(this.editingId) : null,
        category_id: getCategoryId(this.formData.category),
        name: this.formData.name.trim(),
        slug: slug,
        description: this.formData.name.trim(),
        price: this.formData.price,
        image_url: this.formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop&q=60',
        stock_qty: this.formData.quantity,
        low_stock_threshold: 3,
        specs: specsObjArray
      };

      this.productService.saveOrUpdateProduct(payload).subscribe({
        next: () => {
          this.loadProducts();
          this.cancelForm();
        },
        error: (err) => {
          alert('Failed to save product: ' + err.message);
        }
      });
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
      this.products.update(list => list.filter(p => p.id !== id));
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
