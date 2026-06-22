import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Product } from '../../services/mock-data.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit {
  private dataService = inject(MockDataService);

  products = signal<Product[]>([]);
  searchQuery = '';
  selectedCategory = signal<string>('All');
  categories = ['All', 'Inverters', 'Batteries', 'Coolers', 'Fans', 'Stabilizers'];

  // Pagination state
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  ngOnInit() {
    this.dataService.getProducts().subscribe(prods => {
      this.products.set(prods);
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
