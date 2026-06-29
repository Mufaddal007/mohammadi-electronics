import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { AdminOrderItem } from '../../models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  ordersList = signal<AdminOrderItem[]>([]);
  searchQuery = signal<string>('');
  
  errorMessage = signal<string>('');

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getAdminOrders().subscribe({
      next: (orders) => {
        this.ordersList.set(orders);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load tracking orders.');
      }
    });
  }

  resolveImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    return `https://mohammadielectronics.com/${url}`;
  }

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="75" viewBox="0 0 100 75"><rect width="100%" height="100%" fill="%230b1329"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2314b8a6" font-family="monospace" font-size="8">Product</text></svg>';
  }

  filteredOrders = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.ordersList();
    if (!query) return list;

    return list.filter(o => 
      o.customer_name.toLowerCase().includes(query) ||
      (o.phone && o.phone.toLowerCase().includes(query)) ||
      (o.product_name && o.product_name.toLowerCase().includes(query)) ||
      (o.order_status && o.order_status.toLowerCase().includes(query))
    );
  });
}
