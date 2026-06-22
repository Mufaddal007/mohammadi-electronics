import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-enquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enquiry.component.html',
  styleUrl: './enquiry.component.css'
})
export class EnquiryComponent {
  private dataService = inject(MockDataService);

  isSubmitted = signal(false);
  submittedName = '';
  submittedAppliance = '';
  lastGeneratedId = '';

  formData = {
    name: '',
    phone: '',
    applianceType: '',
    issueDescription: ''
  };

  onSubmit(form: any) {
    if (form.valid) {
      this.submittedName = this.formData.name;
      this.submittedAppliance = this.formData.applianceType;
      this.lastGeneratedId = Date.now().toString().slice(-6);

      // Save to global shared state service
      this.dataService.addEnquiry({
        name: this.formData.name,
        phone: this.formData.phone,
        applianceType: this.formData.applianceType,
        issueDescription: this.formData.issueDescription
      });

      this.isSubmitted.set(true);
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      phone: '',
      applianceType: '',
      issueDescription: ''
    };
    this.isSubmitted.set(false);
  }
}
