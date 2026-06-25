import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../services/feedback.service';
import { Feedback } from '../../services/mock-data.service';

@Component({
  selector: 'app-admin-feedbacks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-feedbacks.component.html',
  styleUrl: './admin-feedbacks.component.css'
})
export class AdminFeedbacksComponent implements OnInit {
  private feedbackService = inject(FeedbackService);
  protected Math = Math; // expose Math to template for rounding

  feedbacks = signal<Feedback[]>([]);

  ngOnInit() {
    this.feedbackService.getFeedbacks().subscribe({
      next: (apiFeedbacks) => {
        const mapped: Feedback[] = apiFeedbacks.map(fb => {
          let rating = 5;
          let comments = fb.message;
          
          // Check for custom rating prefix: "[Rating: N Stars] "
          const match = fb.message.match(/^\[Rating:\s*(\d)\s*Stars\]\s*(.*)$/s);
          if (match) {
            rating = parseInt(match[1], 10);
            comments = match[2];
          }
          
          return {
            id: String(fb.id),
            name: fb.name || 'Anonymous Customer',
            rating: rating,
            comments: comments,
            date: fb.created_at || new Date().toISOString()
          };
        });
        this.feedbacks.set(mapped);
      },
      error: (err) => {
        console.error('Error loading feedbacks from backend API', err);
      }
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
