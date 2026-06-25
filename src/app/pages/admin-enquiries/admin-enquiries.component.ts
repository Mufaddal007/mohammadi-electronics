import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Enquiry, ProductRequest } from '../../services/mock-data.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { SourcingService } from '../../services/sourcing.service';

@Component({
  selector: 'app-admin-enquiries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-enquiries.component.html',
  styleUrl: './admin-enquiries.component.css'
})
export class AdminEnquiriesComponent implements OnInit {
  private serviceRequestService = inject(ServiceRequestService);
  private sourcingService = inject(SourcingService);

  activeTab = signal<'service' | 'sourcing'>('service');
  enquiries = signal<Enquiry[]>([]);
  productRequests = signal<ProductRequest[]>([]);
  selectedFilter = signal<string>('All');
  sortOrder = 'newest';

  filterOptions = ['All', 'Pending', 'Resolved'];

  ngOnInit() {
    this.loadTickets();
    this.loadDemands();
  }

  loadTickets() {
    this.serviceRequestService.getTickets().subscribe({
      next: (apiTickets) => {
        const mapped: Enquiry[] = apiTickets.map(t => ({
          id: String(t.id),
          name: t.customer_name,
          phone: t.phone,
          applianceType: t.appliance_type,
          issueDescription: t.issue_description,
          date: t.created_at || new Date().toISOString(),
          status: (t.status as 'Pending' | 'Resolved') || 'Pending'
        }));
        this.enquiries.set(mapped);
      },
      error: (err) => {
        console.error('Error loading tickets from backend API', err);
      }
    });
  }

  loadDemands() {
    this.sourcingService.getDemands().subscribe({
      next: (apiDemands) => {
        const mapped: ProductRequest[] = apiDemands.map(d => {
          // Parse contact method from contact_info e.g. "+919988776655 (WhatsApp)"
          let contactMethod: 'Call' | 'WhatsApp' | 'Email' = 'Call';
          if (d.contact_info.toLowerCase().includes('whatsapp')) {
            contactMethod = 'WhatsApp';
          } else if (d.contact_info.toLowerCase().includes('email')) {
            contactMethod = 'Email';
          }

          return {
            id: String(d.id),
            name: d.customer_name,
            phone: d.contact_info,
            productName: d.requested_item_name,
            brand: '',
            description: d.specifications,
            contactMethod: contactMethod,
            date: d.created_at || new Date().toISOString(),
            status: (d.status as 'Pending' | 'Sourced' | 'Unobtainable') || 'Pending'
          };
        });
        this.productRequests.set(mapped);
      },
      error: (err) => {
        console.error('Error loading product demands from backend API', err);
      }
    });
  }

  toggleStatus(id: string) {
    this.enquiries.update(list => list.map(e => {
      if (e.id === id) {
        const next: 'Pending' | 'Resolved' = e.status === 'Pending' ? 'Resolved' : 'Pending';
        return { ...e, status: next };
      }
      return e;
    }));
  }

  updateRequestStatus(id: string, status: ProductRequest['status']) {
    this.productRequests.update(list => list.map(r => 
      r.id === id ? { ...r, status } : r
    ));
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
