import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent {
  private feedbackService = inject(FeedbackService);

  isSubmitted = signal(false);
  rating = signal<number>(0);
  hoverRating = signal<number>(0);
  submittedName = '';

  formData = {
    name: '',
    email: '',
    comments: ''
  };

  setRating(stars: number) {
    this.rating.set(stars);
  }

  isStarActive(star: number): boolean {
    const hoverVal = this.hoverRating();
    if (hoverVal !== 0) {
      return star <= hoverVal;
    }
    return star <= this.rating();
  }

  onSubmit(form: any) {
    if (form.valid && this.rating() !== 0) {
      this.submittedName = this.formData.name.trim();

      const message = `[Rating: ${this.rating()} Stars] ${this.formData.comments.trim()}`;

      this.feedbackService.submitFeedback({
        name: this.submittedName || 'Anonymous Customer',
        email: this.formData.email.trim(),
        message: message
      }).subscribe({
        next: () => {
          this.isSubmitted.set(true);
        },
        error: (err) => {
          alert('Failed to submit feedback: ' + err.message);
        }
      });
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      email: '',
      comments: ''
    };
    this.rating.set(0);
    this.isSubmitted.set(false);
  }
}
