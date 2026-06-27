import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Enquiry, Feedback } from '../../services/mock-data.service';
import { ProductService } from '../../services/product.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { FeedbackService } from '../../services/feedback.service';
import { getCategoryNameById } from '../../models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private serviceRequestService = inject(ServiceRequestService);
  private feedbackService = inject(FeedbackService);

  stats = signal({
    totalProducts: 0,
    totalEnquiries: 0,
    pendingEnquiries: 0,
    averageRating: 5.0,
    mostPopularCategory: 'Inverters'
  });

  recentEnquiries = signal<Enquiry[]>([]);
  recentFeedbacks = signal<Feedback[]>([]);

  ngOnInit() {
    // 1. Load products for metrics
    this.productService.getProducts().subscribe({
      next: (apiProducts) => {
        const totalProducts = apiProducts.length;

        // determine most popular category (count products per category)
        const categoryCounts = apiProducts.reduce((acc, curr) => {
          const catName = getCategoryNameById(curr.category_id);
          acc[catName] = (acc[catName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let mostPopularCategory = 'Inverters';
        let maxCount = 0;
        for (const [cat, count] of Object.entries(categoryCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostPopularCategory = cat;
          }
        }

        this.stats.update(s => ({
          ...s,
          totalProducts,
          mostPopularCategory
        }));
      },
      error: (err) => console.error('Dashboard error loading products', err)
    });

    // 2. Load service requests for metrics
    this.serviceRequestService.getTickets().subscribe({
      next: (apiTickets) => {
        const totalEnquiries = apiTickets.length;
        const pendingEnquiries = apiTickets.filter(t => t.status === 'Pending').length;

        const mapped: Enquiry[] = apiTickets.map(t => ({
          id: String(t.id),
          name: t.customer_name,
          phone: t.phone,
          applianceType: t.appliance_type,
          issueDescription: t.issue_description,
          date: t.created_at || new Date().toISOString(),
          status: (t.status as 'Pending' | 'Resolved') || 'Pending'
        }));

        this.recentEnquiries.set(mapped.slice(0, 4));
        this.stats.update(s => ({
          ...s,
          totalEnquiries,
          pendingEnquiries
        }));
      },
      error: (err) => console.error('Dashboard error loading tickets', err)
    });

    // 3. Load feedbacks for metrics
    this.feedbackService.getFeedbacks().subscribe({
      next: (apiFeedbacks) => {
        const totalFeedbacks = apiFeedbacks.length;
        
        let totalRating = 0;
        const mapped: Feedback[] = apiFeedbacks.map(fb => {
          let rating = 5;
          let comments = fb.message;
          const match = fb.message.match(/^\[Rating:\s*(\d)\s*Stars\]\s*(.*)$/s);
          if (match) {
            rating = parseInt(match[1], 10);
            comments = match[2];
          }
          totalRating += rating;
          return {
            id: String(fb.id),
            name: fb.name || 'Anonymous Customer',
            rating: rating,
            comments: comments,
            date: fb.created_at || new Date().toISOString()
          };
        });

        const averageRating = totalFeedbacks > 0 ? parseFloat((totalRating / totalFeedbacks).toFixed(1)) : 5.0;

        this.recentFeedbacks.set(mapped.slice(0, 3));
        this.stats.update(s => ({
          ...s,
          averageRating
        }));
      },
      error: (err) => console.error('Dashboard error loading feedbacks', err)
    });
  }
}
