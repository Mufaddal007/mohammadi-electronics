import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Enquiry, ProductRequest } from '../../services/mock-data.service';

@Component({
  selector: 'app-admin-enquiries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-enquiries.component.html',
  styleUrl: './admin-enquiries.component.css'
})
export class AdminEnquiriesComponent implements OnInit {
  private dataService = inject(MockDataService);

  activeTab = signal<'service' | 'sourcing'>('service');
  enquiries = signal<Enquiry[]>([]);
  productRequests = signal<ProductRequest[]>([]);
  selectedFilter = signal<string>('All');
  sortOrder = 'newest';

  filterOptions = ['All', 'Pending', 'Resolved'];

  ngOnInit() {
    this.dataService.getEnquiries().subscribe(list => {
      this.enquiries.set(list);
    });

    this.dataService.getProductRequests().subscribe(list => {
      this.productRequests.set(list);
    });
  }

  toggleStatus(id: string) {
    this.dataService.toggleEnquiryStatus(id);
  }

  updateRequestStatus(id: string, status: ProductRequest['status']) {
    this.dataService.updateProductRequestStatus(id, status);
  }

  // Reactive sorting & filtering combining
  sortedEnquiries = computed(() => {
    const filterVal = this.selectedFilter();
    const order = this.sortOrder;
    let list = this.enquiries();

    if (filterVal !== 'All') {
      list = list.filter(e => e.status === filterVal);
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  });

  // Reactive sorting combining
  sortedProductRequests = computed(() => {
    const order = this.sortOrder;
    let list = this.productRequests();

    return list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  });
}
