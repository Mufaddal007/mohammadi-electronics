import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { ProductCatalogItem, getCategoryNameById } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { OrderPlacementRequest } from '../../models/order.model';

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
export class CatalogComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  products = signal<Product[]>([]);
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  categories = ['All', 'Inverters', 'Batteries', 'Coolers', 'Fans', 'Stabilizers', 'Smart Home Automation'];

  // Pagination state
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  // Order Placement Modal state
  showOrderModal = signal(false);
  selectedProduct = signal<Product | null>(null);
  submittingOrder = signal(false);

  // Carousel State
  currentCarouselIndex = signal(0);
  private carouselInterval: any = null;

  newArrivals = computed(() => {
    // Top 5 latest products
    return [...this.products()]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 5);
  });

  initCarouselAutoPlay() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    this.carouselInterval = setInterval(() => {
      this.nextCarouselSlide();
    }, 5000);
  }

  nextCarouselSlide() {
    const total = this.newArrivals().length;
    if (total === 0) return;
    this.currentCarouselIndex.update(idx => (idx + 1) % total);
  }

  prevCarouselSlide() {
    const total = this.newArrivals().length;
    if (total === 0) return;
    this.currentCarouselIndex.update(idx => (idx - 1 + total) % total);
  }

  setCarouselSlide(idx: number) {
    this.currentCarouselIndex.set(idx);
    this.initCarouselAutoPlay();
  }

  ngOnDestroy() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  // Form Fields
  customerName = signal('');
  customerPhone = signal('');
  customerEmail = signal('');
  shippingAddress = signal('');
  orderQuantity = signal(1);

  // Total price computed signal
  orderTotalPrice = computed(() => {
    const prod = this.selectedProduct();
    return prod ? prod.price * this.orderQuantity() : 0;
  });

  openOrderModal(prod: Product) {
    this.selectedProduct.set(prod);
    this.orderQuantity.set(1);
    this.submittingOrder.set(false);

    // Pre-fill fields if user is logged in
    const email = this.authService.currentUserEmail();
    const username = this.authService.currentUserUsername();
    this.customerEmail.set(email || username || '');

    const fullName = this.authService.currentUserFullName();
    this.customerName.set(fullName || '');

    const phone = this.authService.currentUserPhone();
    this.customerPhone.set(phone || '');

    // Open modal
    this.showOrderModal.set(true);
  }

  closeOrderModal() {
    this.showOrderModal.set(false);
    this.selectedProduct.set(null);
    this.customerName.set('');
    this.customerPhone.set('');
    this.customerEmail.set('');
    this.shippingAddress.set('');
    this.orderQuantity.set(1);
  }

  submitOrder() {
    const prod = this.selectedProduct();
    if (!prod) return;

    if (!this.customerName().trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!this.customerPhone().trim()) {
      alert('Please enter your phone number.');
      return;
    }
    if (!this.shippingAddress().trim()) {
      alert('Please enter your shipping address.');
      return;
    }

    const payload: OrderPlacementRequest = {
      customer_name: this.customerName().trim(),
      phone: this.customerPhone().trim(),
      email: this.customerEmail().trim(),
      shipping_address: this.shippingAddress().trim(),
      product_id: Number(prod.id),
      quantity: this.orderQuantity(),
      total_price: this.orderTotalPrice()
    };

    this.submittingOrder.set(true);
    this.orderService.placeOrder(payload).subscribe({
      next: (res) => {
        this.submittingOrder.set(false);
        alert(res.message || 'Your order has been recorded successfully! Our team will contact you shortly.');
        this.closeOrderModal();
      },
      error: (err) => {
        this.submittingOrder.set(false);
        alert('Failed to place order: ' + err.message);
      }
    });
  }

  ngOnInit() {
    this.productService.getCategories().subscribe({
      next: (apiCategories) => {
        if (apiCategories && apiCategories.length > 0) {
          const catNames = apiCategories.map(c => c.name);
          this.categories = ['All', ...catNames];
        }
      },
      error: (err) => {
        console.error('Error loading categories from API, keeping hardcoded list', err);
      }
    });

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
            category: getCategoryNameById(p.category_id),
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
        this.initCarouselAutoPlay();
      },
      error: (err) => {
        console.error('Error loading products from backend API', err);
      }
    });
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
    this.currentPage.set(1);
  }

  // Double filter implementation
  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
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
