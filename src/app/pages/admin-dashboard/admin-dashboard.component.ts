import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService, Enquiry, Feedback } from '../../services/mock-data.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private dataService = inject(MockDataService);

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
    this.dataService.getStats().subscribe(res => {
      this.stats.set(res);
    });

    this.dataService.getEnquiries().subscribe(list => {
      this.recentEnquiries.set(list.slice(0, 4));
    });

    this.dataService.getFeedbacks().subscribe(list => {
      this.recentFeedbacks.set(list.slice(0, 3));
    });
  }
}
