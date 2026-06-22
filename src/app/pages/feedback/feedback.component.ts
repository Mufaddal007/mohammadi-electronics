import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent {
  private dataService = inject(MockDataService);

  isSubmitted = signal(false);
  rating = signal<number>(0);
  hoverRating = signal<number>(0);
  submittedName = '';

  formData = {
    name: '',
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

      // Submit feedback to core reactive store
      this.dataService.addFeedback({
        name: this.submittedName || 'Anonymous Customer',
        rating: this.rating(),
        comments: this.formData.comments
      });

      this.isSubmitted.set(true);
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      comments: ''
    };
    this.rating.set(0);
    this.isSubmitted.set(false);
  }
}
