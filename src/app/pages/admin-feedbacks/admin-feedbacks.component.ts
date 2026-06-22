import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService, Feedback } from '../../services/mock-data.service';

@Component({
  selector: 'app-admin-feedbacks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-feedbacks.component.html',
  styleUrl: './admin-feedbacks.component.css'
})
export class AdminFeedbacksComponent implements OnInit {
  private dataService = inject(MockDataService);
  protected Math = Math; // expose Math to template for rounding

  feedbacks = signal<Feedback[]>([]);

  ngOnInit() {
    this.dataService.getFeedbacks().subscribe(list => {
      this.feedbacks.set(list);
    });
  }

  // Reactive sorting chronologically
  sortedFeedbacks = computed(() => {
    return [...this.feedbacks()].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });

  // Calculate average dynamically
  averageScore = computed(() => {
    const list = this.feedbacks();
    if (list.length === 0) return 5.0;
    const total = list.reduce((sum, item) => sum + item.rating, 0);
    return parseFloat((total / list.length).toFixed(1));
  });
}
