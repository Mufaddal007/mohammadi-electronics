import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ProductCatalogItem } from '../../models/product.model';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  specifications: string[];
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  quantity: number;
  imageUrl: string;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  searchQuery = '';
  selectedCategory = signal<string>('All');
  categories = ['All', 'Inverters', 'Batteries', 'Coolers', 'Fans', 'Stabilizers'];

  // Pagination state
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  ngOnInit() {
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
              ? (p.image_url.startsWith('http') || p.image_url.startsWith('data:') ? p.image_url : `https://mohammadielectronics.com/${p.image_url}`) 
              : ''
          };
        });
        this.products.set(mapped);
      },
      error: (err) => {
        console.error('Error loading products from backend API', err);
      }
    });
  }

  onSearchChange(val: string) {
    this.searchQuery = val;
    this.currentPage.set(1);
  }

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
    this.currentPage.set(1);
  }

  // Double filter implementation
  filteredProducts = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const cat = this.selectedCategory();
    let list = this.products();

    if (cat !== 'All') {
      list = list.filter(p => p.category === cat);
    }

    if (q) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.specifications.some(spec => spec.toLowerCase().includes(q))
      );
    }

    return list;
  });

  // Paginated items
  paginatedProducts = computed(() => {
    const list = this.filteredProducts();
    const page = this.currentPage();
    const size = this.pageSize();
    const startIndex = (page - 1) * size;
    return list.slice(startIndex, startIndex + size);
  });

  totalPages = computed(() => {
    const total = this.filteredProducts().length;
    const size = this.pageSize();
    return Math.ceil(total / size) || 1;
  });

  pageNumbers = computed(() => {
    const pages = this.totalPages();
    const arr = [];
    for (let i = 1; i <= pages; i++) {
      arr.push(i);
    }
    return arr;
  });

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.scrollToTop();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.scrollToTop();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.scrollToTop();
    }
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    // fallback to a clean glowing electric gradient placeholder block
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="100%" height="100%" fill="%230b1329"/><circle cx="200" cy="112" r="50" fill="%2314b8a6" opacity="0.1"/><path d="M210 82L185 122H210V152L235 112H210V82Z" fill="%2314b8a6" stroke="%2314b8a6" stroke-width="2"/></svg>';
  }
}
